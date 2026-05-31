<?php

namespace Tests\Feature;

use App\Models\User;
use Tests\TestCase;

class AuthTest extends TestCase
{
    public function test_user_can_register(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Test Customer',
            'email' => 'customer@example.com',
            'password' => 'Password@123',
            'password_confirmation' => 'Password@123',
            'phone' => '0909999999',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['token', 'user', 'expires_in']]);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::create([
            'name' => 'Login User',
            'email' => 'login@example.com',
            'password' => 'Password@123',
            'role' => 'customer',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'login@example.com',
            'password' => 'Password@123',
        ]);

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'login@example.com');
    }

    public function test_login_returns_jwt_token(): void
    {
        User::create([
            'name' => 'JWT User',
            'email' => 'jwt@example.com',
            'password' => 'Password@123',
            'role' => 'customer',
            'status' => 'active',
        ]);

        $response = $this->postJson('/api/auth/login', [
            'email' => 'jwt@example.com',
            'password' => 'Password@123',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['data' => ['token']]);
    }

    public function test_invalid_credentials_return_401(): void
    {
        $response = $this->postJson('/api/auth/login', [
            'email' => 'missing@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_protected_route_requires_token(): void
    {
        $response = $this->getJson('/api/auth/me');

        $response->assertStatus(401)
            ->assertJsonPath('success', false);
    }

    public function test_user_can_view_profile_after_login(): void
    {
        User::create([
            'name' => 'Profile User',
            'email' => 'profile@example.com',
            'password' => 'Password@123',
            'role' => 'customer',
            'status' => 'active',
        ]);

        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => 'profile@example.com',
            'password' => 'Password@123',
        ]);

        $loginResponse->assertOk()->assertJsonPath('success', true);

        $token = $loginResponse->json('data.token');

        $meResponse = $this->withHeaders([
            'Authorization' => "Bearer {$token}",
        ])->getJson('/api/auth/me');

        $meResponse->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.user.email', 'profile@example.com');
    }
}
