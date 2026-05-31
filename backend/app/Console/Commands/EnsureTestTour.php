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
                'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
            ],
            'highlights' => [
                'Giá trị thấp để test thanh toán',
                'Dễ tìm trong danh sách tour',
                'Không ảnh hưởng tour thật',
            ],
            'destination_overview' => 'Tour kiểm thử nội bộ, mô phỏng cấu trúc một tour thật để kiểm tra luồng hiển thị và thanh toán.',
            'historical_background' => 'Không áp dụng cho tour kiểm thử.',
            'local_culture' => [
                'Dữ liệu giả lập để kiểm thử giao diện',
                'Không dùng cho vận hành thực tế',
            ],
            'best_time_to_visit' => 'Bất kỳ thời điểm nào trong môi trường kiểm thử.',
            'weather_notes' => 'Không áp dụng.',
            'included_services' => [
                'Dữ liệu kiểm thử giả lập',
                'Lịch trình demo',
                'Ảnh minh hoạ',
            ],
            'excluded_services' => [
                'Không áp dụng cho đặt tour thật',
            ],
            'suitable_for' => ['Kiểm thử nội bộ'],
            'travel_tips' => [
                'Không dùng tour này để chạy chiến dịch thật',
                'Dùng để kiểm tra luồng đặt chỗ / thanh toán',
            ],
            'meeting_point' => 'Môi trường kiểm thử',
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
