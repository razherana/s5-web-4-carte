<?php

namespace App\Auth;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class HybridGuard implements Guard
{
    protected ?Authenticatable $user = null;
    protected Request $request;
    protected bool $firebaseAvailable = true;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    /**
     * Determine if the current user is authenticated.
     */
    public function check(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Determine if the current user is a guest.
     */
    public function guest(): bool
    {
        return !$this->check();
    }

    /**
     * Get the currently authenticated user.
     */
    public function user(): ?Authenticatable
    {
        if ($this->user !== null) {
            return $this->user;
        }

        $token = $this->extractToken();

        if (!$token) {
            return null;
        }

        // Check auth mode from header (firebase or local)
        $authMode = $this->request->header('X-Auth-Mode', 'firebase');

        if ($authMode === 'local') {
            return $this->authenticateLocal($token);
        }

        return $this->authenticateFirebase($token);
    }

    /**
     * Authenticate using Firebase token.
     */
    protected function authenticateFirebase(string $token): ?Authenticatable
    {
        try {
            $auth = Firebase::auth();
            $verifiedIdToken = $auth->verifyIdToken($token);

            // Get the Firebase user ID (uid) from the token
            $uid = $verifiedIdToken->claims()->get('sub');

            // Find user in our database
            $this->user = User::where('firebase_uid', $uid)->first();

            // Store Firebase info in request for additional use
            if ($this->user) {
                $this->request->attributes->set('firebase_uid', $uid);
                $this->request->attributes->set('auth_mode', 'firebase');

                try {
                    $this->request->attributes->set('firebase_user', $auth->getUser($uid));
                } catch (\Exception $e) {
                    // Firebase user fetch failed, but token is valid
                }
            }

            return $this->user;
        } catch (FailedToVerifyToken $e) {
            return null;
        } catch (\Exception $e) {
            // Firebase not available, try local auth as fallback
            return $this->authenticateLocal($token);
        }
    }

    /**
     * Authenticate using local JWT-like token (base64 encoded user_id:timestamp:signature).
     */
    protected function authenticateLocal(string $token): ?Authenticatable
    {
        try {
            $decoded = base64_decode($token);
            $parts = explode(':', $decoded);

            if (count($parts) !== 3) {
                return null;
            }

            [$userId, $timestamp, $signature] = $parts;

            // Check if token is expired (24 hours)
            if ((time() - (int)$timestamp) > 86400) {
                return null;
            }

            // Verify signature
            $expectedSignature = hash_hmac('sha256', $userId . ':' . $timestamp, config('app.key'));
            if (!hash_equals($expectedSignature, $signature)) {
                return null;
            }

            $this->user = User::find($userId);

            if ($this->user) {
                $this->request->attributes->set('auth_mode', 'local');
            }

            return $this->user;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate a local auth token for a user.
     */
    public static function generateLocalToken(User $user): string
    {
        $timestamp = time();
        $signature = hash_hmac('sha256', $user->id . ':' . $timestamp, config('app.key'));
        return base64_encode($user->id . ':' . $timestamp . ':' . $signature);
    }

    /**
     * Get the ID for the currently authenticated user.
     */
    public function id(): mixed
    {
        $user = $this->user();
        return $user?->getAuthIdentifier();
    }

    /**
     * Validate a user's credentials.
     */
    public function validate(array $credentials = []): bool
    {
        // Validate with email and password
        if (!empty($credentials['email']) && !empty($credentials['password'])) {
            $user = User::where('email', $credentials['email'])->first();
            if ($user && Hash::check($credentials['password'], $user->password)) {
                return true;
            }
        }

        // Validate with Firebase token
        if (!empty($credentials['token'])) {
            try {
                $auth = Firebase::auth();
                $auth->verifyIdToken($credentials['token']);
                return true;
            } catch (\Exception $e) {
                return false;
            }
        }

        return false;
    }

    /**
     * Determine if the guard has a user instance.
     */
    public function hasUser(): bool
    {
        return $this->user !== null;
    }

    /**
     * Set the current user.
     */
    public function setUser(Authenticatable $user): static
    {
        $this->user = $user;
        return $this;
    }

    /**
     * Extract the Bearer token from the Authorization header.
     */
    protected function extractToken(): ?string
    {
        $authHeader = $this->request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        return substr($authHeader, 7);
    }
}
