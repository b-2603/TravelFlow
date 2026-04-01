<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $payload = $request->attributes->get('jwtPayload');
        $allowedRoles = collect($roles)
            ->flatMap(fn ($role) => explode('|', (string) $role))
            ->filter()
            ->values()
            ->all();

        if (! $payload || ! in_array($payload->role ?? null, $allowedRoles, true)) {
            return response()->json([
                'success' => false,
                'data' => null,
                'message' => 'You do not have permission to access this resource.',
                'code' => 403,
            ], 403);
        }

        return $next($request);
    }
}
