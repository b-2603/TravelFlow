<?php

namespace Tests\Feature;

use App\Models\Tour;
use App\Models\User;
use App\Services\JwtService;
use Tests\TestCase;

class TourTest extends TestCase
{
    public function test_guest_can_list_tours(): void
    {
        Tour::create([
            'title' => 'Guest Tour',
            'slug' => 'guest-tour',
            'description' => 'Public tour',
            'destination' => 'Da Nang',
            'category' => 'Beach',
            'duration_days' => 3,
            'max_pax' => 10,
            'price_per_person' => 1000000,
            'status' => 'approved',
            'departures' => [['date' => now()->addDays(10)->toDateString(), 'available_slots' => 8, 'price_override' => null]],
        ]);

        $response = $this->getJson('/api/tours');

        $response->assertOk()
            ->assertJsonPath('success', true);
    }

    public function test_manager_can_create_tour(): void
    {
        $manager = User::create([
            'name' => 'Manager User',
            'email' => 'manager@example.com',
            'password' => 'Password@123',
            'role' => 'tour_manager',
            'status' => 'active',
        ]);

        $token = app(JwtService::class)->generateToken($manager)['token'];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/tours', [
                'title' => 'Manager Tour',
                'description' => 'Created by manager',
                'destination' => 'Ha Noi',
                'category' => 'Culture',
                'duration_days' => 4,
                'max_pax' => 15,
                'price_per_person' => 2500000,
                'departures' => [
                    ['date' => now()->addDays(12)->toDateString(), 'available_slots' => 12, 'price_override' => null],
                ],
            ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true);
    }

    public function test_customer_cannot_create_tour(): void
    {
        $customer = User::create([
            'name' => 'Customer User',
            'email' => 'customer-tour@example.com',
            'password' => 'Password@123',
            'role' => 'customer',
            'status' => 'active',
        ]);

        $token = app(JwtService::class)->generateToken($customer)['token'];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson('/api/tours', [
                'title' => 'Blocked Tour',
                'description' => 'Should fail',
                'destination' => 'Sa Pa',
                'category' => 'Mountain',
                'duration_days' => 3,
                'max_pax' => 10,
                'price_per_person' => 1500000,
                'departures' => [
                    ['date' => now()->addDays(12)->toDateString(), 'available_slots' => 10, 'price_override' => null],
                ],
            ]);

        $response->assertStatus(403)
            ->assertJsonPath('success', false);
    }

    public function test_admin_can_approve_tour(): void
    {
        $admin = User::create([
            'name' => 'Admin User',
            'email' => 'admin-tour@example.com',
            'password' => 'Password@123',
            'role' => 'admin',
            'status' => 'active',
        ]);

        $tour = Tour::create([
            'title' => 'Pending Tour',
            'slug' => 'pending-tour',
            'description' => 'Awaiting approval',
            'destination' => 'Phu Quoc',
            'category' => 'Resort',
            'duration_days' => 5,
            'max_pax' => 20,
            'price_per_person' => 4500000,
            'status' => 'pending',
            'departures' => [['date' => now()->addDays(20)->toDateString(), 'available_slots' => 14, 'price_override' => null]],
        ]);

        $token = app(JwtService::class)->generateToken($admin)['token'];

        $response = $this->withHeader('Authorization', "Bearer {$token}")
            ->postJson("/api/admin/tours/{$tour->_id}/approve");

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.status', 'approved');
    }
}
