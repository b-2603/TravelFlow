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
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * SampleDataSeeder - Seeder để THÊM dữ liệu mẫu (KHÔNG xóa dữ liệu cũ)
 * 
 * Sử dụng seeder này khi muốn thêm dữ liệu mẫu mà KHÔNG làm mất dữ liệu hiện có.
 * Đây là seeder AN TOÀN để sử dụng trong quá trình phát triển và testing.
 * 
 * Cách chạy: php artisan db:seed --class=SampleDataSeeder
 */
class SampleDataSeeder extends Seeder
{
    public function run(): void
    {
        // Chỉ thêm dữ liệu nếu chưa tồn tại - KHÔNG truncate
        $this->seedUsers();
        $this->seedTours();
        $this->seedBookings();
        $this->seedPartnersAndGuides();
    }

    private function seedUsers(): void
    {
        // Kiểm tra nếu đã có user thì không thêm nữa
        if (User::count() > 0) {
            $this->command->info('Người dùng đã tồn tại. Bỏ qua việc thêm user mẫu.');
            return;
        }

        $admin = User::firstOrCreate(
            ['email' => 'quantri@gmail.com'],
            [
                'name' => 'Quản trị hệ thống',
                'username' => 'quan_tri',
                'password' => Hash::make('Password@123'),
                'phone' => '0900000000',
                'avatar' => 'https://ui-avatars.com/api/?name=Admin&background=0a5c86&color=fff&size=300',
                'role' => 'admin',
                'role_name_vi' => User::roleNameMap()['admin'],
                'status' => 'active',
                'address' => 'TP. Hồ Chí Minh',
            ]
        );

        $seedUsers = [
            ['role' => 'tour_manager', 'name' => 'Quản lý tour 01', 'username' => 'quan_ly_tour_01', 'email' => 'quanlytour01@gmail.com'],
            ['role' => 'agent', 'name' => 'Nhân viên tư vấn 01', 'username' => 'tu_van_01', 'email' => 'tuvan01@gmail.com'],
            ['role' => 'accountant', 'name' => 'Kế toán 01', 'username' => 'ke_toan_01', 'email' => 'ketoan01@gmail.com'],
            ['role' => 'guide', 'name' => 'Hướng dẫn viên 01', 'username' => 'huong_dan_01', 'email' => 'huongdan01@gmail.com'],
            ['role' => 'guide', 'name' => 'Hướng dẫn viên 02', 'username' => 'huong_dan_02', 'email' => 'huongdan02@gmail.com'],
            ['role' => 'guide', 'name' => 'Hướng dẫn viên 03', 'username' => 'huong_dan_03', 'email' => 'huongdan03@gmail.com'],
            ['role' => 'partner', 'name' => 'Đối tác dịch vụ 01', 'username' => 'doi_tac_01', 'email' => 'doitac01@gmail.com'],
            ['role' => 'customer', 'name' => 'Khách hàng 01', 'username' => 'khach_hang_01', 'email' => 'khachhang01@gmail.com'],
            ['role' => 'customer', 'name' => 'Khách hàng 02', 'username' => 'khach_hang_02', 'email' => 'khachhang02@gmail.com'],
            ['role' => 'customer', 'name' => 'Khách hàng 03', 'username' => 'khach_hang_03', 'email' => 'khachhang03@gmail.com'],
            ['role' => 'customer', 'name' => 'Khách hàng 04', 'username' => 'khach_hang_04', 'email' => 'khachhang04@gmail.com'],
        ];

        foreach ($seedUsers as $seedUser) {
            User::firstOrCreate(
                ['email' => $seedUser['email']],
                [
                    'name' => $seedUser['name'],
                    'username' => $seedUser['username'],
                    'password' => Hash::make('Password@123'),
                    'phone' => '0900000000',
                    'avatar' => 'https://ui-avatars.com/api/?name='.urlencode($seedUser['name']).'&background=random&color=fff&size=300',
                    'role' => $seedUser['role'],
                    'role_name_vi' => User::roleNameMap()[$seedUser['role']] ?? $seedUser['role'],
                    'status' => 'active',
                    'address' => 'Việt Nam',
                ]
            );
        }

        $this->command->info('Đã thêm người dùng mẫu.');
    }

