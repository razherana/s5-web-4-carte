<?php

namespace App\Http\Controllers;

use App\Auth\HybridGuard;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Kreait\Firebase\Auth\SignIn\FailedToSignIn;
use Kreait\Laravel\Firebase\Facades\Firebase;

use OpenApi\Attributes as OA;

use function Laravel\Prompts\error;

class AuthController extends Controller
{
    #[OA\Post(
        path: '/api/auth/register',
        tags: ['Authentication'],
        summary: 'Register a new user',
        description: 'Registers a new user. Tries Firebase first if internet is available, falls back to local registration.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 6, example: 'password123'),
                    new OA\Property(property: 'role', type: 'string', enum: ['user', 'manager'], example: 'user')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'User registered successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'User registered successfully'),
                                new OA\Property(
                                    property: 'user',
                                    properties: [
                                        new OA\Property(property: 'id', type: 'integer', example: 1),
                                        new OA\Property(property: 'email', type: 'string', example: 'user@example.com'),
                                        new OA\Property(property: 'role', type: 'string', example: 'user')
                                    ],
                                    type: 'object'
                                ),
                                new OA\Property(property: 'token', type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'),
                                new OA\Property(property: 'refresh_token', type: 'string', example: 'a1b2c3d4e5f6...'),
                                new OA\Property(property: 'auth_mode', type: 'string', example: 'local')
                            ],
                            type: 'object'
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
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
            'synced' => 'created',
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
            'synced' => 'synced',
        ]);

        // Generate our JWT with Firebase token embedded
        $token = HybridGuard::generateLocalToken($user, $idToken, 'firebase');
        $refreshToken = HybridGuard::generateRefreshToken($user);

        new SyncController()->syncUsersManually($user, $uid); // Trigger sync after registration

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

    #[OA\Post(
        path: '/api/auth/login',
        tags: ['Authentication'],
        summary: 'Login with email and password',
        description: 'Authenticates a user. Tries Firebase first if internet is available, falls back to local auth.',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['email', 'password'],
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', example: 'password123')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Login successful',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 423,
                description: 'Account locked due to too many failed attempts',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Invalid credentials',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
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
        error('Attempting local authentication for ' . $request->input('email'));

        $validated = $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::where('email', $validated['email'])->first();

        // Check if account is blocked
        if ($user && $user->isBlocked()) {
            return $this->errorResponse(
                'ACCOUNT_BLOCKED',
                'Your account has been blocked by an administrator. Please contact support for assistance.',
                403
            );
        }

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
        try {
            $signInResult = $auth->signInWithEmailAndPassword($validated['email'], $validated['password']);
        } catch (FailedToSignIn $failedEx) {
            // Increment login attempts for user if exists
            $existingUser = User::where('email', $validated['email'])->first();
            if ($existingUser) {
                $existingUser->incrementLoginAttempts(true); // synced = true

                // Update firestore too
                if ($existingUser->firebase_uid)
                    new SyncController()->syncUsersManually($existingUser, $existingUser->firebase_uid);
            }
            // Re-throw to allow fallback to local auth
            throw $failedEx;
        }

        $uid = $signInResult->firebaseUserId();
        $firebaseUser = $auth->getUser($uid);
        $idToken = $signInResult->idToken();

        // Find or create user
        $user = User::where('firebase_uid', $uid)->first();

        if (!$user) {
            // Check if user exists with same email
            $user = User::where('email', $firebaseUser->email)->first();

            if ($user) {
                // Check if account is blocked
                if ($user->isBlocked()) {
                    return $this->errorResponse(
                        'ACCOUNT_BLOCKED',
                        'Your account has been blocked by an administrator. Please contact support for assistance.',
                        403
                    );
                }

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
                    'synced' => 'synced',
                ]);
            }
        } else {
            // Check if account is blocked
            if ($user->isBlocked()) {
                return $this->errorResponse(
                    'ACCOUNT_BLOCKED',
                    'Your account has been blocked by an administrator. Please contact support for assistance.',
                    403
                );
            }

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

    #[OA\Get(
        path: '/api/auth/me',
        tags: ['User'],
        summary: 'Get current authenticated user',
        description: 'Returns the currently authenticated user\'s information',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User information retrieved successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
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

    #[OA\Post(
        path: '/api/auth/logout',
        tags: ['Authentication'],
        summary: 'Logout user',
        description: 'Logs out the current user (client should remove the token)',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Logged out successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            )
        ]
    )]
    public function logout(): JsonResponse
    {
        // For stateless API, just return success
        // Client should remove the token
        return $this->successResponse([
            'message' => 'Logged out successfully',
        ]);
    }

    #[OA\Post(
        path: '/api/auth/sync-firebase',
        tags: ['User'],
        summary: 'Sync local user with Firebase',
        description: 'Updates the user\'s Firebase UID when coming back online',
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['firebase_token'],
                properties: [
                    new OA\Property(property: 'firebase_token', type: 'string', example: 'firebase.id.token.here')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User synced with Firebase successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 400,
                description: 'Firebase sync failed',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
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

    #[OA\Post(
        path: '/api/auth/refresh',
        tags: ['Authentication'],
        summary: 'Refresh access token',
        description: 'Generates new access and refresh tokens using a valid refresh token',
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['refresh_token'],
                properties: [
                    new OA\Property(property: 'refresh_token', type: 'string', example: 'a1b2c3d4e5f6...')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Token refreshed successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Invalid or expired refresh token',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
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

    #[OA\Post(
        path: '/unlock-account',
        tags: ['User'],
        summary: 'Unlock a user account (Manager only)',
        description: 'Resets login attempts and unlocks a locked user account. Only managers can perform this action.',
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['user_id'],
                properties: [
                    new OA\Property(property: 'user_id', type: 'integer', example: 2)
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User account unlocked successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden - Only managers can unlock accounts',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 404,
                description: 'User not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
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

    #[OA\Put(
        path: '/api/auth/profile',
        tags: ['User'],
        summary: 'Update user profile',
        description: 'Updates the authenticated user\'s profile information',
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'newemail@example.com'),
                    new OA\Property(property: 'password', type: 'string', example: 'newpassword123'),
                    new OA\Property(property: 'current_password', type: 'string', example: 'currentpassword123', description: 'Required when changing password'),
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Profile updated successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function updateProfile(Request $request): JsonResponse
    {
        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            return $this->errorResponse('UNAUTHORIZED', 'Unauthorized', 401);
        }

        $validated = $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes|min:6',
            'current_password' => 'required_with:password',
        ]);

        // If password is being changed, verify current password
        if (isset($validated['password'])) {
            if (!isset($validated['current_password']) || !Hash::check($validated['current_password'], $user->password)) {
                throw ValidationException::withMessages([
                    'current_password' => ['The current password is incorrect.'],
                ]);
            }
            $user->password = Hash::make($validated['password']);
        }

        // Update email if provided
        if (isset($validated['email'])) {
            $user->email = $validated['email'];
        }

        // Try to update Firebase if user has a Firebase UID and we have internet
        $firebaseSynced = false;
        if ($user->firebase_uid && $this->hasInternetConnection()) {
            try {
                $auth = Firebase::auth();
                $updateProperties = [];

                // Update email in Firebase if changed
                if (isset($validated['email'])) {
                    $updateProperties['email'] = $validated['email'];
                }

                // Update password in Firebase if changed
                if (isset($validated['password'])) {
                    $updateProperties['password'] = $validated['password'];
                }

                if (!empty($updateProperties)) {
                    $auth->updateUser($user->firebase_uid, $updateProperties);
                    $firebaseSynced = true;
                }

                // Also sync firestore data
                new SyncController()->syncUsersManually($user, $user->firebase_uid);
            } catch (\Exception $e) {
                // Log the error but continue with local update
                error('Firebase update failed: ' . $e->getMessage());
                // Mark as needing sync later
                $user->synced = 'updated';
            }
        }

        // Mark user as updated for sync if not synced with Firebase
        if ($user->isDirty()) {
            if ($firebaseSynced) {
                $user->synced = 'synced';
            } else {
                $user->synced = 'updated';
            }
            $user->save();
        }

        return $this->successResponse([
            'message' => 'Profile updated successfully',
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'firebase_uid' => $user->firebase_uid,
                'synced' => $user->synced,
            ],
            'firebase_synced' => $firebaseSynced,
        ]);
    }
}
