<?php

namespace App\Services;

use App\Models\TokenBlacklist;
use App\Models\User;
use Carbon\Carbon;
use Firebase\JWT\ExpiredException;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Throwable;

class JwtService
{
    public function generateToken(User $user): array
    {
        $issuedAt = Carbon::now();
        $expiresIn = (int) env('JWT_EXPIRE', 3600);
        $expiresAt = $issuedAt->copy()->addSeconds($expiresIn);

        $payload = array_merge(
            [
                'sub' => $user->getJwtIdentifier(),
                'iat' => $issuedAt->timestamp,
                'exp' => $expiresAt->timestamp,
                'jti' => bin2hex(random_bytes(16)),
            ],
            $user->getJwtCustomClaims()
        );

        return [
            'token' => JWT::encode($payload, (string) env('JWT_SECRET'), 'HS256'),
            'expires_in' => $expiresIn,
            'payload' => $payload,
        ];
    }

    public function validateToken(string $token): array
    {
        try {
            $decoded = JWT::decode($token, new Key((string) env('JWT_SECRET'), 'HS256'));

            return [
                'valid' => true,
                'payload' => json_decode(json_encode($decoded), true),
                'message' => 'Token is valid.',
            ];
        } catch (ExpiredException) {
            return [
                'valid' => false,
                'payload' => null,
                'message' => 'Token has expired.',
            ];
        } catch (Throwable) {
            return [
                'valid' => false,
                'payload' => null,
                'message' => 'Token is invalid.',
            ];
        }
    }

    public function blacklistToken(string $token): void
    {
        $validation = $this->validateToken($token);

        if (! $validation['valid'] || empty($validation['payload']['exp'])) {
            return;
        }

        TokenBlacklist::updateOrCreate(
            ['token' => $token],
            [
                'token' => $token,
                'expires_at' => Carbon::createFromTimestamp((int) $validation['payload']['exp']),
                'created_at' => Carbon::now(),
            ]
        );
    }

    public function isBlacklisted(string $token): bool
    {
        return TokenBlacklist::where('token', $token)
            ->where('expires_at', '>=', Carbon::now())
            ->exists();
    }
}
