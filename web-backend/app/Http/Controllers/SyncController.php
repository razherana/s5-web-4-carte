<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Kreait\Laravel\Firebase\Facades\Firebase;
use OpenApi\Attributes as OA;

class SyncController extends Controller
{
    #[OA\Post(
        path: '/api/sync/signalements',
        tags: ['Sync'],
        summary: 'Sync signalements to Firestore (Manager only)',
        description: 'Synchronizes signalements from PostgreSQL to Firestore. Only managers can perform this action.',
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
    public function syncSignalements(Request $request): JsonResponse
    {
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

        foreach ($signalements as $signalement) {
            try {
                $docRef = $collection->document($signalement->firebase_uid);

                switch ($signalement->synced) {
                    case 'created':
                        $docRef->set($this->formatForFirestore($signalement));
                        $signalement->synced = 'synced';
                        $signalement->save();
                        $results['created']++;
                        break;

                    case 'updated':
                        $docRef->set($this->formatForFirestore($signalement), ['merge' => true]);
                        $signalement->synced = 'synced';
                        $signalement->save();
                        $results['updated']++;
                        break;

                    case 'deleted':
                        $docRef->delete();
                        $signalement->delete();
                        $results['deleted']++;
                        break;
                }
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'signalement_id' => $signalement->id,
                    'error' => $e->getMessage(),
                ];
            }
        }

        return $this->successResponse([
            'message' => 'Sync completed',
            'results' => $results,
        ]);
    }

    /**
     * Format a signalement for Firestore storage.
     */
    protected function formatForFirestore(Signalement $signalement): array
    {
        return [
            'id' => $signalement->id,
            'user_id' => $signalement->user_id,
            'lat' => (float) $signalement->lat,
            'lng' => (float) $signalement->lng,
            'date_signalement' => $signalement->date_signalement,
            'surface' => (float) $signalement->surface,
            'budget' => (float) $signalement->budget,
            'entreprise_id' => [
                'name' => $signalement->entreprise->name,
            ]
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

        return $this->successResponse([
            'message' => 'User sync completed',
            'results' => $results,
        ]);
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
        ];
    }
}