    private function seedTours(): void
    {
        // Kiểm tra nếu đã có tour thì không thêm nữa
        if (Tour::count() > 0) {
            $this->command->info('Tour đã tồn tại. Bỏ qua việc thêm tour mẫu.');
            return;
        }

        $users = User::all();
        $creator = $users->firstWhere('role', 'tour_manager') ?? $users->firstWhere('role', 'admin');
        $partnerCandidate = $users->firstWhere('role', 'partner');
        $guideCandidate = $users->firstWhere('role', 'guide');

        if (!$creator) {
            $this->command->error('Không tìm thấy user để tạo tour. Vui lòng chạy seeder user trước.');
            return;
        }

        $tourBlueprints = [
            [
                'title' => 'Khám phá Đà Nẵng',
                'slug' => 'kham-pha-da-nang',
                'destination' => 'Đà Nẵng',
                'category' => 'Biển',
                'duration_days' => 4,
                'max_pax' => 24,
                'price_per_person' => 6200000,
                'images' => [
                    'https://images.unsplash.com/photo-1559592481-74153c49ca83?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Hành trình cân bằng giữa nghỉ dưỡng biển, khám phá Bà Nà Hills, cầu Rồng, bán đảo Sơn Trà và thưởng thức hải sản địa phương.',
                'destination_overview' => 'Đà Nẵng là thành phố biển năng động với bãi biển Mỹ Khê, công viên giải trí Bà Nà Hills.',
                'historical_background' => 'Là cảng biển quan trọng miền Trung, Đà Nẵng từng là đầu mối giao thương.',
                'local_culture' => [
                    'Ẩm thực miền Trung nổi bật với mì Quảng, bánh xèo và hải sản tươi sống.',
                    'Người dân thân thiện, thích giao tiếp và chào đón du khách.',
                ],
                'best_time_to_visit' => 'Mùa xuân và mùa thu là thời điểm lý tưởng, ít mưa và biển lặng.',
                'weather_notes' => 'Nên mang áo khoác nhẹ vào buổi tối và kem chống nắng khi đi biển.',
                'highlights' => [
                    'Nghỉ đêm tại khách sạn 4 sao trung tâm biển Mỹ Khê',
                    'Tham quan Bà Nà Hills, Cầu Vàng và phố cổ Hội An',
                ],
                'included_services' => [
                    'Xe du lịch đời mới phục vụ theo chương trình',
                    'Khách sạn 4 sao, 2 khách/phòng hoặc tương đương',
                    '07 bữa ăn theo chương trình',
                    'Vé tham quan theo lịch trình',
                ],
                'excluded_services' => [
                    'Vé máy bay khứ hồi đến Đà Nẵng',
                    'Chi phí cá nhân, giặt ủi, thức uống ngoài chương trình',
                ],
                'suitable_for' => ['Gia đình', 'Nhóm bạn', 'Cặp đôi'],
                'travel_tips' => [
                    'Nên mang kính râm, kem chống nắng và đồ bơi',
                    'Chuẩn bị giày thể thao nhẹ để đi Bà Nà và Hội An',
                ],
                'meeting_point' => 'Sân bay Đà Nẵng hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đón sân bay và tắm biển Mỹ Khê', 'description' => 'Đón đoàn, nhận phòng tại khách sạn gần biển, thư giãn và dùng bữa tối hải sản.'],
                    ['day' => 2, 'title' => 'Bà Nà Hills & Cầu Vàng', 'description' => 'Khởi hành lên Bà Nà Hills, trải nghiệm cáp treo, tham quan Cầu Vàng.'],
                    ['day' => 3, 'title' => 'Hội An và phố cổ', 'description' => 'Tham quan phố cổ Hội An, chùa Cầu, dạo phố đèn lồng.'],
                    ['day' => 4, 'title' => 'Chợ Hàn và tiễn khách', 'description' => 'Mua sắm đặc sản tại chợ Hàn, nghỉ ngơi và đưa đoàn ra sân bay.'],
                ],
            ],
            [
                'title' => 'Di sản Hà Nội',
                'slug' => 'di-san-ha-noi',
                'destination' => 'Hà Nội',
                'category' => 'Văn hóa',
                'duration_days' => 3,
                'max_pax' => 22,
                'price_per_person' => 4900000,
                'images' => [
                    'https://images.unsplash.com/photo-1509030450996-93f2e20b005c?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1555940280-66bf87aa823d?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Tour dành cho khách yêu văn hóa, ẩm thực và nhịp sống thủ đô.',
                'destination_overview' => 'Hà Nội là trái tim của văn hóa Việt Nam.',
                'historical_background' => 'Thủ đô ngàn năm văn hiến.',
                'local_culture' => [
                    'Kinh nghiệm ăn vặt phố cổ với phở, bún chả và cà phê trứng.',
                    'Người Hà Nội thân thiện, dễ gần.',
                ],
                'best_time_to_visit' => 'Mùa thu và đầu đông với thời tiết mát mẻ.',
                'weather_notes' => 'Mang áo khoác mỏng buổi sáng và tối.',
                'highlights' => [
                    'Phố cổ Hà Nội và hồ Hoàn Kiếm',
                    'Thưởng thức ẩm thực Bắc bộ đặc trưng',
                ],
                'included_services' => [
                    'Xe du lịch và hướng dẫn viên',
                    'Khách sạn 4 sao khu vực trung tâm',
                    '05 bữa ăn chất lượng',
                ],
                'excluded_services' => [
                    'Vé máy bay đến Hà Nội',
                    'Chi phí cá nhân',
                ],
                'suitable_for' => ['Gia đình', 'Khách trung niên'],
                'travel_tips' => [
                    'Mang áo khoác mỏng nếu đi mùa đông',
                    'Chuẩn bị tiền mặt nhỏ để mua đặc sản phố cổ',
                ],
                'meeting_point' => 'Sân bay Nội Bài hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Phố cổ & Hồ Hoàn Kiếm', 'description' => 'Nhận phòng, dạo quanh Hồ Gươm, thăm đền Ngọc Sơn.'],
                    ['day' => 2, 'title' => 'Văn Miếu và làng gốm Bát Tràng', 'description' => 'Tham quan Văn Miếu, khám phá làng gốm Bát Tràng.'],
                    ['day' => 3, 'title' => 'Hoàng thành Thăng Long và tiễn khách', 'description' => 'Khám phá Hoàng thành, dạo Nhà hát Lớn và mua quà.'],
                ],
            ],
        ];

        foreach ($tourBlueprints as $tourIndex => $blueprint) {
            $baseDate = Carbon::now()->addDays(($tourIndex + 1) * 7);

            Tour::create([
                'title' => $blueprint['title'],
                'slug' => $blueprint['slug'],
                'description' => $blueprint['description'],
                'destination' => $blueprint['destination'],
                'category' => $blueprint['category'],
                'duration_days' => $blueprint['duration_days'],
                'max_pax' => $blueprint['max_pax'],
                'price_per_person' => $blueprint['price_per_person'],
                'promotion_type' => $tourIndex % 3 === 0 ? 'percent' : 'none',
                'promotion_value' => $tourIndex % 3 === 0 ? 10 : 0,
                'images' => $blueprint['images'],
                'highlights' => $blueprint['highlights'],
                'destination_overview' => $blueprint['destination_overview'],
                'historical_background' => $blueprint['historical_background'],
                'local_culture' => $blueprint['local_culture'],
                'best_time_to_visit' => $blueprint['best_time_to_visit'],
                'weather_notes' => $blueprint['weather_notes'],
                'included_services' => $blueprint['included_services'],
                'excluded_services' => $blueprint['excluded_services'],
                'suitable_for' => $blueprint['suitable_for'],
                'travel_tips' => $blueprint['travel_tips'],
                'meeting_point' => $blueprint['meeting_point'],
                'itinerary' => $blueprint['itinerary'],
                'status' => 'approved',
                'approved_at' => Carbon::now()->subDays(rand(2, 10)),
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
                ],
            ]);
        }

        $this->command->info('Đã thêm tour mẫu.');
    }

    private function seedBookings(): void
    {
        $customers = User::where('role', 'customer')->get();
        $tours = Tour::all();
        $agent = User::firstWhere('role', 'agent');

        if ($customers->isEmpty() || $tours->isEmpty()) {
            $this->command->info('Không đủ dữ liệu để tạo booking mẫu.');
            return;
        }

        // Chỉ tạo booking nếu chưa có
        if (Booking::count() > 0) {
            $this->command->info('Booking đã tồn tại. Bỏ qua việc thêm booking mẫu.');
            return;
        }

        foreach ($customers->take(2) as $index => $customer) {
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
                'status' => 'confirmed',
                'passengers' => [
                    [
                        'name' => $customer->name,
                        'dob' => '1995-01-01',
                        'passport' => 'P'.str_pad((string) ($index + 1), 8, '0', STR_PAD_LEFT),
                    ],
                ],
                'note' => 'Dữ liệu mẫu đặt tour',
                'payment_status' => 'paid',
            ]);

            Payment::create([
                'booking_id' => $booking->_id,
                'user_id' => $customer->_id,
                'amount' => $booking->total_price,
                'method' => 'bank',
                'status' => 'success',
                'transaction_id' => 'TXN-'.Str::upper(Str::random(10)),
                'paid_at' => Carbon::now()->subDays(rand(1, 5)),
            ]);
        }

        $this->command->info('Đã thêm booking mẫu.');
    }

    private function seedPartnersAndGuides(): void
    {
        $partnerUser = User::firstWhere('role', 'partner');
        $guideUsers = User::where('role', 'guide')->get();

        if ($partnerUser && Partner::count() === 0) {
            Partner::create([
                'user_id' => $partnerUser->_id,
                'company_name' => 'Dịch vụ Biển Xanh',
                'service_type' => 'hotel',
                'contact_info' => [
                    'contact_name' => 'Lê Minh Hải',
                    'email' => $partnerUser->email,
                    'phone' => $partnerUser->phone,
                    'address' => 'Đà Nẵng, Việt Nam',
                    'business_license' => 'GPLX-DV-2026-001',
                ],
                'status' => 'active',
                'created_at' => Carbon::now()->subDays(30),
            ]);

            PartnerService::create([
                'partner_id' => Partner::first()->_id,
                'name' => 'Phòng Superior hướng biển',
                'service_category' => 'hotel',
                'price' => 1200000,
                'unit' => 'phòng/đêm',
                'available_quantity' => 15,
            ]);

            $this->command->info('Đã thêm partner mẫu.');
        }

        if ($guideUsers->isNotEmpty() && Guide::count() === 0) {
            foreach ($guideUsers as $guideUser) {
                Guide::create([
                    'user_id' => $guideUser->_id,
                    'license_number' => 'GUIDE-'.strtoupper(Str::random(8)),
                    'experience_years' => rand(2, 10),
                    'specialization' => 'tour_du_lich',
                    'languages' => ['tiếng Việt', 'tiếng Anh'],
                    'bio' => 'Hướng dẫn viên chuyên nghiệp.',
                    'status' => 'active',
                    'created_at' => Carbon::now()->subDays(rand(10, 60)),
                ]);
            }

            $this->command->info('Đã thêm guide mẫu.');
        }
    }
}