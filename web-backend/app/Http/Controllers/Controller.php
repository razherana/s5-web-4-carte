<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use OpenApi\Attributes as OA;

#[OA\Info(
    version: '1.0.0',
    title: 'MrRojo API',
    description: 'API for MrRojo Web application with hybrid authentication (Firebase + Local JWT)',
    contact: new OA\Contact(email: 'support@mrrojo.com')
)]
#[OA\Server(url: 'http://localhost:8000', description: 'Local development server')]
#[OA\SecurityScheme(
    securityScheme: 'bearerAuth',
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Enter your JWT token'
)]
#[OA\Tag(name: 'Authentication', description: 'Authentication endpoints (register, login, refresh token)')]
#[OA\Tag(name: 'User', description: 'User management endpoints')]
#[OA\Tag(name: 'Sync', description: 'Data synchronization endpoints')]
#[OA\Schema(
    schema: 'SuccessResponse',
    properties: [
        new OA\Property(property: 'status', type: 'string', example: 'success'),
        new OA\Property(property: 'data', type: 'object'),
        new OA\Property(property: 'error', type: 'null')
    ]
)]
#[OA\Schema(
    schema: 'ErrorResponse',
    properties: [
        new OA\Property(property: 'status', type: 'string', example: 'error'),
        new OA\Property(property: 'data', type: 'null'),
        new OA\Property(
            property: 'error',
            properties: [
                new OA\Property(property: 'code', type: 'string', example: 'ERROR_CODE'),
                new OA\Property(property: 'message', type: 'string', example: 'Error message')
            ],
            type: 'object'
        )
    ]
)]
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
