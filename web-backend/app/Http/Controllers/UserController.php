<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Users', description: 'User management endpoints')]
class UserController extends Controller
{
    #[OA\Get(
        path: '/api/users',
        tags: ['Users'],
        summary: 'Get all users',
        description: 'Retrieves all users. Manager only.',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of users retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/User')
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden - Manager only',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function index(Request $request): JsonResponse
    {
        // Try Firestore first if internet is available
        if ($this->hasInternetConnection()) {
            try {
                return $this->indexFromFirestore($request);
            } catch (\Exception $e) {
                Log::warning('Failed to get users from Firestore, falling back to local: ' . $e->getMessage());
            }
        }

        return $this->indexFromLocal($request);
    }

    /**
     * Get all users from Firestore.
     */
    protected function indexFromFirestore(Request $request): JsonResponse
    {
        Log::info('Getting all users from Firestore');

        $firestore = Firebase::firestore()->database();
        $collection = $firestore->collection('users');
        $documents = $collection->documents();

        $users = [];
        foreach ($documents as $document) {
            if ($document->exists()) {
                $data = $document->data();
                $data['firebase_uid'] = $document->id();
                // Don't expose password
                unset($data['password']);
                $users[] = $data;
            }
        }

        Log::info('Retrieved ' . count($users) . ' users from Firestore');

        return $this->successResponse($users);
    }

    /**
     * Get all users from local database.
     */
    protected function indexFromLocal(Request $request): JsonResponse
    {
        Log::info('Getting all users from local database');

        $users = User::all();

        Log::info('Retrieved ' . $users->count() . ' users from local database');

        return $this->successResponse($users);
    }

    #[OA\Get(
        path: '/api/users/{id}',
        tags: ['Users'],
        summary: 'Get a specific user',
        description: 'Retrieves a user by their ID. Manager only.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'User ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'User not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function show(int $id): JsonResponse
    {
        // Try Firestore first if internet is available
        if ($this->hasInternetConnection()) {
            try {
                return $this->showFromFirestore($id);
            } catch (\Exception $e) {
                Log::warning('Failed to get user from Firestore, falling back to local: ' . $e->getMessage());
            }
        }

        return $this->showFromLocal($id);
    }

    /**
     * Get a user from Firestore by ID.
     */
    protected function showFromFirestore(int $id): JsonResponse
    {
        Log::info('Getting user ' . $id . ' from Firestore');

        // First get the user from local to get firebase_uid
        $localUser = User::find($id);
        if (!$localUser) {
            return $this->errorResponse('NOT_FOUND', 'User not found', 404);
        }

        $docId = $localUser->firebase_uid ?? (string) $localUser->id;
        $firestore = Firebase::firestore()->database();
        $docRef = $firestore->collection('users')->document($docId);
        $snapshot = $docRef->snapshot();

        if (!$snapshot->exists()) {
            Log::warning('User not found in Firestore, returning local data');
            return $this->showFromLocal($id);
        }

        $data = $snapshot->data();
        $data['firebase_uid'] = $snapshot->id();
        // Don't expose password
        unset($data['password']);

        Log::info('Retrieved user ' . $id . ' from Firestore');

        return $this->successResponse($data);
    }

    /**
     * Get a user from local database by ID.
     */
    protected function showFromLocal(int $id): JsonResponse
    {
        Log::info('Getting user ' . $id . ' from local database');

        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', 'User not found', 404);
        }

        Log::info('Retrieved user ' . $id . ' from local database');

