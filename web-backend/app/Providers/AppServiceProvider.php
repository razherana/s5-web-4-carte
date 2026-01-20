<?php

namespace App\Providers;

use App\Auth\FirebaseGuard;
use App\Auth\HybridGuard;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Firebase-only guard
        Auth::extend('firebase', function ($app, $name, array $config) {
            return new FirebaseGuard($app['request']);
        });

        // Hybrid guard (Firebase + Local fallback)
        Auth::extend('hybrid', function ($app, $name, array $config) {
            return new HybridGuard($app['request']);
        });
    }
}
