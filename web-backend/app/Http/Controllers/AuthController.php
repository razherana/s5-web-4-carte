<?php

namespace App\Http\Controllers;

use App\Auth\HybridGuard;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Kreait\Laravel\Firebase\Facades\Firebase;

use function Laravel\Prompts\error;
use function Laravel\Prompts\note;

class AuthController extends Controller
{
    /**
     * Register a new user.
     * Automatically tries Firebase first if internet is available, falls back to local registration.
     */
    public function register(Request $request): JsonResponse
    {
        // Check if we have internet connectivity
        if ($this->hasInternetConnection()) {
            try {
                return $this->registerWithFirebase($request);
            } catch (\Exception $e) {
                // Firebase failed, fall back to local registration
                return $this->registerLocal($request);
            }
        }

        // No internet connection, use local registration directly
        return $this->registerLocal($request);
    }

    /**
     * Register a new user locally.
     */
    protected function registerLocal(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6|confirmed',
            'role' => 'sometimes|string|in:user,manager',
        ]);

        $user = User::create([
            'email' => $validated['email'],
            'password' => $validated['password'],
            'role' => $validated['role'] ?? 'user',
            'firebase_uid' => null,
        ]);

        $token = HybridGuard::generateLocalToken($user);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'auth_mode' => 'local',
        ], 201);
    }

    /**
     * Register a new user with Firebase.
     * Creates user in Firebase and syncs to local database.
     */
    protected function registerWithFirebase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'sometimes|string|in:user,manager',
        ]);

        $auth = Firebase::auth();

        // Create user in Firebase
        $userProperties = [
            'email' => $validated['email'],
            'password' => $validated['password'],
            'emailVerified' => false,
            'disabled' => false,
        ];

        $firebaseUser = $auth->createUser($userProperties);
        $uid = $firebaseUser->uid;

        // Sign in to get the ID token
        $signInResult = $auth->signInWithEmailAndPassword($validated['email'], $validated['password']);
        $idToken = $signInResult->idToken();

        // Create user in local database
        $user = User::create([
            'firebase_uid' => $uid,
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User registered successfully with Firebase',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firebase_uid' => $user->firebase_uid,
            ],
            'token' => $idToken,
            'auth_mode' => 'firebase',
        ], 201);
    }

    /**
     * Login with email/password.
     * Automatically tries Firebase first if internet is available, falls back to local auth.
     */
    public function login(Request $request): JsonResponse
    {
        // Check if we have internet connectivity
        if ($this->hasInternetConnection()) {
            try {
                return $this->loginWithFirebase($request);
            } catch (\Exception $e) {

                // Firebase failed, fall back to local auth
                return $this->loginWithCredentials($request);
            }
        }

        // No internet connection, use local auth directly
        return $this->loginWithCredentials($request);
    }

    /**
     * Check if internet connection is available.
     */
    protected function hasInternetConnection(): bool
    {
        try {
            // Try to connect to Google's public DNS
            $connected = @fsockopen('www.google.com', 80, $errno, $errstr, 2);
            if ($connected) {
                fclose($connected);
                return true;
            }
            return false;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Login with email and password (local auth).
     */
    protected function loginWithCredentials(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        $token = HybridGuard::generateLocalToken($user);

        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'auth_mode' => 'local',
        ]);
    }

    /**
     * Login/Register with Firebase email and password.
     * Creates local user if doesn't exist.
     * Throws exception on failure to allow fallback to local auth.
     */
    protected function loginWithFirebase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $auth = Firebase::auth();

        error('Attempting Firebase authentication for ' . $validated['email']);

        // Sign in with email and password
        $signInResult = $auth->signInWithEmailAndPassword($validated['email'], $validated['password']);

        $uid = $signInResult->firebaseUserId();
        $firebaseUser = $auth->getUser($uid);
        $idToken = $signInResult->idToken();

        // Find or create user
        $user = User::where('firebase_uid', $uid)->first();

        if (!$user) {
            // Check if user exists with same email
            $user = User::where('email', $firebaseUser->email)->first();

            if ($user) {
                // Link Firebase to existing user
                $user->firebase_uid = $uid;
                $user->save();
            } else {
                // Create new user
                $user = User::create([
                    'firebase_uid' => $uid,
                    'email' => $firebaseUser->email,
                    'password' => Hash::make($validated['password']), // hash of password
                    'role' => 'user',
                ]);
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Firebase authentication successful',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firebase_uid' => $user->firebase_uid,
            ],
            'token' => $idToken,
            'auth_mode' => 'firebase',
        ]);
    }

    /**
     * Get the current authenticated user.
     */
    public function me(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firebase_uid' => $user->firebase_uid,
            ],
            'auth_mode' => $request->attributes->get('auth_mode', 'unknown'),
        ]);
    }

    /**
     * Logout (invalidate token on client side).
     */
    public function logout(): JsonResponse
    {
        // For stateless API, just return success
        // Client should remove the token
        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Sync local user with Firebase.
     * Call this when coming back online.
     */
    public function syncWithFirebase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'firebase_token' => 'required|string',
        ]);

        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized',
            ], 401);
        }

        try {
            $auth = Firebase::auth();
            $verifiedIdToken = $auth->verifyIdToken($validated['firebase_token']);
            $uid = $verifiedIdToken->claims()->get('sub');

            // Update user's Firebase UID
            $user->firebase_uid = $uid;
            $user->save();

            return response()->json([
                'success' => true,
                'message' => 'User synced with Firebase',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'firebase_uid' => $user->firebase_uid,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Firebase sync failed',
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
