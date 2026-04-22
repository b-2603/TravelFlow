<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Console\Command;

class PurgeCancelledBookings extends Command
{
    protected $signature = 'travelflow:purge-cancelled-bookings
                            {email : Customer email to purge cancelled bookings for}
                            {--force : Actually delete data (otherwise dry-run)}';

    protected $description = 'Delete cancelled bookings of a customer (and related records) from MongoDB.';

    public function handle(): int
    {
        $email = (string) $this->argument('email');
        $force = (bool) $this->option('force');

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error('User not found: '.$email);
            return self::FAILURE;
        }

        $bookings = Booking::where('user_id', $user->_id)->where('status', 'cancelled')->get(['_id']);
        $bookingIds = $bookings->pluck('_id')->all();
        $count = count($bookingIds);

        $this->info('User: '.$email);
        $this->info('Cancelled bookings found: '.$count);

        if ($count === 0) {
            return self::SUCCESS;
        }

        $paymentsCount = Payment::whereIn('booking_id', $bookingIds)->count();
        $refundsCount = RefundRequest::whereIn('booking_id', $bookingIds)->count();
        $supportCount = SupportTicket::whereIn('booking_id', $bookingIds)->count();
        $reviewsCount = Review::whereIn('booking_id', $bookingIds)->count();

        $this->line('Related records:');
        $this->line('  payments: '.$paymentsCount);
        $this->line('  refund_requests: '.$refundsCount);
        $this->line('  support_tickets: '.$supportCount);
        $this->line('  reviews: '.$reviewsCount);

        if (! $force) {
            $this->warn('Dry-run only. Re-run with --force to actually delete.');
            return self::SUCCESS;
        }

        Payment::whereIn('booking_id', $bookingIds)->delete();
        RefundRequest::whereIn('booking_id', $bookingIds)->delete();
        SupportTicket::whereIn('booking_id', $bookingIds)->delete();
        Review::whereIn('booking_id', $bookingIds)->delete();
        Booking::whereIn('_id', $bookingIds)->delete();

        $this->info('Deleted cancelled bookings and related records successfully.');

        return self::SUCCESS;
    }
}