        return $this->successResponse($user);
    }

    #[OA\Post(
        path: '/api/users',
        tags: ['Users'],
        summary: 'Create a new user',
        description: 'Creates a new user. Manager only.',
        security: [['bearerAuth' => []]],
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
                description: 'User created successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'sometimes|string|in:user,manager',
        ]);

        $firebaseUid = null;
        $syncedStatus = 'created';

        // Try to create in Firebase first if internet is available
        if ($this->hasInternetConnection()) {
            try {
                Log::info('Creating user in Firebase Auth');
                $auth = Firebase::auth();

                $userProperties = [
                    'email' => $validated['email'],
                    'password' => $validated['password'],
                    'emailVerified' => false,
                    'disabled' => false,
                ];

                $firebaseUser = $auth->createUser($userProperties);
                $firebaseUid = $firebaseUser->uid;

                // Also create in Firestore
                Log::info('Creating user in Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('users')->document($firebaseUid);
                $docRef->set([
                    'email' => $validated['email'],
                    'role' => $validated['role'] ?? 'user',
                    'login_attempts' => 0,
                    'locked_until' => null,
                    'blocked' => false,
                ]);

                $syncedStatus = 'synced';
                Log::info('User created in Firebase successfully');
            } catch (\Exception $e) {
                Log::warning('Failed to create user in Firebase: ' . $e->getMessage());
            }
        } else {
            Log::info('No internet connection, creating user locally only');
        }

        // Create in local database
        Log::info('Creating user in local database');
        $user = User::create([
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'role' => $validated['role'] ?? 'user',
            'firebase_uid' => $firebaseUid,
            'login_attempts' => 0,
            'locked_until' => null,
            'blocked' => false,
            'synced' => $syncedStatus,
        ]);

        Log::info('User ' . $user->id . ' created successfully (synced: ' . $syncedStatus . ')');

        return $this->successResponse($user, 201);
    }

    #[OA\Put(
        path: '/api/users/{id}',
        tags: ['Users'],
        summary: 'Update a user',
        description: 'Updates an existing user. Manager only.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'User ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
                    new OA\Property(property: 'password', type: 'string', format: 'password', minLength: 6, example: 'newpassword123'),
                    new OA\Property(property: 'role', type: 'string', enum: ['user', 'manager'], example: 'user')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'User updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/User'),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'User not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 422,
                description: 'Validation error',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function update(Request $request, int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', 'User not found', 404);
        }

        $validated = $request->validate([
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'sometimes|min:6',
            'role' => 'sometimes|string|in:user,manager',
        ]);

        $syncedStatus = $user->synced;

        // Try to update in Firebase first if internet is available
        if ($this->hasInternetConnection()) {
            try {
                if ($user->firebase_uid) {
                    Log::info('Updating user ' . $id . ' in Firebase');
                    $auth = Firebase::auth();

                    $updateProperties = [];
                    if (isset($validated['email'])) {
                        $updateProperties['email'] = $validated['email'];
                    }
                    if (isset($validated['password'])) {
                        $updateProperties['password'] = $validated['password'];
                    }

                    if (!empty($updateProperties)) {
                        $auth->updateUser($user->firebase_uid, $updateProperties);
                    }

                    // Update in Firestore
                    Log::info('Updating user ' . $id . ' in Firestore');
                    $firestore = Firebase::firestore()->database();
                    $docRef = $firestore->collection('users')->document($user->firebase_uid);

                    $firestoreData = [];
                    if (isset($validated['email'])) $firestoreData['email'] = $validated['email'];
                    if (isset($validated['role'])) $firestoreData['role'] = $validated['role'];

                    if (!empty($firestoreData)) {
                        $docRef->set($firestoreData, ['merge' => true]);
                    }

                    $syncedStatus = 'synced';
                    Log::info('User ' . $id . ' updated in Firebase successfully');
                }
            } catch (\Exception $e) {
                Log::warning('Failed to update user in Firebase: ' . $e->getMessage());
                if ($user->synced === 'synced') {
                    $syncedStatus = 'updated';
                }
            }
        } else {
            Log::info('No internet connection, updating user locally only');
            if ($user->synced === 'synced') {
                $syncedStatus = 'updated';
            }
        }

        // Update in local database
        Log::info('Updating user ' . $id . ' in local database');
        $updateData = [];
        if (isset($validated['email'])) $updateData['email'] = $validated['email'];
        if (isset($validated['password'])) $updateData['password'] = Hash::make($validated['password']);
        if (isset($validated['role'])) $updateData['role'] = $validated['role'];
        $updateData['synced'] = $syncedStatus;

        $user->update($updateData);

        Log::info('User ' . $id . ' updated successfully (synced: ' . $syncedStatus . ')');

        return $this->successResponse($user);
    }

    #[OA\Post(
        path: '/api/users/{id}/unblock',
        tags: ['Users'],
        summary: 'Unblock a locked user account',
        description: 'Resets login attempts and unlocks a user account. Manager only.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'User ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User unblocked successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'User account unlocked successfully'),
                                new OA\Property(property: 'user', ref: '#/components/schemas/User')
                            ],
                            type: 'object'
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'User not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function unblock(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', 'User not found', 404);
        }

        Log::info('Unblocking user ' . $id);

        $user->resetLoginAttempts();
        $user->blocked = false;
        $user->save();

        // Try to sync with Firebase if internet is available
        if ($this->hasInternetConnection() && $user->firebase_uid) {
            try {
                Log::info('Syncing user unblock to Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('users')->document($user->firebase_uid);
                $docRef->set([
                    'login_attempts' => 0,
                    'locked_until' => null,
                    'blocked' => false,
                ], ['merge' => true]);

                // Also enable in Firebase Auth
                Log::info('Enabling user in Firebase Auth');
                $auth = Firebase::auth();
                $auth->updateUser($user->firebase_uid, ['disabled' => false]);

                Log::info('User unblock synced to Firebase');
            } catch (\Exception $e) {
                Log::warning('Failed to sync user unblock to Firebase: ' . $e->getMessage());
            }
        }

        Log::info('User ' . $id . ' unblocked successfully');

        return $this->successResponse([
            'message' => 'User account unlocked successfully',
            'user' => $user,
        ]);
    }

    #[OA\Post(
        path: '/api/users/{id}/block',
        tags: ['Users'],
        summary: 'Block a user account',
        description: 'Blocks a user account, preventing them from logging in. Manager only.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'User ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User blocked successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'User account blocked successfully'),
                                new OA\Property(property: 'user', ref: '#/components/schemas/User')
                            ],
                            type: 'object'
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'User not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function block(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', 'User not found', 404);
        }

        Log::info('Blocking user ' . $id);

        $user->blocked = true;
        $user->save();

        // Try to sync with Firebase if internet is available
        if ($this->hasInternetConnection() && $user->firebase_uid) {
            try {
                Log::info('Syncing user block to Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('users')->document($user->firebase_uid);
                $docRef->set([
                    'blocked' => true,
                ], ['merge' => true]);

                // Also disable in Firebase Auth
                Log::info('Disabling user in Firebase Auth');
                $auth = Firebase::auth();
                $auth->updateUser($user->firebase_uid, ['disabled' => true]);

                Log::info('User block synced to Firebase');
            } catch (\Exception $e) {
                Log::warning('Failed to sync user block to Firebase: ' . $e->getMessage());
            }
        }

        Log::info('User ' . $id . ' blocked successfully');

        return $this->successResponse([
            'message' => 'User account blocked successfully',
            'user' => $user,
        ]);
    }

    #[OA\Delete(
        path: '/api/users/{id}',
        tags: ['Users'],
        summary: 'Delete a user',
        description: 'Deletes a user. Manager only.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'User ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'User deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'User deleted successfully')
                            ],
                            type: 'object'
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'User not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function destroy(int $id): JsonResponse
    {
        $user = User::find($id);

        if (!$user) {
            return $this->errorResponse('NOT_FOUND', 'User not found', 404);
        }

        Log::info('Deleting user ' . $id);

        // Try to delete from Firebase first if internet is available
        $deletedFromFirebase = false;
        if ($this->hasInternetConnection() && $user->firebase_uid && $user->synced !== 'created') {
            try {
                Log::info('Deleting user ' . $id . ' from Firebase Auth');
                $auth = Firebase::auth();
                $auth->deleteUser($user->firebase_uid);

                Log::info('Deleting user ' . $id . ' from Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('users')->document($user->firebase_uid);
                $docRef->delete();

                $deletedFromFirebase = true;
                Log::info('User ' . $id . ' deleted from Firebase successfully');
            } catch (\Exception $e) {
                Log::warning('Failed to delete user from Firebase: ' . $e->getMessage());
            }
        }

        // Delete from local database
        if ($user->synced === 'created' || $deletedFromFirebase || !$user->firebase_uid) {
            Log::info('Deleting user ' . $id . ' from local database');
            $user->delete();
        } else {
            Log::info('Marking user ' . $id . ' for deletion during next sync');
            $user->synced = 'deleted';
            $user->save();
        }

        Log::info('User ' . $id . ' deleted successfully');

        return $this->successResponse(['message' => 'User deleted successfully']);
    }

    /**
     * Check if internet connection is available.
     */
    protected function hasInternetConnection(): bool
    {
        try {
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
}
