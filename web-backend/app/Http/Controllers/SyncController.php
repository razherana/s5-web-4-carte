<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use App\Models\Signalement;
use App\Models\SignalementStatusHistory;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;
use OpenApi\Attributes as OA;

class SyncController extends Controller
{
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
            'niveau' => (int) $signalement->niveau,
            'prix_par_m2' => (float) $signalement->prix_par_m2,
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

    #[OA\Post(
        path: '/api/sync/users',
        tags: ['Sync'],
        summary: 'Sync users to Firestore (Manager only)',
        description: 'Synchronizes users from PostgreSQL to Firestore. Only managers can perform this action.',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Sync completed successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 403,
                description: 'Forbidden - Only managers can sync data',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function syncUsers(Request $request): JsonResponse
    {
        $firestore = Firebase::firestore()->database();
        $collection = $firestore->collection('users');

        $results = [
            'created' => 0,
            'updated' => 0,
            'deleted' => 0,
            'errors' => [],
        ];

        // Get all users that need to be synced
        $users = User::whereIn('synced', ['created', 'updated', 'deleted'])->get();

        foreach ($users as $user) {
            try {
                // Use firebase_uid as document ID if available, otherwise use local id
                $docId = $user->firebase_uid ?? (string) $user->id;
                $docRef = $collection->document($docId);

                switch ($user->synced) {
                    case 'created':
                        $docRef->set($this->formatUserForFirestore($user));
                        $user->synced = 'synced';
                        $user->save();
                        $results['created']++;
                        break;

                    case 'updated':
                        $docRef->set($this->formatUserForFirestore($user), ['merge' => true]);
                        $user->synced = 'synced';
                        $user->save();
                        $results['updated']++;
                        break;

                    case 'deleted':
                        $docRef->delete();
                        $user->delete();
                        $results['deleted']++;
                        break;
                }
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        Log::info("Sync users executed: " . json_encode($results));

        return $this->successResponse([
            'message' => 'User sync completed',
            'results' => $results,
        ]);
    }

    /**
     * Sync all data: users, signalements, and entreprises to Firebase.
     * Manager only.
     */
    #[OA\Post(
        path: '/api/sync/all',
        tags: ['Sync'],
        summary: 'Sync all data to Firebase (Manager only)',
        description: 'Synchronizes all users, signalements and entreprises from local DB to Firestore.',
        security: [['bearerAuth' => []]],
        responses: [
            new OA\Response(
                response: 200,
                description: 'Full sync completed successfully',
                content: new OA\JsonContent(ref: '#/components/schemas/SuccessResponse')
            ),
            new OA\Response(
                response: 401,
                description: 'Unauthorized',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            ),
            new OA\Response(
                response: 503,
                description: 'No internet connection',
                content: new OA\JsonContent(ref: '#/components/schemas/ErrorResponse')
            )
        ]
    )]
    public function syncAll(Request $request): JsonResponse
    {
        Log::info('Starting full sync with Firebase');

        if (!$this->hasInternetConnection()) {
            return $this->errorResponse(
                'NO_INTERNET',
                'No internet connection available. Please try again when connected.',
                503
            );
        }

        $results = [
            'users' => ['created' => 0, 'updated' => 0, 'deleted' => 0, 'errors' => []],
            'signalements' => ['created' => 0, 'updated' => 0, 'deleted' => 0, 'errors' => []],
            'entreprises' => ['synced' => 0, 'errors' => []],
        ];

        try {
            $firestore = Firebase::firestore()->database();

            // Sync entreprises
            $entreprises = Entreprise::all();
            foreach ($entreprises as $entreprise) {
                try {
                    $docRef = $firestore->collection('entreprises')->document((string) $entreprise->id);
                    $docRef->set([
                        'id' => $entreprise->id,
                        'name' => $entreprise->name,
                    ]);
                    $results['entreprises']['synced']++;
                } catch (\Exception $e) {
                    $results['entreprises']['errors'][] = [
                        'entreprise_id' => $entreprise->id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // Sync users
            $auth = Firebase::auth();
            $users = User::whereIn('synced', ['created', 'updated', 'deleted'])->get();
            foreach ($users as $user) {
                try {
                    $docId = $user->firebase_uid ?? (string) $user->id;
                    $docRef = $firestore->collection('users')->document($docId);

                    switch ($user->synced) {
                        case 'created':
                            // Create in Firebase Auth if no firebase_uid
                            if (!$user->firebase_uid) {
                                try {
                                    $firebaseUser = $auth->createUser([
                                        'email' => $user->email,
                                        'emailVerified' => false,
                                        'disabled' => $user->blocked,
                                    ]);
                                    $user->firebase_uid = $firebaseUser->uid;
                                    $docId = $firebaseUser->uid;
                                    $docRef = $firestore->collection('users')->document($docId);
                                } catch (\Exception $e) {
                                    Log::warning('Failed to create user in Firebase Auth during sync: ' . $e->getMessage());
                                }
                            }
                            $docRef->set($this->formatUserForFirestore($user));
                            $user->synced = 'synced';
                            $user->save();
                            $results['users']['created']++;
                            break;

                        case 'updated':
                            $docRef->set($this->formatUserForFirestore($user), ['merge' => true]);
                            $user->synced = 'synced';
                            $user->save();
                            $results['users']['updated']++;
                            break;

                        case 'deleted':
                            if ($user->firebase_uid) {
                                try {
                                    $auth->deleteUser($user->firebase_uid);
                                } catch (\Exception $e) {
                                    Log::warning('Failed to delete user from Firebase Auth: ' . $e->getMessage());
                                }
                            }
                            $docRef->delete();
                            $user->delete();
                            $results['users']['deleted']++;
                            break;
                    }
                } catch (\Exception $e) {
                    $results['users']['errors'][] = [
                        'user_id' => $user->id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // Sync signalements
            $signalements = Signalement::whereIn('synced', ['created', 'updated', 'deleted'])->get();
            foreach ($signalements as $signalement) {
                try {
                    $docRef = $firestore->collection('signalements')->document($signalement->firebase_uid);

                    switch ($signalement->synced) {
                        case 'created':
                            $docRef->set($this->formatForFirestore($signalement));
                            $signalement->synced = 'synced';
                            $signalement->save();
                            $results['signalements']['created']++;
                            break;

                        case 'updated':
                            $docRef->set($this->formatForFirestore($signalement), ['merge' => true]);
                            $signalement->synced = 'synced';
                            $signalement->save();
                            $results['signalements']['updated']++;
                            break;

                        case 'deleted':
                            $docRef->delete();
                            $signalement->delete();
                            $results['signalements']['deleted']++;
                            break;
                    }
                } catch (\Exception $e) {
                    $results['signalements']['errors'][] = [
                        'signalement_id' => $signalement->id,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            Log::info('Full sync completed', $results);

            return $this->successResponse([
                'message' => 'Full sync completed',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            Log::error('Full sync failed: ' . $e->getMessage());
            return $this->errorResponse('SYNC_FAILED', 'Full sync failed: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Retrieve signalements from Firebase and update local database.
     * Manager only.
     */
    public function pullFromFirebase(Request $request): JsonResponse
    {
        Log::info('Pulling data from Firebase to local database');

        if (!$this->hasInternetConnection()) {
            return $this->errorResponse(
                'NO_INTERNET',
                'No internet connection available.',
                503
            );
        }

        try {
            $firestore = Firebase::firestore()->database();
            $results = [
                'signalements' => ['imported' => 0, 'updated' => 0, 'errors' => []],
                'users' => ['imported' => 0, 'updated' => 0, 'errors' => []],
            ];

            // Pull signalements from Firestore
            $documents = $firestore->collection('signalements')->documents();
            foreach ($documents as $document) {
                if (!$document->exists()) continue;

                $data = $document->data();
                $firebaseUid = $document->id();

                try {
                    $existing = Signalement::where('firebase_uid', $firebaseUid)->first();

                    $entreprise = null;
                    if (!empty($data['entreprise']['name'])) {
                        $entreprise = Entreprise::firstOrCreate(['name' => $data['entreprise']['name']]);
                    } elseif (!empty($data['entreprise_id'])) {
                        $entreprise = Entreprise::find($data['entreprise_id']);
                    }

                    $signalementData = [
                        'firebase_uid' => $firebaseUid,
                        'user_id' => $data['user_id'] ?? null,
                        'lat' => $data['lat'] ?? 0,
                        'lng' => $data['lng'] ?? 0,
                        'date_signalement' => $data['date_signalement'] ?? now()->toDateString(),
                        'surface' => $data['surface'] ?? 0,
                        'niveau' => $data['niveau'] ?? 1,
                        'prix_par_m2' => $data['prix_par_m2'] ?? 0,
                        'entreprise_id' => $entreprise?->id,
                        'status' => $data['status'] ?? 'pending',
                        'notes' => $data['notes'] ?? null,
                        'synced' => 'synced',
                    ];

                    if ($existing) {
                        $existing->update($signalementData);
                        $signalement = $existing;
                        $results['signalements']['updated']++;
                    } else {
                        $signalement = Signalement::create($signalementData);
                        $results['signalements']['imported']++;
                    }

                    // Import status history from Firestore
                    if (!empty($data['status_history']) && is_array($data['status_history'])) {
                        foreach ($data['status_history'] as $historyEntry) {
                            $changedAt = $historyEntry['changed_at'] ?? now()->toISOString();
                            SignalementStatusHistory::updateOrCreate(
                                [
                                    'signalement_id' => $signalement->id,
                                    'status' => $historyEntry['status'] ?? 'pending',
                                    'changed_at' => $changedAt,
                                ],
                                [
                                    'notes' => $historyEntry['notes'] ?? null,
                                ]
                            );
                        }
                    }
                } catch (\Exception $e) {
                    $results['signalements']['errors'][] = [
                        'firebase_uid' => $firebaseUid,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            // Pull users from Firestore
            $userDocs = $firestore->collection('users')->documents();
            foreach ($userDocs as $document) {
                if (!$document->exists()) continue;

                $data = $document->data();
                $firebaseUid = $document->id();

                try {
                    $existing = User::where('firebase_uid', $firebaseUid)->first();

                    if ($existing) {
                        $existing->update([
                            'email' => $data['email'] ?? $existing->email,
                            'role' => $data['role'] ?? $existing->role,
                            'blocked' => $data['blocked'] ?? $existing->blocked,
                            'login_attempts' => $data['login_attempts'] ?? $existing->login_attempts,
                            'synced' => 'synced',
                        ]);
                        $results['users']['updated']++;
                    } else {
                        User::create([
                            'firebase_uid' => $firebaseUid,
                            'email' => $data['email'] ?? 'unknown@unknown.com',
                            'password' => bcrypt(str()->random(16)),
                            'role' => $data['role'] ?? 'user',
                            'blocked' => $data['blocked'] ?? false,
                            'login_attempts' => $data['login_attempts'] ?? 0,
                            'synced' => 'synced',
                        ]);
                        $results['users']['imported']++;
                    }
                } catch (\Exception $e) {
                    $results['users']['errors'][] = [
                        'firebase_uid' => $firebaseUid,
                        'error' => $e->getMessage(),
                    ];
                }
            }

            Log::info('Pull from Firebase completed', $results);

            return $this->successResponse([
                'message' => 'Data pulled from Firebase successfully',
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            Log::error('Pull from Firebase failed: ' . $e->getMessage());
            return $this->errorResponse('PULL_FAILED', 'Failed to pull from Firebase: ' . $e->getMessage(), 500);
        }
    }

    public function syncUsersManually(User $user, string $firebase_uid): void
    {
        $firestore = Firebase::firestore()->database();
        $collection = $firestore->collection('users');

        try {
            $docId = $firebase_uid;
            $docRef = $collection->document($docId);

            $docRef->set($this->formatUserForFirestore($user));
        } catch (\Exception $e) {
            Log::warning("Error syncing user ID {$user->id} to Firestore: " . $e->getMessage());
        }

        Log::info("Manually synced user ID {$user->id} to Firestore.");
    }

    /**
     * Format a user for Firestore storage.
     */
    protected function formatUserForFirestore(User $user): array
    {
        return [
            'id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'firebase_uid' => $user->firebase_uid,
            'login_attempts' => $user->login_attempts,
            'locked_until' => $user->locked_until ? $user->locked_until->toDateTimeString() : null,
            'blocked' => $user->blocked ?? false,
        ];
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
