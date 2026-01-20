<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\SyncController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Auth routes (public)
Route::prefix('api/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/firebase', [AuthController::class, 'firebaseAuth']);
});

// Protected auth routes
Route::middleware('auth.firebase')->prefix('api/auth')->group(function () {
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/sync-firebase', [AuthController::class, 'syncWithFirebase']);
});

// Manager-only routes (requires Firebase auth + manager role)
Route::middleware(['auth.firebase', 'manager'])->group(function () {
    Route::post('/api/sync/signalements', [SyncController::class, 'syncSignalements']);
});
