<?php

namespace App\Auth;

use App\Models\User;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Cache;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;

class HybridGuard implements Guard
{
    protected ?Authenticatable $user = null;
    protected Request $request;
    protected bool $firebaseAvailable = true;

    // JWT token lifetime in seconds (1 hour)
    protected const JWT_LIFETIME = 3600;

    // Refresh token lifetime in seconds (7 days)
    protected const REFRESH_TOKEN_LIFETIME = 604800;

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

        // Always authenticate using JWT
        return $this->authenticateLocal($token);
    }

    /**
     * Authenticate using local JWT token.
     */
    protected function authenticateLocal(string $token): ?Authenticatable
    {
        try {
            $payload = $this->verifyJWT($token);

            if (!$payload) {
                return null;
            }

            // Check if token is expired
            if (isset($payload['exp']) && time() > $payload['exp']) {
                return null;
            }

            // Check if token is not yet valid
            if (isset($payload['nbf']) && time() < $payload['nbf']) {
                return null;
            }

            $this->user = User::find($payload['user_id']);

            if ($this->user) {
                $authMode = $payload['auth_mode'] ?? 'local';
                $this->request->attributes->set('auth_mode', $authMode);
                $this->request->attributes->set('user', [
                    'id' => $this->user->id,
                    'email' => $this->user->email,
                    'role' => $this->user->role,
                    'firebase_uid' => $this->user->firebase_uid,
                ]);

                // Store Firebase token if present
                if (isset($payload['firebase_token'])) {
                    $this->request->attributes->set('firebase_token', $payload['firebase_token']);
                }

                if (isset($payload['firebase_uid'])) {
                    $this->request->attributes->set('firebase_uid', $payload['firebase_uid']);
                }
            }

            return $this->user;
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Generate JWT access token for a user.
     */
    public static function generateLocalToken(User $user, ?string $firebaseToken = null, string $authMode = 'local'): string
    {
        $now = time();
        $payload = [
            'iat' => $now, // Issued at
            'nbf' => $now, // Not before
            'exp' => $now + self::JWT_LIFETIME, // Expiration
            'user_id' => $user->id,
            'email' => $user->email,
            'role' => $user->role,
            'auth_mode' => $authMode,
        ];

        // Include Firebase token and UID if provided
        if ($firebaseToken) {
            $payload['firebase_token'] = $firebaseToken;
        }

        if ($user->firebase_uid) {
            $payload['firebase_uid'] = $user->firebase_uid;
        }

        return self::createJWT($payload);
    }

    /**
     * Generate refresh token for a user.
     */
    public static function generateRefreshToken(User $user): string
    {
        $now = time();
        $refreshToken = bin2hex(random_bytes(32));

        // Store refresh token in cache with expiration
        Cache::put(
            'refresh_token:' . $refreshToken,
            [
                'user_id' => $user->id,
                'created_at' => $now,
            ],
            self::REFRESH_TOKEN_LIFETIME
        );

        return $refreshToken;
    }

    /**
     * Validate refresh token and return user.
     */
    public static function validateRefreshToken(string $refreshToken): ?User
    {
        $data = Cache::get('refresh_token:' . $refreshToken);

        if (!$data || !isset($data['user_id'])) {
            return null;
        }

        return User::find($data['user_id']);
    }

    /**
     * Revoke refresh token.
     */
    public static function revokeRefreshToken(string $refreshToken): void
    {
        Cache::forget('refresh_token:' . $refreshToken);
    }

    /**
     * Create JWT token from payload.
     */
    protected static function createJWT(array $payload): string
    {
        $header = [
            'typ' => 'JWT',
            'alg' => 'HS256',
        ];

        $headerEncoded = self::base64UrlEncode(json_encode($header));
        $payloadEncoded = self::base64UrlEncode(json_encode($payload));

        $signature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            config('app.key'),
            true
        );

        $signatureEncoded = self::base64UrlEncode($signature);

        return $headerEncoded . '.' . $payloadEncoded . '.' . $signatureEncoded;
    }

    /**
     * Verify and decode JWT token.
     */
    protected function verifyJWT(string $token): ?array
    {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        [$headerEncoded, $payloadEncoded, $signatureEncoded] = $parts;

        // Verify signature
        $expectedSignature = hash_hmac(
            'sha256',
            $headerEncoded . '.' . $payloadEncoded,
            config('app.key'),
            true
        );

        $signature = self::base64UrlDecode($signatureEncoded);

        if (!hash_equals($expectedSignature, $signature)) {
            return null;
        }

        // Decode payload
        $payload = json_decode(self::base64UrlDecode($payloadEncoded), true);

        return $payload;
    }

    /**
     * Base64 URL encode.
     */
    protected static function base64UrlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode.
     */
    protected static function base64UrlDecode(string $data): string
    {
        return base64_decode(strtr($data, '-_', '+/'));
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
