<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Kreait\Laravel\Firebase\Facades\Firebase;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Symfony\Component\HttpFoundation\Response;

class AuthFirebaseMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractToken($request);

        if (!$token) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'No authentication token provided'
            ], 401);
        }

        try {
            $auth = Firebase::auth();
            $verifiedIdToken = $auth->verifyIdToken($token);
            
            // Get the Firebase user ID (uid) from the token
            $uid = $verifiedIdToken->claims()->get('sub');
            
            // Optionally get additional user info from Firebase
            $firebaseUser = $auth->getUser($uid);
            
            // Attach the Firebase user to the request for use in controllers
            $request->attributes->set('firebase_uid', $uid);
            $request->attributes->set('firebase_user', $firebaseUser);
            
        } catch (FailedToVerifyToken $e) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Invalid or expired token'
            ], 401);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unauthorized',
                'message' => 'Authentication failed'
            ], 401);
        }

        return $next($request);
    }

    /**
     * Extract the Bearer token from the Authorization header.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string|null
     */
    protected function extractToken(Request $request): ?string
    {
        $authHeader = $request->header('Authorization');

        if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
            return null;
        }

        return substr($authHeader, 7);
    }
}
