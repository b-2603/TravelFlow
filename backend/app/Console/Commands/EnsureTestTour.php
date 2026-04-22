<?php

namespace App\Console\Commands;

use App\Models\Tour;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Console\Command;

class EnsureTestTour extends Command
{
    /**
     * Create/update a pinned "1.000đ" tour for payment testing.
     */
    protected $signature = 'travelflow:ensure-test-tour {--unpin : Do not pin the test tour to the top}';

    protected $description = 'Ensure the 1.000đ test tour exists (for payment/QR testing) and is pinned to the top.';

    public function handle(): int
    {
        $slug = 'tour-test-thanh-toan-1000-vnd';
        $testAmount = 2000;

        $creator = User::whereIn('role', ['tour_manager', 'admin'])->first();
        if (! $creator) {
            $this->error('No suitable creator user found (tour_manager/admin). Please seed users first.');

            return self::FAILURE;
        }

        $departureDate = Carbon::now()->addDays(3)->toDateString();

        $payload = [
            'title' => 'Tour test thanh toán 2.000đ',
            'slug' => $slug,
            'description' => 'Dữ liệu mẫu chuyên dùng để kiểm tra luồng đặt tour và thanh toán với giá trị nhỏ.',
            'destination' => 'Môi trường kiểm thử',
            'category' => 'Test',
            'pinned' => ! (bool) $this->option('unpin'),
            'duration_days' => 1,
            'max_pax' => 10,
            'price_per_person' => $testAmount,
            'promotion_type' => 'none',
            'promotion_value' => 0,
            'images' => [
                'https://picsum.photos/seed/tour-test-thanh-toan-1000-vnd/1200/800',
            ],
            'highlights' => [
                'Giá trị thấp để test thanh toán',
                'Dễ tìm trong danh sách tour',
                'Không ảnh hưởng tour thật',
            ],
            'itinerary' => [
                [
                    'day' => 1,
                    'title' => 'Thực hiện test thanh toán',
                    'description' => 'Dùng tour này để kiểm tra luồng đặt chỗ, QR và xác nhận thanh toán.',
                ],
            ],
            'status' => 'approved',
            'reject_reason' => null,
            'approved_at' => Carbon::now(),
            'created_by' => $creator->_id,
            'linked_partner_ids' => [],
            'assigned_guide_id' => null,
            'departures' => [
                [
                    'date' => $departureDate,
                    'available_slots' => 10,
                    'price_override' => $testAmount,
                    'status' => 'active',
                    'assigned_guide_id' => null,
                ],
            ],
            'deleted_at' => null,
        ];

        $tour = Tour::where('slug', $slug)->first();
        if ($tour) {
            $tour->fill($payload);
            $tour->save();
            $this->info('Updated: '.$slug);
        } else {
            Tour::create($payload);
            $this->info('Created: '.$slug);
        }

        return self::SUCCESS;
    }
}
