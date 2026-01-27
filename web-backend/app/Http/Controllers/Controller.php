<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

abstract class Controller
{
    /**
     * Return a success response.
     */
    protected function successResponse($data, int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => $data,
            'error' => null,
        ], $statusCode);
    }

    /**
     * Return an error response.
     */
    protected function errorResponse(string $code, string $message, int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'status' => 'error',
            'data' => null,
            'error' => [
                'code' => $code,
                'message' => $message,
            ],
        ], $statusCode);
    }
}
