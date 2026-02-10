<?php

namespace App\Http\Controllers;

use App\Models\Entreprise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;
use OpenApi\Attributes as OA;

#[OA\Tag(name: 'Entreprises', description: 'Company management endpoints')]
class EntrepriseController extends Controller
{
    /**
     * Get all entreprises.
     */
    public function index(): JsonResponse
    {
        // Try Firestore first
        if ($this->hasInternetConnection()) {
            try {
                return $this->indexFromFirestore();
            } catch (\Exception $e) {
                Log::warning('Failed to get entreprises from Firestore, falling back to local: ' . $e->getMessage());
            }
        }

        return $this->indexFromLocal();
    }

    protected function indexFromFirestore(): JsonResponse
    {
        Log::info('Getting all entreprises from Firestore');

        $firestore = Firebase::firestore()->database();
        $documents = $firestore->collection('entreprises')->documents();

        $entreprises = [];
        foreach ($documents as $document) {
            if ($document->exists()) {
                $data = $document->data();
                $data['firebase_uid'] = $document->id();
                $entreprises[] = $data;
            }
        }

        Log::info('Retrieved ' . count($entreprises) . ' entreprises from Firestore');

        return $this->successResponse($entreprises);
    }

    protected function indexFromLocal(): JsonResponse
    {
        Log::info('Getting all entreprises from local database');

        $entreprises = Entreprise::all();

        Log::info('Retrieved ' . $entreprises->count() . ' entreprises from local database');

        return $this->successResponse($entreprises);
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
