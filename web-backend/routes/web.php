<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\EntrepriseController;
use App\Http\Controllers\SignalementController;
use App\Http\Controllers\StatusHistoryController;
use App\Http\Controllers\SyncController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Auth routes (public)
Route::prefix('api/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
});

// Protected auth routes
Route::middleware('auth.firebase')->prefix('api/auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/sync-firebase', [AuthController::class, 'syncWithFirebase']);
    Route::put('/profile', [AuthController::class, 'updateProfile']);
});

// Signalements routes (protected)
Route::prefix('api')->group(function () {
    Route::get('/signalements', [SignalementController::class, 'index']);
    Route::get('/signalements/{id}', [SignalementController::class, 'show']);
    Route::post('/signalements', [SignalementController::class, 'store']);
    Route::put('/signalements/{id}', [SignalementController::class, 'update']);
    Route::delete('/signalements/{id}', [SignalementController::class, 'destroy']);

    // Status history
    Route::get('/signalements/{id}/status-history', [StatusHistoryController::class, 'index']);
    Route::post('/signalements/{id}/status-history', [StatusHistoryController::class, 'store']);

    // Entreprises (accessible to authenticated users)
    Route::get('/entreprises', [EntrepriseController::class, 'index']);
});

// Manager-only routes (requires Firebase auth + manager role)
Route::middleware(['auth.firebase', 'manager'])->prefix('api')->group(function () {
    // User management
    Route::get('/users', [UserController::class, 'index']);
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{id}', [UserController::class, 'update']);
    Route::post('/users/{id}/unblock', [UserController::class, 'unblock']);
    Route::post('/users/{id}/block', [UserController::class, 'block']);
    Route::delete('/users/{id}', [UserController::class, 'destroy']);

    // Sync operations
    Route::post('/signalements/sync', [SignalementController::class, 'sync']);
    Route::post('/sync/users', [SyncController::class, 'syncUsers']);
    Route::post('/sync/all', [SyncController::class, 'syncAll']);
    Route::post('/sync/pull', [SyncController::class, 'pullFromFirebase']);

    // Statistics
    Route::get('/statistics/processing-times', [StatusHistoryController::class, 'statistics']);

    // Legacy route
    Route::post('/unlock-account', [AuthController::class, 'unlockAccount']);
});

