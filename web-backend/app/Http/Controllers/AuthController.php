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

class AuthController extends Controller
{
    /**
     * Register a new user (local auth).
     */
    public function register(Request $request): JsonResponse
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
     * Login with email/password or Firebase token.
     * Automatically detects auth mode based on provided credentials.
     */
    public function login(Request $request): JsonResponse
    {
        // Check if Firebase token is provided
        if ($request->has('firebase_token')) {
            return $this->loginWithFirebase($request);
        }

        // Otherwise, use email/password
        return $this->loginWithCredentials($request);
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
     * Login/Register with Firebase token.
     * Creates local user if doesn't exist.
     */
    protected function loginWithFirebase(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'firebase_token' => 'required|string',
        ]);

        try {
            $auth = Firebase::auth();
            $verifiedIdToken = $auth->verifyIdToken($validated['firebase_token']);
            $uid = $verifiedIdToken->claims()->get('sub');
            $firebaseUser = $auth->getUser($uid);

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
                        'password' => Hash::make(bin2hex(random_bytes(16))), // Random password
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
                'token' => $validated['firebase_token'],
                'auth_mode' => 'firebase',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Firebase authentication failed',
                'message' => $e->getMessage(),
            ], 401);
        }
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
