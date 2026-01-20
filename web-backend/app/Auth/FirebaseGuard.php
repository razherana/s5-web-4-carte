<?php

namespace App\Auth;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class FirebaseGuard implements Guard
{
    protected ?Authenticatable $user = null;
    protected Request $request;

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

        try {
            $auth = Firebase::auth();
            $verifiedIdToken = $auth->verifyIdToken($token);

            // Get the Firebase user ID (uid) from the token
            $uid = $verifiedIdToken->claims()->get('sub');

            // Find or create user in our database
            $this->user = User::where('firebase_uid', $uid)->first();

            // Store Firebase info in request for additional use
            if ($this->user) {
                $this->request->attributes->set('firebase_uid', $uid);
                $this->request->attributes->set('firebase_user', $auth->getUser($uid));
            }

            return $this->user;
        } catch (FailedToVerifyToken $e) {
            return null;
        } catch (\Exception $e) {
            return null;
        }
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
        if (empty($credentials['token'])) {
            return false;
        }

        try {
            $auth = Firebase::auth();
            $auth->verifyIdToken($credentials['token']);
            return true;
        } catch (\Exception $e) {
            return false;
        }
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
