<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Kreait\Laravel\Firebase\Facades\Firebase;

class SyncController extends Controller
{
    /**
     * Sync signalements from PostgreSQL to Firestore.
     */
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
}
