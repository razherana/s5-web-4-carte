<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class ManagerMiddleware
{
    /**
     * Handle an incoming request.
     * Checks if the authenticated user has a 'manager' role.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'data' => null,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Authentication required',
                ],
            ], 401);
        }

        if ($user->role !== 'manager') {
            return response()->json([
                'status' => 'error',
                'data' => null,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Manager access required',
                ],
            ], 403);
        }

        return $next($request);
    }
}
