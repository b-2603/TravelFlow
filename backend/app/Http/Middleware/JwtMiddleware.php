<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Services\JwtService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class JwtMiddleware
{
    public function __construct(private readonly JwtService $jwtService)
    {
    }

    public function handle(Request $request, Closure $next): Response
    {
        $token = $this->extractBearerToken($request);

        if (! $token) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Authorization token is required.',
                'code' => 401,
            ], 401);
        }

        if ($this->jwtService->isBlacklisted($token)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'Token has been blacklisted.',
                'code' => 401,
            ], 401);
        }

        $validation = $this->jwtService->validateToken($token);

        if (! $validation['valid']) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => $validation['message'],
                'code' => 401,
            ], 401);
        }

        $payload = (object) $validation['payload'];
        $user = User::find($payload->sub);

        if (! $user || $user->status === 'locked') {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'User is unavailable.',
                'code' => 401,
            ], 401);
        }

        $request->attributes->set('jwtPayload', $payload);
        $request->attributes->set('jwtToken', $token);
        $request->setUserResolver(fn () => $user);

        return $next($request);
    }

    private function extractBearerToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');

        if (! str_starts_with($header, 'Bearer ')) {
            return null;
        }

        return trim(substr($header, 7));
    }
}
