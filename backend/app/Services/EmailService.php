<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class EmailService
{
    public function sendPasswordReset(string $email, string $token): void
    {
        Log::info('Password reset token generated.', [
            'email' => $email,
            'token' => $token,
        ]);
    }

    public function sendBookingConfirmation(string $email, array $payload): void
    {
        Log::info('Booking confirmation email queued.', [
            'email' => $email,
            'payload' => $payload,
        ]);
    }

    public function sendPreDepartureReminder(string $email, array $payload): void
    {
        Log::info('Pre-departure reminder email queued.', [
            'email' => $email,
            'payload' => $payload,
        ]);
    }

    public function sendSupportReply(string $email, array $payload): void
    {
        Log::info('Support reply email queued.', [
            'email' => $email,
            'payload' => $payload,
        ]);
    }
}
