<?php

namespace App\Http\Controllers;

use App\Models\Signalement;
use App\Models\SignalementStatusHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;

use function Laravel\Prompts\error;

class StatusHistoryController extends Controller
{
    /**
     * Get the status history for a signalement.
     */
    public function index(string $signalementId): JsonResponse
    {
        $signalement = is_numeric($signalementId)
            ? Signalement::find($signalementId)
            : Signalement::where('firebase_uid', $signalementId)->first();

        if (!$signalement) {
            return $this->errorResponse('NOT_FOUND', 'Signalement not found', 404);
        }

        $history = $signalement->statusHistory()->get();

        return $this->successResponse($history);
    }

    /**
     * Add a status change to a signalement.
     * This also updates the signalement's current status.
     */
    public function store(Request $request, string $signalementId): JsonResponse
    {
        $signalement = is_numeric($signalementId)
            ? Signalement::find($signalementId)
            : Signalement::where('firebase_uid', $signalementId)->first();

        if (!$signalement) {
            return $this->errorResponse('NOT_FOUND', 'Signalement not found', 404);
        }

        $validated = $request->validate([
            'status' => 'required|string|in:pending,in_progress,resolved,rejected',
            'changed_at' => 'required|date',
            'notes' => 'sometimes|nullable|string|max:2000',
        ]);

        $history = SignalementStatusHistory::create([
            'signalement_id' => $signalement->id,
            'status' => $validated['status'],
            'changed_at' => $validated['changed_at'],
            'notes' => $validated['notes'] ?? null,
        ]);

        // Update the current status on the signalement
        $oldSyncedStatus = $signalement->synced;
        $newSyncedStatus = $oldSyncedStatus === 'synced' ? 'updated' : $oldSyncedStatus;

        $signalement->update([
            'status' => $validated['status'],
            'synced' => $newSyncedStatus,
        ]);

        // Try to update in Firebase if internet is available
        if ($this->hasInternetConnection()) {
            try {
                Log::info('Updating signalement ' . $signalement->id . ' in Firestore after status change');

                $firestore = Firebase::firestore()->database();
                $docRef = $firestore->collection('signalements')->document($signalement->firebase_uid);

                // Format the signalement data for Firestore
                $signalement->loadMissing(['entreprise', 'statusHistory']);
                $statusHistory = $signalement->statusHistory->map(function ($entry) {
                    return [
                        'status' => $entry->status,
                        'changed_at' => $entry->changed_at?->toISOString(),
                        'notes' => $entry->notes,
                    ];
                })->toArray();

                $firestoreData = [
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
                    'status' => $signalement->status,
                    'notes' => $signalement->notes,
                    'status_history' => $statusHistory,
                ];

                $docRef->set($firestoreData);

                // Mark as synced since we successfully updated Firestore
                $signalement->update(['synced' => 'synced']);

                Log::info('Signalement ' . $signalement->id . ' updated in Firestore successfully');
            } catch (\Exception $e) {
                Log::warning('Failed to update signalement ' . $signalement->id . ' in Firestore, will sync later: ' . $e->getMessage());
                // Keep the 'updated' status for later sync
            }
        } else {
            Log::info('No internet connection, status change will be synced later');
        }

        $signalement->load('statusHistory');

        Log::info("Status history added for signalement {$signalement->id}: {$validated['status']}");

        return $this->successResponse([
            'history_entry' => $history,
            'signalement' => $signalement,
        ], 201);
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
     * Get processing time statistics.
     * Returns average time between status transitions for all signalements.
     */
    public function statistics(): JsonResponse
    {
        // Try Firestore first if internet is available
        if ($this->hasInternetConnection()) {
            try {
                return $this->statisticsFromFirestore();
            } catch (\Exception $e) {
                Log::warning('Failed to get statistics from Firestore, falling back to local: ' . $e->getMessage());
            }
        }

        return $this->statisticsFromLocal();
    }

    /**
     * Get processing time statistics from Firestore.
     */
    protected function statisticsFromFirestore(): JsonResponse
    {
        Log::info('Getting statistics from Firestore');

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

        return $this->computeStatistics($signalements, true);
    }

    /**
     * Get processing time statistics from local database.
     */
    protected function statisticsFromLocal(): JsonResponse
    {
        Log::info('Getting statistics from local database');

        $dbSignalements = Signalement::with(['statusHistory', 'entreprise'])->has('statusHistory')->get();

        $signalements = $dbSignalements->map(function ($s) {
            return [
                'id' => $s->id,
                'firebase_uid' => $s->firebase_uid,
                'status' => $s->status,
                'entreprise' => ['name' => $s->entreprise?->name],
                'status_history' => $s->statusHistory->map(function ($h) {
                    return [
                        'status' => $h->status,
                        'changed_at' => $h->changed_at?->toIso8601String(),
                    ];
                })->toArray(),
            ];
        })->toArray();

        return $this->computeStatistics($signalements, false);
    }

    /**
     * Compute statistics from signalements array.
     * Works with both Firestore and local database data.
     */
    protected function computeStatistics(array $signalements, bool $isFirestore): JsonResponse
    {
        $delays = [];
        $perSignalement = [];

        foreach ($signalements as $signalement) {
            $statusHistory = $signalement['status_history'] ?? [];

            if (!is_array($statusHistory) || count($statusHistory) < 2) {
                continue;
            }

            // Manual sort by changed_at using usort
            usort($statusHistory, function ($a, $b) {
                $timeA = strtotime($a['changed_at'] ?? '');
                $timeB = strtotime($b['changed_at'] ?? '');
                return $timeA <=> $timeB;
            });

            error(
                join(', ', array_map(function ($entry) {
                    return $entry['status'] . ' at ' . ($entry['changed_at'] ?? 'unknown');
                }, $statusHistory))
            );

            $signalementDelays = [];
            $history = $statusHistory;

            for ($i = 1; $i < count($history); $i++) {
                $prev = $history[$i - 1];
                $curr = $history[$i];

                $from = $prev['status'] ?? 'unknown';
                $to = $curr['status'] ?? 'unknown';
                $key = "{$from} → {$to}";

                $timeA = strtotime($prev['changed_at'] ?? '');
                $timeB = strtotime($curr['changed_at'] ?? '');

                if ($timeA === false || $timeB === false) {
                    continue;
                }

                $diffSeconds = $timeB - $timeA;
                $diffHours = $diffSeconds / 3600;

                if (!isset($delays[$key])) {
                    $delays[$key] = [];
                }
                $delays[$key][] = $diffHours;

                $signalementDelays[] = [
                    'from' => $from,
                    'to' => $to,
                    'hours' => round($diffHours, 2),
                    'changed_at' => $curr['changed_at'] ?? null,
                ];
            }

            // Total processing time: first entry to last entry
            if (count($history) >= 2) {
                $firstTime = strtotime($history[0]['changed_at'] ?? '');
                $lastTime = strtotime($history[count($history) - 1]['changed_at'] ?? '');

                if ($firstTime !== false && $lastTime !== false) {
                    $totalSeconds = $lastTime - $firstTime;
                    $totalHours = $totalSeconds / 3600;
                } else {
                    $totalHours = 0;
                }
            } else {
                $totalHours = 0;
            }

            $perSignalement[] = [
                'signalement_id' => $signalement['id'] ?? null,
                'firebase_uid' => $signalement['firebase_uid'] ?? null,
                'entreprise' => $signalement['entreprise']['name'] ?? null,
                'current_status' => $signalement['status'] ?? 'unknown',
                'total_hours' => round($totalHours, 2),
                'total_days' => round($totalHours / 24, 2),
                'steps' => count($history),
                'transitions' => $signalementDelays,
            ];
        }

        // Average delays per transition type
        $averageDelays = [];
        foreach ($delays as $transition => $hours) {
            $averageDelays[] = [
                'transition' => $transition,
                'count' => count($hours),
                'avg_hours' => round(array_sum($hours) / count($hours), 2),
                'avg_days' => round(array_sum($hours) / count($hours) / 24, 2),
                'min_hours' => round(min($hours), 2),
                'max_hours' => round(max($hours), 2),
            ];
        }

        // Overall average processing time (pending → resolved)
        $resolvedSignalements = array_filter($perSignalement, function ($s) {
            return $s['current_status'] === 'resolved';
        });

        $avgTotalHoursResolved = null;
        $avgTotalDaysResolved = null;

        if (count($resolvedSignalements) > 0) {
            $totalHours = array_sum(array_column($resolvedSignalements, 'total_hours'));
            $avgTotalHoursResolved = round($totalHours / count($resolvedSignalements), 2);
            $avgTotalDaysResolved = round($avgTotalHoursResolved / 24, 2);
        }

        Log::info('Statistics computed: ' . count($perSignalement) . ' signalements with history');

        return $this->successResponse([
            'average_delays' => $averageDelays,
            'per_signalement' => $perSignalement,
            'summary' => [
                'total_with_history' => count($perSignalement),
                'total_resolved' => count($resolvedSignalements),
                'avg_resolution_hours' => $avgTotalHoursResolved,
                'avg_resolution_days' => $avgTotalDaysResolved,
            ],
        ]);
    }
}
