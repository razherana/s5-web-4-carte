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
                // Check if the exception is due to error in auth
                error($e->getMessage());
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
            'password' => 'required|min:6',
            'role' => 'sometimes|string|in:user,manager',
        ]);

        $user = User::create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user',
            'firebase_uid' => null,
        ]);

        $token = HybridGuard::generateLocalToken($user);
        $refreshToken = HybridGuard::generateRefreshToken($user);

        return $this->successResponse([
            'message' => 'User registered successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'refresh_token' => $refreshToken,
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

        // Generate our JWT with Firebase token embedded
        $token = HybridGuard::generateLocalToken($user, $idToken, 'firebase');
        $refreshToken = HybridGuard::generateRefreshToken($user);

        return $this->successResponse([
            'message' => 'User registered successfully with Firebase',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firebase_uid' => $user->firebase_uid,
            ],
            'token' => $token,
            'refresh_token' => $refreshToken,
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

        // Check if account is locked
        if ($user && $user->isLocked()) {
            return $this->errorResponse(
                'ACCOUNT_LOCKED',
                'Account is locked due to too many failed login attempts. Please try again later or contact an administrator.',
                423
            );
        }

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            // Increment failed login attempts
            if ($user) {
                $user->incrementLoginAttempts();
            }

            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Reset login attempts on successful login
        $user->resetLoginAttempts();

        $token = HybridGuard::generateLocalToken($user);
        $refreshToken = HybridGuard::generateRefreshToken($user);

        return $this->successResponse([
            'message' => 'Login successful',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'refresh_token' => $refreshToken,
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
                // Check if account is locked
                if ($user->isLocked()) {
                    return $this->errorResponse(
                        'ACCOUNT_LOCKED',
                        'Account is locked due to too many failed login attempts. Please try again later or contact an administrator.',
                        423
                    );
                }

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
        } else {
            // Check if account is locked
            if ($user->isLocked()) {
                return $this->errorResponse(
                    'ACCOUNT_LOCKED',
                    'Account is locked due to too many failed login attempts. Please try again later or contact an administrator.',
                    423
                );
            }
        }

        // Reset login attempts on successful login
        $user->resetLoginAttempts();

        // Generate our JWT with Firebase token embedded
        $token = HybridGuard::generateLocalToken($user, $idToken, 'firebase');
        $refreshToken = HybridGuard::generateRefreshToken($user);

        return $this->successResponse([
            'message' => 'Firebase authentication successful',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firebase_uid' => $user->firebase_uid,
            ],
            'token' => $token,
            'refresh_token' => $refreshToken,
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
            return $this->errorResponse('UNAUTHORIZED', 'Unauthorized', 401);
        }

        return $this->successResponse([
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
        return $this->successResponse([
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
            return $this->errorResponse('UNAUTHORIZED', 'Unauthorized', 401);
        }

        try {
            $auth = Firebase::auth();
            $verifiedIdToken = $auth->verifyIdToken($validated['firebase_token']);
            $uid = $verifiedIdToken->claims()->get('sub');

            // Update user's Firebase UID
            $user->firebase_uid = $uid;
            $user->save();

            return $this->successResponse([
                'message' => 'User synced with Firebase',
                'user' => [
                    'id' => $user->id,
                    'email' => $user->email,
                    'role' => $user->role,
                    'firebase_uid' => $user->firebase_uid,
                ],
            ]);
        } catch (\Exception $e) {
            return $this->errorResponse('FIREBASE_SYNC_FAILED', $e->getMessage(), 400);
        }
    }

    /**
     * Refresh access token using refresh token.
     */
    public function refresh(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'refresh_token' => 'required|string',
        ]);

        $user = HybridGuard::validateRefreshToken($validated['refresh_token']);

        if (!$user) {
            return $this->errorResponse('INVALID_REFRESH_TOKEN', 'Invalid or expired refresh token', 401);
        }

        // Generate new tokens
        $token = HybridGuard::generateLocalToken($user);
        $refreshToken = HybridGuard::generateRefreshToken($user);

        // Revoke old refresh token
        HybridGuard::revokeRefreshToken($validated['refresh_token']);

        return $this->successResponse([
            'message' => 'Token refreshed successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
            'token' => $token,
            'refresh_token' => $refreshToken,
            'auth_mode' => 'local',
        ]);
    }

    /**
     * Unlock a user account (manager only).
     */
    public function unlockAccount(Request $request): JsonResponse
    {
        /** @var User|null $currentUser */
        $currentUser = Auth::user();

        $validated = $request->validate([
            'user_id' => 'required|integer|exists:users,id',
        ]);

        $user = User::find($validated['user_id']);

        if (!$user) {
            return $this->errorResponse('USER_NOT_FOUND', 'User not found', 404);
        }

        // Reset login attempts and unlock
        $user->resetLoginAttempts();

        return $this->successResponse([
            'message' => 'User account unlocked successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'login_attempts' => $user->login_attempts,
                'locked_until' => $user->locked_until,
            ],
        ]);
    }
}
