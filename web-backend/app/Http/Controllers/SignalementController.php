<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use App\Models\Signalement;
use App\Models\SignalementStatusHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Kreait\Laravel\Firebase\Facades\Firebase;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Signalements', description: 'Report management endpoints')]
#[OA\Schema(
    schema: 'User',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'firebase_uid', type: 'string', example: 'abc123-def456', nullable: true),
        new OA\Property(property: 'email', type: 'string', format: 'email', example: 'user@example.com'),
        new OA\Property(property: 'role', type: 'string', enum: ['user', 'manager'], example: 'user'),
        new OA\Property(property: 'login_attempts', type: 'integer', example: 0),
        new OA\Property(property: 'locked_until', type: 'string', format: 'date-time', nullable: true),
        new OA\Property(property: 'blocked', type: 'boolean', example: false),
        new OA\Property(property: 'synced', type: 'string', enum: ['synced', 'created', 'updated', 'deleted'], example: 'synced', nullable: true)
    ]
)]
#[OA\Schema(
    schema: 'Signalement',
    properties: [
        new OA\Property(property: 'id', type: 'integer', example: 1),
        new OA\Property(property: 'user_id', type: 'integer', example: 1),
        new OA\Property(property: 'firebase_uid', type: 'string', example: 'abc123-def456'),
        new OA\Property(property: 'lat', type: 'number', format: 'float', example: -18.8792),
        new OA\Property(property: 'lng', type: 'number', format: 'float', example: 47.5079),
        new OA\Property(property: 'date_signalement', type: 'string', example: '2026-01-20'),
        new OA\Property(property: 'surface', type: 'number', format: 'float', example: 150.50),
        new OA\Property(property: 'budget', type: 'number', format: 'float', example: 5000.00),
        new OA\Property(property: 'entreprise_id', type: 'integer', example: 1),
        new OA\Property(
            property: 'entreprise',
            type: 'object',
            nullable: true,
            properties: [
                new OA\Property(property: 'name', type: 'string', example: 'AFW')
            ]
        ),
        new OA\Property(property: 'synced', type: 'string', enum: ['synced', 'created', 'updated', 'deleted'], example: 'synced'),
        new OA\Property(property: 'user', ref: '#/components/schemas/User', nullable: true)
    ]
)]
class SignalementController extends Controller
{
    #[OA\Get(
        path: '/api/signalements',
        tags: ['Signalements'],
        summary: 'Get all signalements',
        description: 'Retrieves all signalements with optional filtering.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'status',
                in: 'query',
                description: 'Filter by sync status',
                required: false,
                schema: new OA\Schema(type: 'string', enum: ['synced', 'created', 'updated', 'deleted'])
            ),
            new OA\Parameter(
                name: 'user_id',
                in: 'query',
                description: 'Filter by user ID',
                required: false,
                schema: new OA\Schema(type: 'integer')
            ),
            new OA\Parameter(
                name: 'entreprise_id',
                in: 'query',
                description: 'Filter by entreprise ID',
                required: false,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'List of signalements retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            type: 'array',
                            items: new OA\Items(ref: '#/components/schemas/Signalement')
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
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
                Log::warning('Failed to get signalements from Firestore, falling back to local: ' . $e->getMessage());
            }
        }

        return $this->indexFromLocal($request);
    }

    /**
     * Get all signalements from Firestore.
     */
    protected function indexFromFirestore(Request $request): JsonResponse
    {
        Log::info('Getting all signalements from Firestore');

        $firestore = Firebase::firestore()->database();
        $collection = $firestore->collection('signalements');
        $documents = $collection->documents();

        $signalements = [];
        foreach ($documents as $document) {
            if ($document->exists()) {
                $data = $document->data();
                $data['firebase_uid'] = $document->id();
                $signalements[] = $data;
            }
        }

        // Apply filters
        if ($request->has('status')) {
            $status = $request->status;
            $signalements = array_filter($signalements, fn($s) => ($s['status'] ?? null) == $status);
        }

        if ($request->has('user_id')) {
            $userId = $request->user_id;
            $signalements = array_filter($signalements, fn($s) => ($s['user_id'] ?? null) == $userId);
        }

        if ($request->has('entreprise_id')) {
            $entrepriseId = $request->entreprise_id;
            $signalements = array_filter($signalements, fn($s) => ($s['entreprise_id'] ?? null) == $entrepriseId);
        }

        Log::info('Retrieved ' . count($signalements) . ' signalements from Firestore');

        return $this->successResponse(array_values($signalements));
    }

    /**
     * Get all signalements from local database.
     */
    protected function indexFromLocal(Request $request): JsonResponse
    {
        Log::info('Getting all signalements from local database');

        $query = Signalement::with(['user', 'entreprise', 'statusHistory']);

        // Apply filters
        if ($request->has('sync_status')) {
            $query->where('synced', $request->sync_status);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        if ($request->has('entreprise_id')) {
            $query->where('entreprise_id', $request->entreprise_id);
        }

        $signalements = $query->get();

        Log::info('Retrieved ' . $signalements->count() . ' signalements from local database');

        return $this->successResponse($signalements);
    }

    #[OA\Get(
        path: '/api/signalements/{id}',
        tags: ['Signalements'],
        summary: 'Get a specific signalement',
        description: 'Retrieves a signalement by its ID.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'Signalement ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Signalement retrieved successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Signalement'),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Signalement not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function show(string $id): JsonResponse
    {
        // Try Firestore first if internet is available
        if ($this->hasInternetConnection()) {
            try {
                return $this->showFromFirestore($id);
            } catch (\Exception $e) {
                Log::warning('Failed to get signalement from Firestore, falling back to local: ' . $e->getMessage());
            }
        }

        return $this->showFromLocal($id);
    }

    /**
     * Get a signalement from Firestore by ID.
     */
    protected function showFromFirestore(string $id): JsonResponse
    {
        Log::info('Getting signalement ' . $id . ' from Firestore');

        // First get the signalement from local to get firebase_uid
        $localSignalement = is_numeric($id)
            ? Signalement::find($id)
            : Signalement::where('firebase_uid', $id)->first();
        if (!$localSignalement) {
            return $this->errorResponse('NOT_FOUND', 'Signalement not found', 404);
        }

        $firestore = Firebase::firestore()->database();
        $docRef = $firestore->collection('signalements')->document($localSignalement->firebase_uid);
        $snapshot = $docRef->snapshot();

        if (!$snapshot->exists()) {
            Log::warning('Signalement not found in Firestore, returning local data');
            return $this->showFromLocal($id);
        }

        $data = $snapshot->data();
        $data['firebase_uid'] = $snapshot->id();

        Log::info('Retrieved signalement ' . $id . ' from Firestore');

        return $this->successResponse($data);
    }

    /**
     * Get a signalement from local database by ID.
     */
    protected function showFromLocal(string $id): JsonResponse
    {
        Log::info('Getting signalement ' . $id . ' from local database');

        $signalement = is_numeric($id)
            ? Signalement::with(['user', 'entreprise', 'statusHistory'])->find($id)
            : Signalement::with(['user', 'entreprise', 'statusHistory'])->where('firebase_uid', $id)->first();

        if (!$signalement) {
            return $this->errorResponse('NOT_FOUND', 'Signalement not found', 404);
        }

        Log::info('Retrieved signalement ' . $id . ' from local database');

        return $this->successResponse($signalement);
    }

    #[OA\Post(
        path: '/api/signalements',
        tags: ['Signalements'],
        summary: 'Create a new signalement',
        description: 'Creates a new signalement (report).',
        security: [['bearerAuth' => []]],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                required: ['lat', 'lng', 'date_signalement', 'surface', 'budget', 'entreprise_name'],
                properties: [
                    new OA\Property(property: 'lat', type: 'number', format: 'float', example: -18.8792),
                    new OA\Property(property: 'lng', type: 'number', format: 'float', example: 47.5079),
                    new OA\Property(property: 'date_signalement', type: 'string', example: '2026-01-20'),
                    new OA\Property(property: 'surface', type: 'number', format: 'float', example: 150.50),
                    new OA\Property(property: 'budget', type: 'number', format: 'float', example: 5000.00),
                    new OA\Property(property: 'entreprise_name', type: 'string', example: 'AFW')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 201,
                description: 'Signalement created successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Signalement'),
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
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'date_signalement' => 'required|string',
            'surface' => 'required|numeric|min:0',
            'budget' => 'required|numeric|min:0',
            'entreprise_name' => 'required_without:entreprise_id|string|min:1',
            'entreprise_id' => 'required_without:entreprise_name|exists:entreprises,id',
            'status' => 'sometimes|string|in:pending,in_progress,resolved,rejected',
            'notes' => 'sometimes|nullable|string|max:2000',
        ]);

        $entreprise = null;
        if (!empty($validated['entreprise_name'])) {
            $entrepriseName = trim($validated['entreprise_name']);
            $entreprise = Entreprise::firstOrCreate(['name' => $entrepriseName]);
        } elseif (!empty($validated['entreprise_id'])) {
            $entreprise = Entreprise::find($validated['entreprise_id']);
        }

        if (!$entreprise) {
            return $this->errorResponse('INVALID_ENTREPRISE', 'Entreprise not found', 422);
        }

        // Get authenticated user
        $user = $request->user();
        $firebaseUid = Str::uuid()->toString();

        // Try to create in Firestore first if internet is available
        $syncedStatus = 'created';
        if ($this->hasInternetConnection()) {
            try {
                Log::info('Creating signalement in Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('signalements')->document($firebaseUid);
                $docRef->set([
                    'user_id' => $user->id,
                    'lat' => (float) $validated['lat'],
                    'lng' => (float) $validated['lng'],
                    'date_signalement' => $validated['date_signalement'],
                    'surface' => (float) $validated['surface'],
                    'budget' => (float) $validated['budget'],
                    'entreprise_id' => $entreprise->id,
                    'entreprise' => [
                        'name' => $entreprise->name,
                    ],
                    'status' => $validated['status'] ?? 'pending',
                    'notes' => $validated['notes'] ?? null,
                ]);
                $syncedStatus = 'synced';
                Log::info('Signalement created in Firestore successfully');
            } catch (\Exception $e) {
                Log::warning('Failed to create signalement in Firestore: ' . $e->getMessage());
            }
        } else {
            Log::info('No internet connection, creating signalement locally only');
        }

        // Create in local database
        Log::info('Creating signalement in local database');
        $signalement = Signalement::create([
            'user_id' => $user->id,
            'firebase_uid' => $firebaseUid,
            'lat' => $validated['lat'],
            'lng' => $validated['lng'],
            'date_signalement' => $validated['date_signalement'],
            'surface' => $validated['surface'],
            'budget' => $validated['budget'],
            'entreprise_id' => $entreprise->id,
            'status' => $validated['status'] ?? 'pending',
            'notes' => $validated['notes'] ?? null,
            'synced' => $syncedStatus,
        ]);

        $signalement->load(['user', 'entreprise']);

        // Record initial status in history
        SignalementStatusHistory::create([
            'signalement_id' => $signalement->id,
            'status' => $signalement->status ?? 'pending',
            'changed_at' => now(),
            'notes' => 'Initial status',
        ]);

        $signalement->load('statusHistory');
        Log::info('Signalement ' . $signalement->id . ' created successfully (synced: ' . $syncedStatus . ')');

        return $this->successResponse($signalement, 201);
    }

    #[OA\Put(
        path: '/api/signalements/{id}',
        tags: ['Signalements'],
        summary: 'Update a signalement',
        description: 'Updates an existing signalement.',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'Signalement ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        requestBody: new OA\RequestBody(
            required: true,
            content: new OA\JsonContent(
                properties: [
                    new OA\Property(property: 'lat', type: 'number', format: 'float', example: -18.8792),
                    new OA\Property(property: 'lng', type: 'number', format: 'float', example: 47.5079),
                    new OA\Property(property: 'date_signalement', type: 'string', example: '2026-01-20'),
                    new OA\Property(property: 'surface', type: 'number', format: 'float', example: 150.50),
                    new OA\Property(property: 'budget', type: 'number', format: 'float', example: 5000.00),
                    new OA\Property(property: 'entreprise_name', type: 'string', example: 'AFW')
                ]
            )
        ),
        responses: [
            new OA\Response(
                response: 200,
                description: 'Signalement updated successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(property: 'data', ref: '#/components/schemas/Signalement'),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Signalement not found',
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
    public function update(Request $request, string $id): JsonResponse
    {
        $signalement = is_numeric($id)
            ? Signalement::find($id)
            : Signalement::where('firebase_uid', $id)->first();

        if (!$signalement) {
            return $this->errorResponse('NOT_FOUND', 'Signalement not found', 404);
        }

        $validated = $request->validate([
            'lat' => 'sometimes|numeric|between:-90,90',
            'lng' => 'sometimes|numeric|between:-180,180',
            'date_signalement' => 'sometimes|string',
            'surface' => 'sometimes|numeric|min:0',
            'budget' => 'sometimes|numeric|min:0',
            'entreprise_name' => 'sometimes|string|min:1',
            'entreprise_id' => 'sometimes|exists:entreprises,id',
            'status' => 'sometimes|string|in:pending,in_progress,resolved,rejected',
            'notes' => 'sometimes|nullable|string|max:2000',
        ]);

        $entreprise = null;
        if (!empty($validated['entreprise_name'])) {
            $entrepriseName = trim($validated['entreprise_name']);
            $entreprise = Entreprise::firstOrCreate(['name' => $entrepriseName]);
            $validated['entreprise_id'] = $entreprise->id;
        } elseif (!empty($validated['entreprise_id'])) {
            $entreprise = Entreprise::find($validated['entreprise_id']);
        }

        unset($validated['entreprise_name']);

        // Try to update in Firestore first if internet is available
        $syncedStatus = $signalement->synced;
        if ($this->hasInternetConnection()) {
            try {
                Log::info('Updating signalement ' . $id . ' in Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('signalements')->document($signalement->firebase_uid);

                $updateData = [];
                if (isset($validated['lat'])) $updateData['lat'] = (float) $validated['lat'];
                if (isset($validated['lng'])) $updateData['lng'] = (float) $validated['lng'];
                if (isset($validated['date_signalement'])) $updateData['date_signalement'] = $validated['date_signalement'];
                if (isset($validated['surface'])) $updateData['surface'] = (float) $validated['surface'];
                if (isset($validated['budget'])) $updateData['budget'] = (float) $validated['budget'];
                if (isset($validated['entreprise_id'])) {
                    $updateData['entreprise_id'] = $validated['entreprise_id'];
                }
                if ($entreprise) {
                    $updateData['entreprise'] = [
                        'name' => $entreprise->name,
                    ];
                }
                if (isset($validated['status'])) $updateData['status'] = $validated['status'];
                if (array_key_exists('notes', $validated)) $updateData['notes'] = $validated['notes'];

                $docRef->set($updateData, ['merge' => true]);
                $syncedStatus = 'synced';
                Log::info('Signalement ' . $id . ' updated in Firestore successfully');
            } catch (\Exception $e) {
                Log::warning('Failed to update signalement in Firestore: ' . $e->getMessage());
                // Mark as updated for sync later if it was previously synced
                if ($signalement->synced === 'synced') {
                    $syncedStatus = 'updated';
                }
            }
        } else {
            Log::info('No internet connection, updating signalement locally only');
            // Mark as updated for sync later if it was previously synced
            if ($signalement->synced === 'synced') {
                $syncedStatus = 'updated';
            }
        }

        // Update in local database
        Log::info('Updating signalement ' . $id . ' in local database');

        // Check if status is changing
        $oldStatus = $signalement->status;
        $validated['synced'] = $syncedStatus;
        $signalement->update($validated);

        // Record status change in history if status changed
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            SignalementStatusHistory::create([
                'signalement_id' => $signalement->id,
                'status' => $validated['status'],
                'changed_at' => now(),
                'notes' => $validated['notes'] ?? null,
            ]);
        }

        $signalement->load(['user', 'entreprise', 'statusHistory']);

        Log::info('Signalement ' . $id . ' updated successfully (synced: ' . $syncedStatus . ')');

        return $this->successResponse($signalement);
    }

    #[OA\Delete(
        path: '/api/signalements/{id}',
        tags: ['Signalements'],
        summary: 'Delete a signalement',
        description: 'Deletes a signalement (marks it for deletion in sync).',
        security: [['bearerAuth' => []]],
        parameters: [
            new OA\Parameter(
                name: 'id',
                in: 'path',
                description: 'Signalement ID',
                required: true,
                schema: new OA\Schema(type: 'integer')
            )
        ],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Signalement deleted successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'Signalement deleted successfully')
                            ],
                            type: 'object'
                        ),
                        new OA\Property(property: 'error', type: 'null')
                    ]
                )
            ),
            new OA\Response(
                response: 404,
                description: 'Signalement not found',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function destroy(string $id): JsonResponse
    {
        $signalement = is_numeric($id)
            ? Signalement::find($id)
            : Signalement::where('firebase_uid', $id)->first();

        if (!$signalement) {
            return $this->errorResponse('NOT_FOUND', 'Signalement not found', 404);
        }

        Log::info('Deleting signalement ' . $id);

        // Try to delete from Firestore first if internet is available
        $deletedFromFirestore = false;
        if ($this->hasInternetConnection() && $signalement->synced !== 'created') {
            try {
                Log::info('Deleting signalement ' . $id . ' from Firestore');
                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('signalements')->document($signalement->firebase_uid);
                $docRef->delete();
                $deletedFromFirestore = true;
                Log::info('Signalement ' . $id . ' deleted from Firestore successfully');
            } catch (\Exception $e) {
                Log::warning('Failed to delete signalement from Firestore: ' . $e->getMessage());
            }
        }

        // Delete from local database
        if ($signalement->synced === 'created' || $deletedFromFirestore) {
            // If never synced or successfully deleted from Firestore, delete locally
            Log::info('Deleting signalement ' . $id . ' from local database');
            $signalement->delete();
        } else {
            // Mark for deletion during sync
            Log::info('Marking signalement ' . $id . ' for deletion during next sync');
            $signalement->synced = 'deleted';
            $signalement->save();
        }

        Log::info('Signalement ' . $id . ' deleted successfully');

        return $this->successResponse(['message' => 'Signalement deleted successfully']);
    }

    #[OA\Post(
        path: '/api/signalements/sync',
        tags: ['Signalements'],
        summary: 'Sync signalements with Firebase',
        description: 'Synchronizes all pending signalements with Firebase Firestore. (manager only)',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sync completed successfully',
                content: new OA\JsonContent(
                    properties: [
                        new OA\Property(property: 'status', type: 'string', example: 'success'),
                        new OA\Property(
                            property: 'data',
                            properties: [
                                new OA\Property(property: 'message', type: 'string', example: 'Sync completed'),
                                new OA\Property(
                                    property: 'results',
                                    properties: [
                                        new OA\Property(property: 'created', type: 'integer', example: 5),
                                        new OA\Property(property: 'updated', type: 'integer', example: 3),
                                        new OA\Property(property: 'deleted', type: 'integer', example: 1),
                                        new OA\Property(property: 'errors', type: 'array', items: new OA\Items(type: 'object'))
                                    ],
                                    type: 'object'
                                )
                            ],
                            type: 'object'
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
                response: 500,
                description: 'Sync failed',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function sync(Request $request): JsonResponse
    {
        Log::info('Starting signalements sync with Firebase');

        // Check if we have internet connectivity
        if (!$this->hasInternetConnection()) {
            Log::error('No internet connection available for sync');
            return $this->errorResponse(
                'NO_INTERNET',
                'No internet connection available. Please try again when connected.',
                503
            );
        }

        try {
            Log::info('Connecting to Firestore...');
            $firestore = Firebase::firestore()->database();
            $collection = $firestore->collection('signalements');

            $results = [
                'created' => 0,
                'updated' => 0,
                'deleted' => 0,
                'errors' => [],
            ];

            // Get all signalements that need to be synced
            $signalements = Signalement::whereIn('synced', ['created', 'updated', 'deleted'])->get();
            Log::info('Found ' . $signalements->count() . ' signalements to sync');

            foreach ($signalements as $signalement) {
                try {
                    $docRef = $collection->document($signalement->firebase_uid);

                    switch ($signalement->synced) {
                        case 'created':
                            Log::info('Creating signalement ' . $signalement->id . ' in Firestore');
                            $docRef->set($this->formatForFirestore($signalement));
                            $signalement->synced = 'synced';
                            $signalement->save();
                            $results['created']++;
                            break;

                        case 'updated':
                            Log::info('Updating signalement ' . $signalement->id . ' in Firestore');
                            $docRef->set($this->formatForFirestore($signalement), ['merge' => true]);
                            $signalement->synced = 'synced';
                            $signalement->save();
                            $results['updated']++;
                            break;

                        case 'deleted':
                            Log::info('Deleting signalement ' . $signalement->id . ' from Firestore');
                            $docRef->delete();
                            $signalement->delete();
                            $results['deleted']++;
                            break;
                    }
                } catch (\Exception $e) {
                    Log::error('Error syncing signalement ' . $signalement->id . ': ' . $e->getMessage());
                    $results['errors'][] = [
                        'signalement_id' => $signalement->id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            Log::info('Sync completed: ' . $results['created'] . ' created, ' . $results['updated'] . ' updated, ' . $results['deleted'] . ' deleted');

            return $this->successResponse([
                'message' => 'Sync completed',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            Log::error('Sync failed: ' . $e->getMessage());
            return $this->errorResponse('SYNC_FAILED', 'Failed to sync with Firebase: ' . $e->getMessage(), 500);
        }
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
     * Format a signalement for Firestore storage.
     */
    protected function formatForFirestore(Signalement $signalement): array
    {
        $signalement->loadMissing(['entreprise', 'statusHistory']);

        $statusHistory = $signalement->statusHistory->map(function ($entry) {
            return [
                'status' => $entry->status,
                'changed_at' => $entry->changed_at?->toISOString(),
                'notes' => $entry->notes,
            ];
        })->toArray();

        return [
            'id' => $signalement->id,
            'user_id' => $signalement->user_id,
            'lat' => (float) $signalement->lat,
            'lng' => (float) $signalement->lng,
            'date_signalement' => $signalement->date_signalement,
            'surface' => (float) $signalement->surface,
            'budget' => (float) $signalement->budget,
            'entreprise_id' => $signalement->entreprise_id,
            'entreprise' => $signalement->entreprise ? [
                'name' => $signalement->entreprise->name,
            ] : null,
            'status' => $signalement->status ?? 'pending',
            'notes' => $signalement->notes,
            'status_history' => $statusHistory,
        ];
    }
}
