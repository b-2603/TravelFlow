<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\FavoriteTour;
use App\Models\Guide;
use App\Models\Partner;
use App\Models\PartnerService;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\Review;
use App\Models\SupportTicket;
use App\Models\Tour;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        User::truncate();
        Tour::truncate();
        Booking::truncate();
        Payment::truncate();
        Review::truncate();
        FavoriteTour::truncate();
        SupportTicket::truncate();
        RefundRequest::truncate();
        Partner::truncate();
        PartnerService::truncate();
        Guide::truncate();
        ActivityLog::truncate();

        $admin = User::create([
            'name' => 'Quản trị hệ thống',
            'username' => 'quan_tri',
            'email' => 'quantri@travel.local',
            'password' => 'Admin@123456',
            'phone' => '0900000000',
            'avatar' => 'https://i.pravatar.cc/300?img=1',
            'role' => 'admin',
            'role_name_vi' => User::roleNameMap()['admin'],
            'status' => 'active',
            'address' => 'TP. Hồ Chí Minh',
        ]);

        $seedUsers = [
            ['role' => 'tour_manager', 'name' => 'Quản lý tour 01', 'username' => 'quan_ly_tour_01', 'email' => 'quanlytour01@travel.local'],
            ['role' => 'agent', 'name' => 'Nhân viên tư vấn 01', 'username' => 'tu_van_01', 'email' => 'tuvan01@travel.local'],
            ['role' => 'accountant', 'name' => 'Kế toán 01', 'username' => 'ke_toan_01', 'email' => 'ketoan01@travel.local'],
            ['role' => 'guide', 'name' => 'Hướng dẫn viên 01', 'username' => 'huong_dan_01', 'email' => 'huongdan01@travel.local'],
            ['role' => 'guide', 'name' => 'Hướng dẫn viên 02', 'username' => 'huong_dan_02', 'email' => 'huongdan02@travel.local'],
            ['role' => 'guide', 'name' => 'Hướng dẫn viên 03', 'username' => 'huong_dan_03', 'email' => 'huongdan03@travel.local'],
            ['role' => 'partner', 'name' => 'Đối tác dịch vụ 01', 'username' => 'doi_tac_01', 'email' => 'doitac01@travel.local'],
            ['role' => 'customer', 'name' => 'Khách hàng 01', 'username' => 'khach_hang_01', 'email' => 'khachhang01@travel.local'],
            ['role' => 'customer', 'name' => 'Khách hàng 02', 'username' => 'khach_hang_02', 'email' => 'khachhang02@travel.local'],
            ['role' => 'customer', 'name' => 'Khách hàng 03', 'username' => 'khach_hang_03', 'email' => 'khachhang03@travel.local'],
            ['role' => 'customer', 'name' => 'Khách hàng 04', 'username' => 'khach_hang_04', 'email' => 'khachhang04@travel.local'],
        ];

        $users = collect();

        foreach ($seedUsers as $index => $seedUser) {
            $users->push(User::create([
                'name' => $seedUser['name'],
                'username' => $seedUser['username'],
                'email' => $seedUser['email'],
                'password' => 'Password@123',
                'phone' => '09000000'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'avatar' => 'https://i.pravatar.cc/300?img='.($index + 2),
                'role' => $seedUser['role'],
                'role_name_vi' => User::roleNameMap()[$seedUser['role']] ?? $seedUser['role'],
                'status' => 'active',
                'address' => 'Việt Nam',
            ]));
        }

        $creator = $users->firstWhere('role', 'tour_manager') ?? $admin;
        $agent = $users->firstWhere('role', 'agent');
        $guideCandidate = $users->firstWhere('role', 'guide');
        $partnerCandidate = $users->firstWhere('role', 'partner');
        $customers = $users->where('role', 'customer')->values();
        $destinations = [
            ['Khám phá Đà Nẵng', 'kham-pha-da-nang', 'Đà Nẵng', 'Biển'],
            ['Di sản Hà Nội', 'di-san-ha-noi', 'Hà Nội', 'Văn hóa'],
            ['Nghỉ dưỡng Phú Quốc', 'nghi-duong-phu-quoc', 'Phú Quốc', 'Resort'],
            ['Phiêu lưu Sa Pa', 'phieu-luu-sa-pa', 'Sa Pa', 'Núi'],
            ['Nha Trang cho gia đình', 'nha-trang-gia-dinh', 'Nha Trang', 'Gia đình'],
            ['Đêm phố cổ Hội An', 'dem-pho-co-hoi-an', 'Hội An', 'Văn hóa'],
            ['Du thuyền Vịnh Hạ Long', 'du-thuyen-vinh-ha-long', 'Hạ Long', 'Du thuyền'],
            ['Nghỉ dưỡng Đà Lạt', 'nghi-duong-da-lat', 'Đà Lạt', 'Thiên nhiên'],
            ['Hành trình cố đô Huế', 'hanh-trinh-co-do-hue', 'Huế', 'Lịch sử'],
            ['Biển xanh Quy Nhơn', 'bien-xanh-quy-nhon', 'Quy Nhơn', 'Biển'],
            ['Khám phá miền Tây', 'kham-pha-mien-tay', 'Cần Thơ', 'Trải nghiệm'],
            ['Côn Đảo cao cấp', 'con-dao-cao-cap', 'Côn Đảo', 'Cao cấp'],
        ];

        $tours = collect();

        foreach ($destinations as $tourIndex => [$title, $slug, $destination, $category]) {
            $baseDate = Carbon::now()->addDays(($tourIndex + 1) * 7);

            $tours->push(Tour::create([
                'title' => $title,
                'slug' => $slug,
                'description' => 'Lịch trình được thiết kế trọn gói với khách sạn, bữa ăn, xe đưa đón và trải nghiệm địa phương nổi bật.',
                'destination' => $destination,
                'category' => $category,
                'duration_days' => rand(3, 7),
                'max_pax' => rand(12, 32),
                'price_per_person' => rand(3500, 15000) * 1000,
                'promotion_type' => $tourIndex % 3 === 0 ? 'percent' : ($tourIndex % 4 === 0 ? 'fixed' : 'none'),
                'promotion_value' => $tourIndex % 3 === 0 ? 10 : ($tourIndex % 4 === 0 ? 500000 : 0),
                'images' => [
                    'https://picsum.photos/seed/'.Str::slug($slug).'/1200/800',
                    'https://picsum.photos/seed/'.Str::slug($slug).'-2/1200/800',
                ],
                'highlights' => [
                    'Hướng dẫn viên địa phương chuyên nghiệp',
                    'Khách sạn được tuyển chọn kỹ',
                    'Đã bao gồm phương tiện di chuyển khứ hồi',
                    'Có thời gian tự do mỗi buổi tối',
                ],
                'itinerary' => [
                    [
                        'day' => 1,
                        'title' => 'Đón khách và nhận phòng',
                        'description' => 'Đón tại điểm hẹn, nhận phòng khách sạn và dùng bữa chào mừng.',
                    ],
                    [
                        'day' => 2,
                        'title' => 'Tham quan điểm nổi bật',
                        'description' => 'Khám phá các địa danh chính và thưởng thức ẩm thực địa phương.',
                    ],
                    [
                        'day' => 3,
                        'title' => 'Trải nghiệm văn hóa bản địa',
                        'description' => 'Tham gia hoạt động đặc trưng của địa phương và nghỉ ngơi tự do.',
                    ],
                ],
                'status' => match (true) {
                    $tourIndex === 0 => 'pending',
                    $tourIndex === 8 => 'draft',
                    $tourIndex === 10 => 'rejected',
                    default => 'approved',
                },
                'reject_reason' => $tourIndex === 10 ? 'Cần bổ sung lịch trình chi tiết hơn trước khi duyệt.' : null,
                'approved_at' => ! in_array($tourIndex, [0, 8, 10], true) ? Carbon::now()->subDays(rand(2, 20)) : null,
                'created_by' => $creator->_id,
                'linked_partner_ids' => $partnerCandidate ? [(string) $partnerCandidate->_id] : [],
                'assigned_guide_id' => $guideCandidate?->_id,
                'departures' => [
                    [
                        'date' => $baseDate->toDateString(),
                        'available_slots' => rand(8, 24),
                        'price_override' => null,
                        'status' => 'active',
                        'assigned_guide_id' => $guideCandidate?->_id,
                    ],
                    [
                        'date' => $baseDate->copy()->addDays(14)->toDateString(),
                        'available_slots' => rand(8, 24),
                        'price_override' => rand(0, 1) ? rand(3200, 16000) * 1000 : null,
                        'status' => $tourIndex % 5 === 0 ? 'paused' : 'active',
                        'assigned_guide_id' => $guideCandidate?->_id,
                    ],
                    [
                        'date' => $baseDate->copy()->addDays(28)->toDateString(),
                        'available_slots' => rand(8, 24),
                        'price_override' => rand(0, 1) ? rand(3200, 16000) * 1000 : null,
                        'status' => 'active',
                        'assigned_guide_id' => null,
                    ],
                ],
            ]));
        }

        $testDepartureDate = Carbon::now()->addDays(3)->toDateString();
        $tours->push(Tour::create([
            'title' => 'Tour test thanh toán 2.000đ',
            'slug' => 'tour-test-thanh-toan-1000-vnd',
            'description' => 'Dữ liệu mẫu chuyên dùng để kiểm tra luồng đặt tour và thanh toán với giá trị nhỏ.',
            'destination' => 'Môi trường kiểm thử',
            'category' => 'Test',
            'pinned' => true,
            'duration_days' => 1,
            'max_pax' => 10,
            'price_per_person' => 2000,
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
                    'date' => $testDepartureDate,
                    'available_slots' => 10,
                    'price_override' => 2000,
                    'status' => 'active',
                    'assigned_guide_id' => null,
                ],
            ],
        ]));

        foreach ($customers as $index => $customer) {
            $tour = $tours[$index % $tours->count()];
            $departure = collect($tour->departures)->first();
            $numPax = rand(1, 3);

            $booking = Booking::create([
                'tour_id' => $tour->_id,
                'user_id' => $customer->_id,
                'assigned_agent_id' => $agent?->_id,
                'departure_date' => Carbon::parse($departure['date']),
                'num_pax' => $numPax,
                'total_price' => $numPax * $tour->price_per_person,
                'status' => $index % 2 === 0 ? 'confirmed' : 'completed',
                'passengers' => [
                    [
                        'name' => $customer->name,
                        'dob' => '1995-01-01',
                        'passport' => 'P'.str_pad((string) ($index + 1), 8, '0', STR_PAD_LEFT),
                    ],
                ],
                'note' => 'Dữ liệu mẫu đặt tour',
                'internal_note' => $index % 2 === 0 ? 'Khách ưu tiên chỗ ngồi gần cửa sổ.' : 'Khách quan tâm lịch trình nhẹ nhàng cho gia đình.',
                'special_requirements' => $index % 2 === 0 ? ['Ăn chay', 'Xe đón sân bay'] : ['Phòng đôi', 'Hỗ trợ xe đẩy trẻ em'],
                'payment_status' => $index % 2 === 0 ? 'partial' : 'paid',
            ]);

            Payment::create([
                'booking_id' => $booking->_id,
                'user_id' => $customer->_id,
                'amount' => $booking->payment_status === 'paid' ? $booking->total_price : $booking->total_price / 2,
                'method' => $index % 2 === 0 ? 'bank' : 'momo',
                'status' => 'success',
                'transaction_id' => 'TXN-'.Str::upper(Str::random(10)),
                'paid_at' => Carbon::now()->subDays(rand(1, 15)),
            ]);

            if ($booking->status === 'completed') {
                Review::create([
                    'tour_id' => $tour->_id,
                    'user_id' => $customer->_id,
                    'booking_id' => $booking->_id,
                    'rating' => rand(4, 5),
                    'comment' => 'Lịch trình hợp lý, dịch vụ tốt và hỗ trợ rất nhanh trong suốt chuyến đi.',
                    'status' => 'approved',
                    'created_at' => Carbon::now()->subDays(rand(1, 10)),
                ]);
            }

            ActivityLog::create([
                'user_id' => $customer->_id,
                'action' => 'seeded_booking_created',
                'module' => 'bookings',
                'detail' => [
                    'booking_id' => (string) $booking->_id,
                    'tour_id' => (string) $tour->_id,
                ],
                'ip_address' => '127.0.0.1',
                'created_at' => Carbon::now()->subDays(rand(1, 20)),
            ]);

            FavoriteTour::firstOrCreate([
                'user_id' => $customer->_id,
                'tour_id' => $tour->_id,
            ]);

            if ($index === 0) {
                SupportTicket::create([
                    'user_id' => $customer->_id,
                    'booking_id' => $booking->_id,
                    'subject' => 'Cần hỗ trợ thông tin tập trung',
                    'message' => 'Nhờ xác nhận lại giờ tập trung và vật dụng cần chuẩn bị trước chuyến đi.',
                    'status' => 'answered',
                    'reply' => 'Vui lòng có mặt trước giờ khởi hành 30 phút và mang theo CCCD hoặc hộ chiếu bản gốc.',
                ]);
            }

            if ($index === 1) {
                RefundRequest::create([
                    'user_id' => $customer->_id,
                    'booking_id' => $booking->_id,
                    'reason' => 'Tôi cần dời kế hoạch cá nhân nên muốn được hỗ trợ hoàn tiền cho booking này.',
                    'amount_requested' => $booking->total_price,
                    'status' => 'pending',
                    'admin_note' => null,
                ]);
            }
        }

        $partnerUser = $users->firstWhere('role', 'partner');
        $guideUsers = $users->where('role', 'guide')->values();

        if ($partnerUser) {
            $partnerProfile = Partner::create([
                'user_id' => $partnerUser->_id,
                'company_name' => 'Dịch vụ Biển Xanh',
                'service_type' => 'hotel',
                'contact_info' => [
                    'contact_name' => 'Lê Minh Hải',
                    'email' => $partnerUser->email,
                    'phone' => $partnerUser->phone,
                    'address' => 'Đà Nẵng, Việt Nam',
                    'business_license' => 'GPLX-DV-2026-001',
                    'facility_images' => [
                        'https://picsum.photos/seed/partner-hotel-1/1200/800',
                        'https://picsum.photos/seed/partner-hotel-2/1200/800',
                    ],
                ],
                'status' => 'active',
                'created_at' => Carbon::now()->subDays(30),
            ]);

            PartnerService::create([
                'partner_id' => $partnerProfile->_id,
                'name' => 'Phòng Superior hướng biển',
                'service_category' => 'hotel',
                'price' => 1200000,
                'unit' => 'phòng/đêm',
                'available_quantity' => 15,
                'pricing_note' => 'Áp dụng cuối tuần tăng 10%',
                'status' => 'active',
                'cancellation_policy' => 'Hủy trước 5 ngày hoàn 100%, trước 2 ngày hoàn 50%',
            ]);

            PartnerService::create([
                'partner_id' => $partnerProfile->_id,
                'name' => 'Xe đưa đón 16 chỗ',
                'service_category' => 'transport',
                'price' => 2500000,
                'unit' => 'xe/ngày',
                'available_quantity' => 4,
                'pricing_note' => 'Đã bao gồm tài xế và nhiên liệu nội thành',
                'status' => 'active',
                'cancellation_policy' => 'Hủy trước 3 ngày hoàn 70%',
            ]);
        }

        $guideUsers->each(function ($guideUser, $index) {
            Guide::create([
                'user_id' => $guideUser->_id,
                'languages' => ['Tiếng Việt', 'English'],
                'license_number' => 'GUIDE-2026-00'.($index + 1),
                'specialties' => $index % 2 === 0 ? ['Văn hóa', 'Khám phá'] : ['Biển', 'Gia đình'],
                'status' => 'active',
            ]);
        });

        ActivityLog::create([
            'user_id' => $admin->_id,
            'action' => 'seed_completed',
            'module' => 'system',
            'detail' => [
                'users' => User::count(),
                'tours' => Tour::count(),
                'bookings' => Booking::count(),
            ],
            'ip_address' => '127.0.0.1',
            'created_at' => Carbon::now(),
        ]);
    }
}
