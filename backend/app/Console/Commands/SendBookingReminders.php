<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Services\EmailService;
use Carbon\Carbon;
use Illuminate\Console\Command;

class SendBookingReminders extends Command
{
    protected $signature = 'bookings:send-reminders';

    protected $description = 'Gửi nhắc nhở trước chuyến đi cho các booking sắp khởi hành';

    public function handle(EmailService $emailService): int
    {
        $tomorrow = Carbon::tomorrow()->toDateString();

        $bookings = Booking::with(['tour', 'user'])
            ->where('status', 'confirmed')
            ->whereDate('departure_date', $tomorrow)
            ->get();

        foreach ($bookings as $booking) {
            if (! $booking->user?->email) {
                continue;
            }

            $emailService->sendPreDepartureReminder($booking->user->email, [
                'booking_id' => (string) $booking->_id,
                'tour' => $booking->tour?->title,
                'departure_date' => optional($booking->departure_date)->toDateString(),
            ]);
        }

        $this->info('Đã xử lý '.count($bookings).' booking cần nhắc lịch.');

        return self::SUCCESS;
    }
}
