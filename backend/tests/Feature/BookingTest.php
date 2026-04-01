<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Tour;
use App\Models\User;
use App\Services\JwtService;
use Tests\TestCase;

class BookingTest extends TestCase
{
    protected function createBookableTour(): Tour
    {
        return Tour::create([
            'title' => 'Booking Tour',
            'slug' => 'booking-tour',
            'description' => 'Booking enabled tour',
            'destination' => 'Nha Trang',
            'category' => 'Beach',
            'duration_days' => 4,
            'max_pax' => 12,
            'price_per_person' => 3200000,
            'status' => 'approved',
            'departures' => [
                ['date' => now()->addDays(15)->toDateString(), 'available_slots' => 4, 'price_override' => null],
            ],
        ]);
    }

    protected function createCustomer(): array
    {
        $user = User::create([
            'name' => 'Booking Customer',
            'email' => 'booking@example.com',
            'password' => 'Password@123',
            'role' => 'customer',
            'status' => 'active',
        ]);

        return [$user, app(JwtService::class)->generateToken($user)['token']];
    }

    public function test_authenticated_user_can_book_tour(): void
    {
        $tour = $this->createBookableTour();
        [, $token] = $this->createCustomer();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/bookings', [
                'tour_id' => (string) $tour->_id,
                'departure_date' => $tour->departures[0]['date'],
                'num_pax' => 1,
                'passengers' => [
                    ['name' => 'Passenger One', 'dob' => '1995-01-01', 'passport' => 'P12345678'],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_booking_reduces_available_slots(): void
    {
        $tour = $this->createBookableTour();
        [, $token] = $this->createCustomer();

        $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/bookings', [
                'tour_id' => (string) $tour->_id,
                'departure_date' => $tour->departures[0]['date'],
                'num_pax' => 2,
                'passengers' => [
                    ['name' => 'Passenger One', 'dob' => '1995-01-01', 'passport' => 'P12345678'],
                    ['name' => 'Passenger Two', 'dob' => '1998-01-01', 'passport' => 'P87654321'],
                ],
            ]);

        $tour->refresh();

        $this->assertSame(2, $tour->departures[0]['available_slots']);
    }

    public function test_cannot_book_if_no_slots(): void
    {
        $tour = $this->createBookableTour();
        [, $token] = $this->createCustomer();

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/bookings', [
                'tour_id' => (string) $tour->_id,
                'departure_date' => $tour->departures[0]['date'],
                'num_pax' => 10,
                'passengers' => collect(range(1, 10))->map(fn ($index) => [
                    'name' => "Passenger {$index}",
                    'dob' => '1995-01-01',
                    'passport' => "P0000{$index}",
                ])->all(),
            ]);

        $response->assertStatus(422);
    }

    public function test_user_can_cancel_pending_booking(): void
    {
        $tour = $this->createBookableTour();
        [$user, $token] = $this->createCustomer();

        $booking = Booking::create([
            'tour_id' => $tour->_id,
            'user_id' => $user->_id,
            'departure_date' => now()->addDays(15),
            'num_pax' => 1,
            'total_price' => 3200000,
            'status' => 'pending',
            'passengers' => [
                ['name' => 'Passenger One', 'dob' => '1995-01-01', 'passport' => 'P12345678'],
            ],
            'payment_status' => 'unpaid',
        ]);

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/bookings/{$booking->_id}/cancel");

        $response->assertOk()
            ->assertJsonPath('data.status', 'cancelled');
    }
}
