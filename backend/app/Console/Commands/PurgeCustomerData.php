<?php

namespace App\Console\Commands;

use App\Models\Booking;
use App\Models\FavoriteTour;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\Tour;
use App\Models\User;
use App\Services\TourDepartureService;
use Illuminate\Console\Command;

class PurgeCustomerData extends Command
{
    protected $signature = 'travelflow:purge-customer-data
                            {email : Customer email to purge data for}
                            {--force : Actually delete data (otherwise dry-run)}';

    protected $description = 'Reset a customer account by deleting all customer-related data (bookings/payments/refunds/support/reviews/favorites) and restoring tour slots.';

    public function handle(TourDepartureService $departureService): int
    {
        $email = (string) $this->argument('email');
        $force = (bool) $this->option('force');

        $user = User::where('email', $email)->first();
        if (! $user) {
            $this->error('User not found: '.$email);
            return self::FAILURE;
        }

        $bookings = Booking::where('user_id', $user->_id)->get();
        $bookingIds = $bookings->pluck('_id')->all();

        $this->info('User: '.$email);
        $this->info('Bookings found: '.count($bookingIds));

        $paymentsCount = empty($bookingIds) ? 0 : Payment::whereIn('booking_id', $bookingIds)->count();
        $refundsCount = empty($bookingIds) ? 0 : RefundRequest::whereIn('booking_id', $bookingIds)->count();
        $supportByBookingCount = empty($bookingIds) ? 0 : SupportTicket::whereIn('booking_id', $bookingIds)->count();
        $supportByUserCount = SupportTicket::where('user_id', $user->_id)->count();
        $reviewsCount = empty($bookingIds) ? 0 : Review::whereIn('booking_id', $bookingIds)->count();
        $favoritesCount = FavoriteTour::where('user_id', $user->_id)->count();

        $this->line('Related records:');
        $this->line('  payments: '.$paymentsCount);
        $this->line('  refund_requests: '.$refundsCount);
        $this->line('  support_tickets(by booking): '.$supportByBookingCount);
        $this->line('  support_tickets(by user): '.$supportByUserCount);
        $this->line('  reviews: '.$reviewsCount);
        $this->line('  favorites: '.$favoritesCount);

        if (! $force) {
            $this->warn('Dry-run only. Re-run with --force to actually delete.');
            return self::SUCCESS;
        }

        // Restore tour slots for bookings that actually decremented slots (cancelled bookings already restored).
        foreach ($bookings as $booking) {
            if (($booking->status ?? null) === 'cancelled') {
                continue;
            }

            $tour = Tour::find($booking->tour_id);
            if (! $tour) {
                continue;
            }

            $departureDate = optional($booking->departure_date)->toDateString();
            $numPax = (int) ($booking->num_pax ?? 0);

            if ($departureDate && $numPax > 0) {
                $departureService->incrementSlots($tour, $departureDate, $numPax);
            }
        }

        if (! empty($bookingIds)) {
            Payment::whereIn('booking_id', $bookingIds)->delete();
            RefundRequest::whereIn('booking_id', $bookingIds)->delete();
            SupportTicket::whereIn('booking_id', $bookingIds)->delete();
            Review::whereIn('booking_id', $bookingIds)->delete();
            Booking::whereIn('_id', $bookingIds)->delete();
        }

        // Cleanup any remaining user-scoped data.
        SupportTicket::where('user_id', $user->_id)->delete();
        FavoriteTour::where('user_id', $user->_id)->delete();

        $this->info('Customer data purged successfully.');

        return self::SUCCESS;
    }
}

