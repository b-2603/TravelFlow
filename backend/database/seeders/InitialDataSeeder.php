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
 * InitialDataSeeder - Seeder để đồng bộ dữ liệu mẫu theo cách an toàn
 *
 * Seeder này không xóa dữ liệu hiện có. Nó chỉ thêm các bản ghi mẫu còn thiếu
 * và cập nhật các bản ghi mẫu theo slug/email cố định.
 *
 * Cách chạy: php artisan db:seed --class=InitialDataSeeder
 */
class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate([
            'email' => 'quantri@gmail.com',
        ], [
            'name' => 'Quản trị hệ thống',
            'username' => 'quan_tri',
            'password' => Hash::make('Password@123'),
            'phone' => '0900000000',
            'avatar' => 'https://ui-avatars.com/api/?name=Admin&background=0a5c86&color=fff&size=300',
            'role' => 'admin',
            'role_name_vi' => User::roleNameMap()['admin'],
            'status' => 'active',
            'address' => 'TP. Hồ Chí Minh',
        ]);

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

        $users = collect([$admin]);

        foreach ($seedUsers as $index => $seedUser) {
            $users->push(User::firstOrCreate([
                'email' => $seedUser['email'],
            ], [
                'name' => $seedUser['name'],
                'username' => $seedUser['username'],
                'password' => Hash::make('Password@123'),
                'phone' => '09000000'.str_pad((string) ($index + 1), 2, '0', STR_PAD_LEFT),
                'avatar' => 'https://ui-avatars.com/api/?name='.urlencode($seedUser['name']).'&background=random&color=fff&size=300',
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
                    'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1559595500-e15296bdbcf1?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Hành trình cân bằng giữa nghỉ dưỡng biển, khám phá Bà Nà Hills, cầu Rồng, bán đảo Sơn Trà và thưởng thức hải sản địa phương với dịch vụ trọn gói.',
                'destination_overview' => 'Đà Nẵng là thành phố biển năng động với bãi biển Mỹ Khê, công viên giải trí Bà Nà Hills và những điểm tham quan vừa hiện đại vừa gần gũi.',
                'historical_background' => 'Là cảng biển quan trọng miền Trung, Đà Nẵng từng là đầu mối giao thương và đang nổi lên như điểm đến nghỉ dưỡng biển và khám phá văn hóa.',
                'local_culture' => [
                    'Ẩm thực miền Trung nổi bật với mì Quảng, bánh xèo và hải sản tươi sống.',
                    'Người dân thân thiện, thích giao tiếp và chào đón du khách.',
                    'Sự kết hợp giữa cảnh quan biển và kiến trúc hiện đại tạo nên nét riêng của thành phố.',
                ],
                'best_time_to_visit' => 'Mùa xuân và mùa thu là thời điểm lý tưởng, ít mưa và biển lặng.',
                'weather_notes' => 'Nên mang áo khoác nhẹ vào buổi tối và kem chống nắng khi đi biển.',
                'highlights' => [
                    'Nghỉ đêm tại khách sạn 4 sao trung tâm biển Mỹ Khê',
                    'Tham quan Bà Nà Hills, Cầu Vàng và phố cổ Hội An trong cùng hành trình',
                    'Ăn tối hải sản tươi sống tại nhà hàng địa phương được kiểm chứng',
                    'Xe đưa đón riêng và hướng dẫn viên đồng hành suốt tuyến',
                ],
                'included_services' => [
                    'Xe du lịch đời mới phục vụ theo chương trình',
                    'Khách sạn 4 sao, 2 khách/phòng hoặc tương đương',
                    '07 bữa ăn theo chương trình',
                    'Vé tham quan theo lịch trình',
                    'Hướng dẫn viên tiếng Việt chuyên nghiệp',
                    'Bảo hiểm du lịch nội địa',
                ],
                'excluded_services' => [
                    'Vé máy bay khứ hồi đến Đà Nẵng',
                    'Chi phí cá nhân, giặt ủi, thức uống ngoài chương trình',
                    'VAT và phụ thu phòng đơn',
                ],
                'suitable_for' => ['Gia đình', 'Nhóm bạn', 'Cặp đôi', 'Khách thích biển'],
                'travel_tips' => [
                    'Nên mang kính râm, kem chống nắng và đồ bơi',
                    'Chuẩn bị giày thể thao nhẹ để đi Bà Nà và Hội An',
                    'Nên đến sớm 30 phút tại điểm tập trung',
                ],
                'meeting_point' => 'Sân bay Đà Nẵng hoặc khách sạn trung tâm theo lịch',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đón sân bay và tắm biển Mỹ Khê', 'description' => 'Đón đoàn, nhận phòng tại khách sạn gần biển, thư giãn và dùng bữa tối hải sản.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Bà Nà Hills & Cầu Vàng', 'description' => 'Khởi hành lên Bà Nà Hills, trải nghiệm cáp treo, tham quan Cầu Vàng và khu làng Pháp.', 'image' => 'https://images.unsplash.com/photo-1559592481-74153c49ca83?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Hội An và phố cổ', 'description' => 'Tham quan phố cổ Hội An, chùa Cầu, dạo phố đèn lồng và dùng đặc sản miền Trung.', 'image' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Chợ Hàn và tiễn khách', 'description' => 'Mua sắm đặc sản tại chợ Hàn, nghỉ ngơi và đưa đoàn ra sân bay/điểm hẹn.', 'image' => 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
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
                    'https://images.unsplash.com/photo-1464817739973-0128fe77aaa1?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1589779137213-95ece3820a2d?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Tour dành cho khách yêu văn hóa, ẩm thực và nhịp sống thủ đô với những điểm đến mang tính biểu tượng, kết hợp trải nghiệm phố cổ và hồ nước xanh mát.',
                'destination_overview' => 'Hà Nội là trái tim của văn hóa Việt Nam, nơi hòa quyện giá trị lịch sử lâu đời với ẩm thực đường phố sôi động và không khí thủ đô thanh lịch.',
                'historical_background' => 'Thủ đô ngàn năm văn hiến, Hà Nội có nhiều di tích như Văn Miếu, Hoàng thành Thăng Long và Hồ Gươm gắn liền với lịch sử dân tộc.',
                'local_culture' => [
                    'Kinh nghiệm ăn vặt phố cổ với phở, bún chả và cà phê trứng.',
                    'Người Hà Nội thân thiện, dễ gần và thích chia sẻ câu chuyện lịch sử.',
                    'Các hoạt động buổi tối như ca trù, hoàn kiếm và phố đi bộ rất đặc trưng.',
                ],
                'best_time_to_visit' => 'Mùa thu và đầu đông với thời tiết mát mẻ, phù hợp tham quan trong thành phố.',
                'weather_notes' => 'Mang áo khoác mỏng buổi sáng và tối, vì Hà Nội có thể se lạnh dù ngày nắng.',
                'highlights' => [
                    'Phố cổ Hà Nội và hồ Hoàn Kiếm',
                    'Thưởng thức ẩm thực Bắc bộ đặc trưng',
                    'Lưu trú gần trung tâm thuận tiện di chuyển',
                    'Lịch trình nhẹ nhàng, phù hợp gia đình lớn tuổi',
                ],
                'included_services' => [
                    'Xe du lịch và hướng dẫn viên',
                    'Khách sạn 4 sao khu vực trung tâm',
                    '05 bữa ăn chất lượng',
                    'Vé vào cổng các điểm tham quan',
                    'Nước suối mỗi ngày',
                ],
                'excluded_services' => [
                    'Vé máy bay đến Hà Nội',
                    'Chi phí cá nhân',
                    'Phụ thu phòng đơn',
                ],
                'suitable_for' => ['Gia đình', 'Khách trung niên', 'Nhóm công ty'],
                'travel_tips' => [
                    'Mang áo khoác mỏng nếu đi mùa đông',
                    'Chuẩn bị tiền mặt nhỏ để mua đặc sản phố cổ',
                    'Nên đặt trước bàn ăn nếu muốn thưởng thức món nổi tiếng',
                ],
                'meeting_point' => 'Sân bay Nội Bài hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Phố cổ & Hồ Hoàn Kiếm', 'description' => 'Nhận phòng, dạo quanh Hồ Gươm, thăm đền Ngọc Sơn và thưởng thức phở/bún chả phố cổ.', 'image' => 'https://images.unsplash.com/photo-1509030450996-93f2e20b005c?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Văn Miếu và làng gốm Bát Tràng', 'description' => 'Tham quan Văn Miếu - Quốc Tử Giám, khám phá làng gốm Bát Tràng và cảm nhận nghệ thuật truyền thống.', 'image' => 'https://images.unsplash.com/photo-1555940280-66bf87aa823d?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Hoàng thành Thăng Long và tiễn khách', 'description' => 'Khám phá Hoàng thành, dạo Nhà hát Lớn và mua quà rồi tiễn khách ra sân bay.', 'image' => 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Nghỉ dưỡng Phú Quốc',
                'slug' => 'nghi-duong-phu-quoc',
                'destination' => 'Phú Quốc',
                'category' => 'Resort',
                'duration_days' => 4,
                'max_pax' => 18,
                'price_per_person' => 8900000,
                'images' => [
                    'https://images.unsplash.com/photo-1589779137213-95ece3820a2d?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Kỳ nghỉ đảo với resort ven biển, cáp treo Hòn Thơm, chợ đêm Dương Đông, lặn ngắm san hô và lịch trình thư giãn cho khách thích nghỉ dưỡng cao cấp.',
                'destination_overview' => 'Phú Quốc nổi tiếng với bờ biển dài, resort sang trọng và hệ sinh thái san hô đa dạng, phù hợp cho kỳ nghỉ cao cấp và trải nghiệm biển đảo.',
                'historical_background' => 'Phú Quốc ngày càng phát triển thành điểm nghỉ dưỡng hàng đầu trong nước, vẫn giữ lại nét làng chài truyền thống và hải sản tươi ngon.',
                'local_culture' => [
                    'Văn hóa đảo gắn với nghề đánh bắt, sản xuất nước mắm và nông trại tiêu.',
                    'Ẩm thực Phú Quốc nổi bật với hải sản, bún quậy và đặc sản kéo du khách.',
                    'Không khí đảo biển rất thư thái, phù hợp cho du khách cần nghỉ dưỡng.',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 11 đến tháng 4 cho biển lặng và nắng đẹp.',
                'weather_notes' => 'Chuẩn bị kem chống nắng, nón và thuốc say sóng cho các chuyến đi biển.',
                'highlights' => [
                    'Resort 5 sao sát biển',
                    'Tắm biển riêng và hoàng hôn tại Sunset Town',
                    'Thưởng thức hải sản địa phương theo set menu',
                    'Phù hợp khách muốn nghỉ ngơi thay vì di chuyển nhiều',
                ],
                'included_services' => [
                    'Resort 5 sao, bữa sáng buffet',
                    'Xe đưa đón theo chương trình',
                    'Vé cáp treo / vé tham quan theo lịch trình',
                    'HDV kinh nghiệm tuyến đảo',
                    'Bảo hiểm du lịch',
                ],
                'excluded_services' => [
                    'Vé máy bay khứ hồi',
                    'Phụ thu ngoài khung giờ',
                    'Chi phí lặn biển tự chọn',
                ],
                'suitable_for' => ['Cặp đôi', 'Gia đình', 'Khách cao cấp'],
                'travel_tips' => [
                    'Mang đồ bơi, dép kẹp và thuốc say sóng nếu đi tàu',
                    'Đặt dịch vụ chụp ảnh hoàng hôn nếu muốn lưu kỷ niệm',
                ],
                'meeting_point' => 'Sân bay Phú Quốc hoặc khách sạn resort',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đón khách và nhận phòng resort', 'description' => 'Đón tại sân bay, đưa về resort ven biển, nhận phòng và tận hưởng hồ bơi riêng.'],
                    ['day' => 2, 'title' => 'Cáp treo Hòn Thơm và Bãi Sao', 'description' => 'Trải nghiệm cáp treo vượt biển, khám phá Hòn Thơm và thư giãn tại Bãi Sao.'],
                    ['day' => 3, 'title' => 'Tham quan Dương Đông và chợ đêm', 'description' => 'Thăm nhà thùng nước mắm, dạo chợ đêm Dương Đông và nếm hải sản tươi.'],
                    ['day' => 4, 'title' => 'Tự do nghỉ dưỡng và tiễn khách', 'description' => 'Thư giãn tại resort, mua quà đặc sản và trả phòng ra sân bay.'],
                ],
            ],
            [
                'title' => 'Phiêu lưu Sa Pa',
                'slug' => 'phieu-luu-sa-pa',
                'destination' => 'Sa Pa',
                'category' => 'Núi',
                'duration_days' => 4,
                'max_pax' => 20,
                'price_per_person' => 5400000,
                'images' => [
                    'https://images.unsplash.com/photo-1518331191060-61f2f89f7639?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1599708153386-62bf3f03334f?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1580914614603-9c8a9f65492d?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Hành trình chinh phục núi rừng Tây Bắc với Fansipan, bản Cát Cát, ruộng bậc thang và đêm sương đặc trưng của Sa Pa.',
                'destination_overview' => 'Sa Pa là thị trấn mù sương nổi tiếng với ruộng bậc thang, bản làng dân tộc và khí hậu miền núi mát lạnh.',
                'historical_background' => 'Nơi đây từng là khu nghỉ dưỡng thời Pháp, nay kết hợp du lịch khám phá văn hóa Tây Bắc và cảnh quan thiên nhiên độc đáo.',
                'local_culture' => [
                    'Văn hóa dân tộc H\'Mông, Dao và người Tày được thể hiện qua trang phục và chợ phiên.',
                    'Ẩm thực cao nguyên với thịt trâu gác bếp, cá suối và củ cải muối.',
                    'Không khí se lạnh, thích hợp cho du khách tìm kiếm trải nghiệm miền núi. ',
                ],
                'best_time_to_visit' => 'Mùa xuân và mùa thu khí hậu dễ chịu, trời trong và tầm nhìn đẹp.',
                'weather_notes' => 'Mang áo ấm, găng tay và giày trekking đế bám tốt cho buổi dạo bản.',
                'highlights' => [
                    'Tàu hỏa / xe giường nằm đêm tiện lợi',
                    'Trải nghiệm văn hóa dân tộc thiểu số',
                    'Trekking nhẹ qua bản làng',
                    'Khám phá chợ đêm và ẩm thực vùng cao',
                ],
                'included_services' => [
                    'Xe du lịch hoặc vé giường nằm',
                    'Khách sạn 4 sao trung tâm thị trấn',
                    '06 bữa ăn theo chương trình',
                    'Vé Fansipan và điểm tham quan',
                    'Hướng dẫn viên và bảo hiểm',
                ],
                'excluded_services' => [
                    'Chi phí thuê trang phục dân tộc',
                    'Đồ uống trong bữa ăn',
                    'Phụ thu phòng đơn',
                ],
                'suitable_for' => ['Giới trẻ', 'Gia đình', 'Người thích trekking'],
                'travel_tips' => [
                    'Mang áo ấm và giày có độ bám tốt',
                    'Nên chuẩn bị thuốc cảm lạnh / say xe',
                ],
                'meeting_point' => 'Ga Hà Nội / bến xe theo phương án khởi hành',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Di chuyển lên Sa Pa', 'description' => 'Khởi hành từ Hà Nội, đến Sa Pa nhận phòng và dạo chợ đêm thị trấn.', 'image' => 'https://images.unsplash.com/photo-1528181304800-259b08848526?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Fansipan & Bản làng', 'description' => 'Chinh phục Fansipan bằng cáp treo và tham quan bản Cát Cát.', 'image' => 'https://images.unsplash.com/photo-1518331191060-61f2f89f7639?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Trekking Mường Hoa', 'description' => 'Đi bộ qua Lao Chải, Tả Van, ngắm ruộng bậc thang và tìm hiểu đời sống người dân.', 'image' => 'https://images.unsplash.com/photo-1506459225024-1428097a7e18?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Mua đặc sản và trở về', 'description' => 'Mua quà địa phương rồi di chuyển về Hà Nội / điểm kết thúc.', 'image' => 'https://images.unsplash.com/photo-1599708153386-62bf3f03334f?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Nha Trang cho gia đình',
                'slug' => 'nha-trang-gia-dinh',
                'destination' => 'Nha Trang',
                'category' => 'Gia đình',
                'duration_days' => 4,
                'max_pax' => 26,
                'price_per_person' => 5750000,
                'images' => [
                    'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Tour được thiết kế riêng cho gia đình với lịch trình vừa phải, tắm biển, vui chơi VinWonders, tham quan đảo và trải nghiệm ẩm thực vùng biển.',
                'destination_overview' => 'Nha Trang nổi tiếng với bãi biển dài, vịnh xanh và nhiều hoạt động phù hợp cho gia đình có trẻ em.',
                'historical_background' => 'Là một đô thị biển lâu đời của Việt Nam, Nha Trang vẫn giữ nét thân thiện và phát triển du lịch hàng đầu miền Trung.',
                'local_culture' => [
                    'Ẩm thực địa phương nổi bật với bún chả cá, nem nướng và hải sản tươi.',
                    'Người dân Nha Trang hiếu khách, thành phố có nhiều khu vui chơi giải trí cho trẻ em.',
                    'Kết hợp biển và công viên giải trí tạo nên kỳ nghỉ đa dạng cho cả gia đình.',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 1 đến tháng 8, trời nắng và biển dịu nhẹ.',
                'weather_notes' => 'Mang mũ rộng vành, kem chống nắng và đồ bơi cho trẻ em.',
                'highlights' => [
                    'Lịch trình phù hợp trẻ em và người lớn tuổi',
                    'Có thời gian nghỉ ngơi giữa các điểm tham quan',
                    'Phòng khách sạn rộng rãi cho gia đình',
                    'Kết hợp tham quan và vui chơi giải trí',
                ],
                'included_services' => [
                    'Xe đưa đón và tàu/ca nô theo lịch trình',
                    'Khách sạn 4 sao, bữa sáng buffet',
                    'Vé khu vui chơi / vé tham quan theo chương trình',
                    'Hướng dẫn viên và bảo hiểm',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Chi phí trò chơi phát sinh ngoài chương trình',
                    'Phụ thu phòng đơn / nâng hạng',
                ],
                'suitable_for' => ['Gia đình có trẻ em', 'Nhóm nhiều thế hệ'],
                'travel_tips' => [
                    'Mang mũ, kem chống nắng và đồ bơi cho trẻ nhỏ',
                    'Nên chuẩn bị đồ ăn nhẹ cho trẻ trong ngày di chuyển dài',
                ],
                'meeting_point' => 'Sân bay Cam Ranh hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Tắm biển và nhận phòng', 'description' => 'Đón đoàn, nhận phòng khách sạn gần bãi biển và thư giãn trên bờ cát.', 'image' => 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'VinWonders và cáp treo', 'description' => 'Tham quan VinWonders Nha Trang, trải nghiệm công viên nước và cáp treo Hòn Tre.', 'image' => 'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Hòn Mun và lặn san hô', 'description' => 'Lên tàu ra Hòn Mun, lặn ngắm san hô và khám phá thế giới biển.', 'image' => 'https://images.unsplash.com/photo-1589118949245-7d38baf380d6?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Mua sắm đặc sản và tiễn khách', 'description' => 'Mua quà biển, trả phòng và đưa đoàn ra sân bay/điểm đón.', 'image' => 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Đêm phố cổ Hội An',
                'slug' => 'dem-pho-co-hoi-an',
                'destination' => 'Hội An',
                'category' => 'Văn hóa',
                'duration_days' => 3,
                'max_pax' => 18,
                'price_per_person' => 4100000,
                'images' => [
                    'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1559595500-e15296bdbcf1?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1623594042857-4f65582f3c7e?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1634560830932-9c17f96e257e?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Một hành trình êm đềm với phố cổ, đèn lồng, ẩm thực Quảng và thời gian tự do chụp hình, dạo bộ bên sông Hoài.',
                'destination_overview' => 'Hội An là thành phố di sản với những con phố cổ rực rỡ đèn lồng, quán cà phê bên sông và những cây cầu nhỏ nặng nề lịch sử.',
                'historical_background' => 'Thị trấn cổ này từng là một thương cảng sầm uất, nay giữ được vẻ nguyên bản và nghệ thuật kiến trúc Đông - Tây hài hoà.',
                'local_culture' => [
                    'Văn hóa Hội An thể hiện qua đèn lồng, áo dài truyền thống và làng nghề thủ công.',
                    'Ẩm thực Quảng Nam với cao lầu, mì Quảng và bánh xèo là điểm nhấn khó quên.',
                    'Không gian buổi tối trên sông Hoài là trải nghiệm rất đặc trưng của Hội An.',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 2 đến tháng 8 để tránh mưa lớn và tận hưởng trời trong xanh.',
                'weather_notes' => 'Mang giày đế thấp vì mặt đường cổ nhiều đá và đôi khi trơn ướt vào mùa mưa.',
                'highlights' => [
                    'Lưu trú ngay khu phố cổ',
                    'Đêm đèn lồng và thuyền sông Hoài',
                    'Ẩm thực truyền thống Quảng Nam',
                    'Chương trình nhẹ, phù hợp cặp đôi và nhóm nhỏ',
                ],
                'included_services' => [
                    'Khách sạn boutique 4 sao',
                    'Xe đưa đón và HDV',
                    'Vé tham quan phố cổ theo lịch trình',
                    '03 bữa ăn đặc sản',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Chi phí thuê áo dài / chụp ảnh',
                    'Đồ uống ngoài chương trình',
                ],
                'suitable_for' => ['Cặp đôi', 'Nhóm bạn', 'Người thích chụp ảnh'],
                'travel_tips' => [
                    'Nên đi giày đế thấp để dễ di chuyển trong phố cổ',
                    'Mang theo áo khoác mỏng nếu đi mùa mưa',
                ],
                'meeting_point' => 'Sân bay Đà Nẵng hoặc khách sạn trung tâm Hội An',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đà Nẵng - Hội An', 'description' => 'Đón đoàn, di chuyển đến Hội An, nhận phòng và dạo phố cổ buổi tối.', 'image' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Làng gốm Thanh Hà và biển An Bàng', 'description' => 'Tham quan làng gốm Thanh Hà, sau đó tắm biển An Bàng và dùng bữa tối đặc sản.', 'image' => 'https://images.unsplash.com/photo-1623594042857-4f65582f3c7e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Sông Hoài và tiễn khách', 'description' => 'Chụp ảnh đèn lồng, đi thuyền trên sông Hoài và quay về điểm đón.', 'image' => 'https://images.unsplash.com/photo-1559595500-e15296bdbcf1?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Du thuyền Vịnh Hạ Long',
                'slug' => 'du-thuyen-vinh-ha-long',
                'destination' => 'Hạ Long',
                'category' => 'Du thuyền',
                'duration_days' => 2,
                'max_pax' => 30,
                'price_per_person' => 7800000,
                'images' => [
                    'https://images.unsplash.com/photo-1506973035872-a4db5eb0d8c2?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Một đêm du thuyền sang trọng trên vịnh di sản Hạ Long, kết hợp kayak, khám phá hang động, bữa tối fine dining và trải nghiệm bình minh trên boong tàu.',
                'destination_overview' => 'Vịnh Hạ Long là kỳ quan thiên nhiên với hàng nghìn đảo đá vôi, hang động và làng chài cổ. Tour này tập trung vào hành trình trên du thuyền cao cấp, nghỉ ngơi trong cabin hướng vịnh và khám phá các điểm nổi tiếng của vùng biển di sản.',
                'historical_background' => 'Hạ Long không chỉ là thắng cảnh tự nhiên mà còn là vùng đất gắn với truyền thống ngư dân ven biển và các triều đại phong kiến từng chọn đây là cửa biển quan trọng của Bắc Bộ.',
                'local_culture' => [
                    'Ngư dân Hạ Long sống gắn bó với biển, chèo thuyền và nghề đánh bắt truyền thống.',
                    'Văn hóa làng chài đậm dấu ấn ẩm thực hải sản tươi sống và giao tiếp thân thiện.',
                    'Các trải nghiệm trên vịnh thường kết hợp giữa tham quan và nghỉ dưỡng, phù hợp cả đoàn gia đình lẫn cặp đôi.',
                ],
                'best_time_to_visit' => 'Mùa thu và đầu đông là thời điểm lý tưởng, khi trời ít mưa, nắng nhẹ và biển trong hơn.',
                'weather_notes' => 'Mang áo khoác gió nhẹ cho buổi sáng trên boong tàu và chuẩn bị dép chống trơn khi di chuyển trên du thuyền.',
                'highlights' => [
                    'Cabin view hướng vịnh',
                    'Kayak và hang động',
                    'Tiệc tối trên du thuyền',
                    'Điểm đến di sản UNESCO',
                ],
                'included_services' => [
                    '1 đêm du thuyền tiêu chuẩn cao',
                    '03 bữa ăn trên tàu',
                    'Vé tham quan vịnh và hoạt động kayak',
                    'Hướng dẫn viên / quản lý tour',
                ],
                'excluded_services' => [
                    'Vé máy bay / xe đến Hạ Long',
                    'Đồ uống gọi thêm',
                    'Dịch vụ spa, massage',
                ],
                'suitable_for' => ['Cặp đôi', 'Khách cao cấp', 'Khách thích trải nghiệm biển'],
                'travel_tips' => [
                    'Mang hành lý gọn nhẹ vì cabin có diện tích giới hạn',
                    'Chuẩn bị áo khoác mỏng buổi tối trên vịnh',
                ],
                'meeting_point' => 'Cảng tàu khách quốc tế Hạ Long',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Lên du thuyền Orchid Cruise', 'description' => 'Tập trung tại Cảng tàu khách quốc tế Hạ Long, check-in cabin du thuyền 4 sao và thưởng thức bữa trưa trên boong.', 'image' => 'https://images.unsplash.com/photo-1506973035872-a4db5eb0d8c2?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Thăm hang Sửng Sốt', 'description' => 'Khám phá hang Sửng Sốt, đi kayak quanh những đảo đá vôi và chụp ảnh cảnh quan vịnh.', 'image' => 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Bình minh và làng chài Cửa Vạn', 'description' => 'Ngắm bình minh trên boong, dùng bữa sáng và thăm làng chài nổi Cửa Vạn để hiểu đời sống ngư dân.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Tiễn khách tại Hạ Long', 'description' => 'Ăn trưa trên tàu, trả phòng cabin và trở về cảng để tiễn đoàn.', 'image' => 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Nghỉ dưỡng Đà Lạt',
                'slug' => 'nghi-duong-da-lat',
                'destination' => 'Đà Lạt',
                'category' => 'Thiên nhiên',
                'duration_days' => 4,
                'max_pax' => 20,
                'price_per_person' => 5600000,
                'images' => [
                    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Khí hậu mát mẻ, villa nghỉ dưỡng và các điểm check-in nổi bật của Đà Lạt được sắp xếp hợp lý, nhẹ nhàng nhưng vẫn đủ trải nghiệm.',
                'destination_overview' => 'Đà Lạt là thành phố sương mù với cảnh quan đồi núi, hồ nước và vườn hoa nổi tiếng, rất phù hợp cho kỳ nghỉ thư giãn.',
                'historical_background' => 'Đà Lạt từ lâu đã là điểm nghỉ dưỡng của giới thượng lưu và vẫn giữ được nét kiến trúc Pháp cùng khí hậu riêng biệt.',
                'local_culture' => [
                    'Văn hóa cà phê và ẩm thực cao nguyên thể hiện qua các quán nhỏ, bánh mì xíu mại và lẩu măng.',
                    'Người Đà Lạt thân thiện, dịch vụ du lịch thường rất chu đáo.',
                    'Không khí mát lạnh và những con đường hoa là điểm nhấn đặc trưng.',
                ],
                'best_time_to_visit' => 'Mùa xuân và mùa đông khi trời mát, sương mờ tạo không gian lãng mạn.',
                'weather_notes' => 'Mang áo khoác ấm, khăn và giày đi bộ vì đường núi đôi khi ẩm ướt.',
                'highlights' => [
                    'Villa/khách sạn 4 sao yên tĩnh',
                    'Check-in đồi chè, nông trại hoa và hồ Tuyền Lâm',
                    'Lịch trình nhẹ nhàng cho kỳ nghỉ thư giãn',
                    'Ẩm thực đặc sản cao nguyên',
                ],
                'included_services' => [
                    'Khách sạn hoặc villa 4 sao',
                    'Xe đưa đón nội thành',
                    'Bữa sáng và các bữa ăn theo chương trình',
                    'Vé vào cổng các điểm tham quan',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Chi phí cà phê / đồ uống cá nhân',
                    'Phí chụp ảnh dịch vụ riêng',
                ],
                'suitable_for' => ['Gia đình', 'Cặp đôi', 'Khách thích nghỉ dưỡng'],
                'travel_tips' => [
                    'Mang áo khoác vì buổi tối se lạnh',
                    'Nên chuẩn bị pin dự phòng cho hoạt động chụp ảnh',
                ],
                'meeting_point' => 'Sân bay Liên Khương hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đà Lạt - nhận phòng', 'description' => 'Đón khách, nhận phòng villa và dạo chợ đêm Đà Lạt.', 'image' => 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Đồi chè và hồ Tuyền Lâm', 'description' => 'Tham quan đồi chè Cầu Đất, check-in hồ Tuyền Lâm và thưởng thức cà phê.', 'image' => 'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Nông trại hoa - thác Prenn', 'description' => 'Khám phá nông trại hoa, thác Prenn và các điểm chụp hình đẹp.', 'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Mua đặc sản - tiễn khách', 'description' => 'Mua dâu tây, mật ong rừng và trả khách ra sân bay.', 'image' => 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Hành trình cố đô Huế',
                'slug' => 'hanh-trinh-co-do-hue',
                'destination' => 'Huế',
                'category' => 'Lịch sử',
                'duration_days' => 3,
                'max_pax' => 18,
                'price_per_person' => 4300000,
                'images' => [
                    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1570308175441-d7e50d0c5b7a?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1589779137213-95ece3820a2d?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1555940280-66bf87aa823d?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Tour lịch sử với Đại Nội, lăng tẩm, sông Hương và trải nghiệm ẩm thực cung đình, phù hợp khách yêu chiều sâu văn hóa.',
                'destination_overview' => 'Huế是 cố đô với cung điện, lăng tẩm và sông Hương thơ mộng, mang đậm dấu ấn triều Nguyễn.',
                'historical_background' => 'Nơi đây là trung tâm chính trị và văn hóa của Việt Nam dưới triều đại Nguyễn, với nhiều di tích đã được phục hồi và bảo tồn.',
                'local_culture' => [
                    'Ẩm thực Huế nổi tiếng với bún bò, cơm hến và các món cung đình tinh tế.',
                    'Văn hóa cung đình thể hiện qua ca Huế, nghi thức và trang phục truyền thống.',
                    'Du lịch Huế thường kết hợp giữa khám phá di tích và trải nghiệm sông nước. ',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 2 đến tháng 8 là lý tưởng để tham quan ngoại cảnh.',
                'weather_notes' => 'Mang ô nhẹ vì Huế có thể mưa bất chợt, đặc biệt vào cuối chiều.',
                'highlights' => [
                    'Đại Nội và các lăng tẩm triều Nguyễn',
                    'Du thuyền sông Hương, nghe ca Huế',
                    'Ẩm thực cung đình và món Huế đặc sắc',
                    'Lịch trình chuyên sâu về văn hóa - lịch sử',
                ],
                'included_services' => [
                    'Khách sạn 4 sao',
                    'Xe đưa đón và HDV',
                    'Vé tham quan và thuyền sông Hương',
                    '04 bữa ăn theo chương trình',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Chi phí mua sắm, trà cung đình',
                    'Phụ thu phòng đơn',
                ],
                'suitable_for' => ['Khách yêu lịch sử', 'Gia đình', 'Nhóm công ty'],
                'travel_tips' => [
                    'Nên mang ô / áo mưa vì Huế thay đổi thời tiết nhanh',
                    'Đi giày thấp để tham quan nhiều điểm di tích',
                ],
                'meeting_point' => 'Sân bay Phú Bài hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đại Nội và chùa Thiên Mụ', 'description' => 'Tham quan Ngọ Môn, Điện Thái Hoà, sau đó đến chùa Thiên Mụ bên sông Hương.', 'image' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Lăng Minh Mạng và Khải Định', 'description' => 'Khám phá hai lăng tẩm nổi bật và tìm hiểu kiến trúc cung đình.', 'image' => 'https://images.unsplash.com/photo-1570308175441-d7e50d0c5b7a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Sông Hương và tiễn khách', 'description' => 'Du thuyền ca Huế, thăm cầu Tràng Tiền và mua quà trước khi tiễn.', 'image' => 'https://images.unsplash.com/photo-1589779137213-95ece3820a2d?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Biển xanh Quy Nhơn',
                'slug' => 'bien-xanh-quy-nhon',
                'destination' => 'Quy Nhơn',
                'category' => 'Biển',
                'duration_days' => 4,
                'max_pax' => 22,
                'price_per_person' => 5200000,
                'images' => [
                    'https://i.pinimg.com/1200x/4b/3f/b9/4b3fb9fc016382fe6efd1b9632e1d8b2.jpg',
                    'https://i.pinimg.com/1200x/99/19/f1/9919f1be671ddbf279b0cd5dcfff6b78.jpg',
                    'https://i.pinimg.com/736x/6f/09/b5/6f09b53271f181d1987dc70d77b48e51.jpg',
                    'https://i.pinimg.com/1200x/68/58/55/685855f93573c2a7f2e6734d747265c1.jpg',
                ],
                'description' => 'Hành trình biển xanh với Eo Gió, Kỳ Co, làng chài và các bãi biển yên bình, thích hợp cho nhóm bạn và gia đình thích nghỉ dưỡng nhẹ nhàng.',
                'destination_overview' => 'Quy Nhơn là điểm đến biển mang phong cách tươi mới, với bãi biển Kỳ Co, ghềnh đá Quy Hòa và những con đường ven biển trải rộng.',
                'historical_background' => 'Vùng đất này từng là kinh đô Champa và ngày nay giữ nhiều di tích lịch sử, cùng với văn hóa ngư dân bình dị.',
                'local_culture' => [
                    'Ẩm thực Quy Nhơn nổi bật với bánh xèo tôm, nem nướng và hải sản tươi sống.',
                    'Cuộc sống làng chài vẫn còn rất đặc trưng ở các bến thuyền nhỏ.',
                    'Nhịp sống du lịch pha trộn cùng nét hoang sơ biển đảo. ',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 3 đến tháng 8 cho biển xanh và nắng đẹp.',
                'weather_notes' => 'Mang kem chống nắng, nón và đồ bơi; chuẩn bị giày có độ bám nếu đi Eo Gió và Kỳ Co.',
                'highlights' => [
                    'Check-in Kỳ Co và Eo Gió',
                    'Làng chài và ẩm thực hải sản',
                    'Lịch trình cân bằng giữa tham quan và nghỉ ngơi',
                    'Phù hợp nhóm bạn trẻ, gia đình',
                ],
                'included_services' => [
                    'Khách sạn 4 sao',
                    'Xe đưa đón và cano / tàu',
                    'Các bữa ăn theo chương trình',
                    'Hướng dẫn viên và bảo hiểm',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Các chi phí cá nhân',
                    'Đồ uống ngoài chương trình',
                ],
                'suitable_for' => ['Nhóm bạn', 'Gia đình', 'Khách thích biển'],
                'travel_tips' => [
                    'Chuẩn bị kem chống nắng và đồ bơi',
                    'Nên mang kính râm và áo chống nắng',
                ],
                'meeting_point' => 'Sân bay Phù Cát hoặc khách sạn thành phố',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Quy Nhơn city tour', 'description' => 'Nhận phòng, tham quan trung tâm Quy Nhơn và dùng bữa tối hải sản.', 'image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Kỳ Co và Eo Gió', 'description' => 'Di chuyển ra đảo Kỳ Co, tắm biển và chụp ảnh tại Eo Gió.', 'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Làng chài Nhơn Hải và Ghềnh Ráng', 'description' => 'Khám phá làng chài, chụp ảnh tại Ghềnh Ráng và tham quan hòn Khô.', 'image' => 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Mua quà - tiễn khách', 'description' => 'Mua đặc sản, trả phòng và tiễn khách ra sân bay.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Khám phá miền Tây',
                'slug' => 'kham-pha-mien-tay',
                'destination' => 'Cần Thơ',
                'category' => 'Trải nghiệm',
                'duration_days' => 3,
                'max_pax' => 24,
                'price_per_person' => 3900000,
                'images' => [
                    'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=1600&q=80',
                    'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=1600&q=80',
                ],
                'description' => 'Tour khám phá đời sống sông nước với chợ nổi, vườn trái cây, làng nghề và bữa ăn dân dã chuẩn vị miền Tây.',
                'destination_overview' => 'Cần Thơ là thủ phủ miền Tây với sông nước mênh mang, chợ nổi Cái Răng và những vườn trái cây tươi sai trĩu. ',
                'historical_background' => 'Vùng này là trung tâm kinh tế sông nước Nam Bộ, nơi giao thương bằng ghe xuồng và văn hóa ẩm thực phát triển. ',
                'local_culture' => [
                    'Ẩm thực miền Tây đậm đà với các món bún nước lèo, gỏi cuốn và lẩu mắm.',
                    'Người dân thân thiện và quen sống trong không gian sông nước.',
                    'Trải nghiệm chợ nổi đồng thời là cách hiểu sâu về đời sống địa phương.',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 11 đến tháng 4 để tránh lũ và đường xá khô ráo.',
                'weather_notes' => 'Mang nón, kem chống nắng và dép nhẹ vì di chuyển nhiều trên tàu/đò.',
                'highlights' => [
                    'Chợ nổi buổi sáng sớm',
                    'Tự tay hái trái cây tại vườn',
                    'Ẩm thực miền Tây dân dã',
                    'Chương trình trải nghiệm nhẹ nhàng',
                ],
                'included_services' => [
                    'Xe du lịch và tàu/đò tham quan',
                    'Khách sạn 3-4 sao',
                    'Các bữa ăn theo chương trình',
                    'Hướng dẫn viên và vé vào cổng',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Chi phí mua trái cây / quà mang về',
                    'Các trò chơi tự chọn',
                ],
                'suitable_for' => ['Gia đình', 'Khách trung niên', 'Nhóm bạn'],
                'travel_tips' => [
                    'Nên mang nón và kem chống nắng',
                    'Chuẩn bị giày dép dễ đi trên tàu / vườn',
                ],
                'meeting_point' => 'Sân bay Cần Thơ hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Cần Thơ city tour', 'description' => 'Nhận phòng, tham quan bến Ninh Kiều, cầu đi bộ và dùng bữa tối.', 'image' => 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Chợ nổi Cái Răng và vườn trái cây', 'description' => 'Tham quan chợ nổi sáng sớm, dạo vườn trái cây và thưởng thức trái cây tươi tại địa phương.', 'image' => 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Miệt vườn trải nghiệm', 'description' => 'Đi xuồng qua rạch, tham gia làm bánh và thưởng thức đặc sản trước khi tiễn khách.', 'image' => 'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Côn Đảo cao cấp',
                'slug' => 'con-dao-cao-cap',
                'destination' => 'Côn Đảo',
                'category' => 'Cao cấp',
                'duration_days' => 4,
                'max_pax' => 14,
                'price_per_person' => 12800000,
                'images' => [
                    'https://i.pinimg.com/1200x/17/4c/9f/174c9f21bcaf824d0a8acf9162dbf89f.jpg',
                    'https://i.pinimg.com/1200x/58/61/b6/5861b6519c6c203d1208b005b56f4ae1.jpg',
                    'https://i.pinimg.com/736x/5c/a9/2f/5ca92f0a0e395b3cf2c1e46c4130803d.jpg',
                    'https://i.pinimg.com/1200x/87/f1/3f/87f13f99cd245732ca70863dcbfea50f.jpg',
                ],
                'description' => 'Dành cho khách muốn nghỉ dưỡng riêng tư ở Côn Đảo với resort cao cấp, tour lịch sử, tắm biển và dịch vụ chăm sóc trọn gói.',
                'destination_overview' => 'Côn Đảo là quần đảo hoang sơ với bãi biển trong xanh, di tích lịch sử và vẻ yên bình khác biệt so với các đảo khác.',
                'historical_background' => 'Nơi đây là dấu ấn của lịch sử Việt Nam với các trại giam thời chiến và hiện đã trở thành khu di tích quan trọng.',
                'local_culture' => [
                    'Văn hóa Côn Đảo hòa trộn du lịch sinh thái với giá trị lịch sử.',
                    'Ẩm thực hải sản sạch và các món đặc sản miền biển. ',
                    'Không gian nghỉ dưỡng riêng tư phù hợp cho khách cao cấp và cặp đôi. ',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 3 đến tháng 9, biển êm và trời quang đãng.',
                'weather_notes' => 'Mang kem chống nắng, đồ bơi và giày đế mềm để đi bộ trên cát. ',
                'highlights' => [
                    'Resort cao cấp riêng tư',
                    'Tham quan di tích lịch sử Côn Đảo',
                    'Biển sạch, ít đông đúc',
                    'Dịch vụ chăm sóc cá nhân hóa',
                ],
                'included_services' => [
                    'Resort 5 sao / villa riêng',
                    'Xe và tàu/ chuyến bay theo chương trình',
                    'Bữa ăn set menu cao cấp',
                    'Hướng dẫn viên riêng',
                ],
                'excluded_services' => [
                    'Vé máy bay khứ hồi',
                    'Chi phí nâng cấp dịch vụ riêng',
                    'Các chi phí cá nhân',
                ],
                'suitable_for' => ['Khách cao cấp', 'Cặp đôi', 'Gia đình nhỏ'],
                'travel_tips' => [
                    'Nên đặt sớm vì số lượng phòng hạn chế',
                    'Mang đồ bơi và giày đi bộ nhẹ',
                ],
                'meeting_point' => 'Sân bay Côn Sơn hoặc khu nghỉ dưỡng',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đến Côn Đảo và nhận phòng', 'description' => 'Đón khách, nhận phòng resort và nghỉ ngơi bên bãi biển riêng.', 'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Tham quan di tích lịch sử', 'description' => 'Thăm trại Phú Hải, nghĩa trang Hàng Dương và tìm hiểu câu chuyện Côn Đảo.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Biển đảo và spa nghỉ dưỡng', 'description' => 'Tắm biển An Hải, thư giãn spa và dùng bữa tối hải sản.', 'image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Tự do và tiễn khách', 'description' => 'Thư giãn buổi sáng, mua quà và ra sân bay Côn Sơn.', 'image' => 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
        ];

        $tours = collect();

        foreach ($tourBlueprints as $tourIndex => $blueprint) {
            $baseDate = Carbon::now()->addDays(($tourIndex + 1) * 7);

            $tours->push(Tour::updateOrCreate([
                'slug' => $blueprint['slug'],
            ], [
                'title' => $blueprint['title'],
                'description' => $blueprint['description'],
                'destination' => $blueprint['destination'],
                'category' => $blueprint['category'],
                'duration_days' => $blueprint['duration_days'],
                'max_pax' => $blueprint['max_pax'],
                'price_per_person' => $blueprint['price_per_person'],
                'promotion_type' => $tourIndex % 3 === 0 ? 'percent' : ($tourIndex % 4 === 0 ? 'fixed' : 'none'),
                'promotion_value' => $tourIndex % 3 === 0 ? 10 : ($tourIndex % 4 === 0 ? 500000 : 0),
                'images' => $blueprint['images'],
                'highlights' => $blueprint['highlights'],
                'destination_overview' => $blueprint['destination_overview'] ?? "{$blueprint['destination']} là điểm đến nổi bật với cảnh quan và trải nghiệm bản địa đặc trưng, phù hợp cho khách muốn tour thực tế và dễ hiểu.",
                'historical_background' => $blueprint['historical_background'] ?? "Khu vực {$blueprint['destination']} có bối cảnh lịch sử và văn hóa phong phú, gắn với đời sống cư dân địa phương, ẩm thực và các điểm tham quan nổi tiếng.",
                'local_culture' => $blueprint['local_culture'] ?? [
                    'Ẩm thực địa phương là một phần quan trọng của trải nghiệm',
                    'Người dân thân thiện, phù hợp cho tour khám phá kết hợp giao lưu',
                    'Có nhiều hoạt động chụp ảnh và tìm hiểu phong tục bản địa',
                ],
                'best_time_to_visit' => $blueprint['best_time_to_visit'] ?? 'Thời điểm đẹp nhất là mùa khô hoặc giai đoạn thời tiết ổn định, thuận tiện cho lịch trình ngoài trời.',
                'weather_notes' => $blueprint['weather_notes'] ?? "Nên theo dõi dự báo thời tiết của {$blueprint['destination']} trước ngày khởi hành, chuẩn bị áo khoác mỏng và giày thoải mái.",
                'included_services' => $blueprint['included_services'],
                'excluded_services' => $blueprint['excluded_services'],
                'suitable_for' => $blueprint['suitable_for'],
                'travel_tips' => $blueprint['travel_tips'],
                'meeting_point' => $blueprint['meeting_point'],
                'itinerary' => $blueprint['itinerary'],
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

        $settings = \App\Models\SystemSetting::firstOrCreate(
            ['company_name' => 'TravelFlow'],
            [
                'logo' => 'https://ui-avatars.com/api/?name=TravelFlow&background=1d4ed8&color=fff&size=256',
                'address' => '54 Tô Ngọc Vân, Thanh Xuân, Hà Nội',
                'hotline' => '1900 6868',
                'bank_name' => 'TPBank',
                'bank_code' => 'TPB',
                'bank_account_number' => '0328754062',
                'bank_account_name' => 'NGUYEN TRAN THAI BAO',
                'bank_branch' => 'TP.HCM',
                'payment_note_prefix' => 'TRAVELFLOW',
                'payment_methods' => ['bank', 'vnpay'],
                'featured_destinations' => ['Đà Nẵng', 'Hà Nội', 'Phú Quốc', 'Đà Lạt'],
                'banner_messages' => ['Đặt sớm giữ giá tốt', 'Hỗ trợ 24/7', 'Dịch vụ trọn gói'],
                'cancellation_policy' => [
                    'tiers' => [
                        ['label' => 'Hủy trước 15+ ngày', 'refund_rate' => 1],
                        ['label' => 'Hủy trước 7-14 ngày', 'refund_rate' => 0.7],
                        ['label' => 'Hủy trước 3-6 ngày', 'refund_rate' => 0.5],
                        ['label' => 'Hủy trong 0-2 ngày', 'refund_rate' => 0],
                    ],
                ],
                'email_templates' => [
                    'booking_confirmation' => 'Cảm ơn bạn đã đặt tour tại TravelFlow.',
                    'refund_notice' => 'Chúng tôi đã ghi nhận yêu cầu hoàn tiền của bạn.',
                    'support_reply' => 'Đội ngũ hỗ trợ đã phản hồi ticket của bạn.',
                    'tour_approval' => 'Tour của bạn đã được duyệt.',
                    'partner_approval' => 'Hồ sơ đối tác của bạn đã được duyệt.',
                ],
            ]
        );

        $partnerUser = $users->firstWhere('role', 'partner');
        if ($partnerUser) {
            $partnerProfile = Partner::firstOrCreate(
                ['user_id' => $partnerUser->_id],
                [
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
                ]
            );

            PartnerService::firstOrCreate(
                ['partner_id' => $partnerProfile->_id, 'name' => 'Phòng Superior hướng biển'],
                [
                    'service_category' => 'hotel',
                    'price' => 1200000,
                    'unit' => 'phòng/đêm',
                    'available_quantity' => 15,
                    'pricing_note' => 'Áp dụng cuối tuần tăng 10%',
                ]
            );
        }

        $guideUsers = $users->where('role', 'guide')->values();
        foreach ($guideUsers as $guideUser) {
            Guide::firstOrCreate(
                ['user_id' => $guideUser->_id],
                [
                    'license_number' => 'GUIDE-'.strtoupper(Str::random(8)),
                    'experience_years' => rand(2, 10),
                    'specialization' => 'tour_du_lich',
                    'languages' => ['tiếng Việt', 'tiếng Anh'],
                    'bio' => 'Hướng dẫn viên chuyên nghiệp.',
                    'status' => 'active',
                ]
            );
        }

        $reviewThemes = [
            'kham-pha-da-nang' => [
                ['title' => 'Tour đáng tiền', 'rating' => 5, 'comment' => 'Lịch trình hợp lý, khách sạn và xe đưa đón đều ổn, rất phù hợp gia đình.'],
                ['title' => 'Hướng dẫn viên nhiệt tình', 'rating' => 5, 'comment' => 'Đi cùng nhóm bạn rất vui, hướng dẫn viên hỗ trợ chu đáo và linh hoạt khi đổi giờ ăn.'],
                ['title' => 'Trải nghiệm trọn vẹn', 'rating' => 4, 'comment' => 'Tour ổn, nhiều điểm tham quan và ăn uống đúng mô tả, giá phù hợp.'],
            ],
            'di-san-ha-noi' => [
                ['title' => 'Hành trình nhẹ nhàng', 'rating' => 4, 'comment' => 'Tour nhẹ nhàng, nhiều điểm văn hóa, hướng dẫn viên nhiệt tình và đúng giờ.'],
                ['title' => 'Phù hợp người lớn tuổi', 'rating' => 5, 'comment' => 'Lịch trình vừa phải, ít di chuyển gấp, rất phù hợp gia đình có ông bà đi cùng.'],
                ['title' => 'Ẩm thực rất ổn', 'rating' => 4, 'comment' => 'Ăn uống ngon, khách sạn trung tâm thuận tiện và không bị mệt vì di chuyển quá nhiều.'],
            ],
            'nghi-duong-phu-quoc' => [
                ['title' => 'Kỳ nghỉ thư giãn', 'rating' => 5, 'comment' => 'Khu nghỉ dưỡng đẹp, dịch vụ tốt và lịch trình thoải mái, rất đáng trải nghiệm.'],
                ['title' => 'Biển đẹp, dịch vụ tốt', 'rating' => 5, 'comment' => 'Điểm nổi bật là biển đẹp và các bữa ăn hải sản chất lượng, rất hợp nghỉ dưỡng.'],
                ['title' => 'Đáng để quay lại', 'rating' => 4, 'comment' => 'Tour nhẹ nhàng, nhiều thời gian tự do, thích hợp cho cặp đôi muốn nghỉ dưỡng.'],
            ],
            'nghi-duong-da-lat' => [
                ['title' => 'Không khí mát và dễ chịu', 'rating' => 5, 'comment' => 'Tour nhẹ, thời tiết dễ chịu, điểm tham quan phù hợp để chụp ảnh và nghỉ ngơi.'],
                ['title' => 'Lịch trình hợp gia đình', 'rating' => 5, 'comment' => 'Không chạy quá nhiều điểm, có thời gian nghỉ và ăn uống thoải mái.'],
                ['title' => 'Dịch vụ chu đáo', 'rating' => 4, 'comment' => 'Villa và xe đưa đón tốt, các điểm check-in được sắp xếp khá hợp lý.'],
            ],
            'hanh-trinh-co-do-hue' => [
                ['title' => 'Rất nhiều giá trị lịch sử', 'rating' => 5, 'comment' => 'Đi tour này mới thấy Huế đẹp và sâu sắc, lịch trình khá trọn vẹn.'],
                ['title' => 'Hướng dẫn viên am hiểu', 'rating' => 5, 'comment' => 'Thuyết minh chi tiết, câu chuyện lịch sử được kể rất dễ hiểu và không bị khô.'],
                ['title' => 'Ăn uống chuẩn vị Huế', 'rating' => 4, 'comment' => 'Món ăn ngon, dịch vụ ổn, chỉ hơi tiếc vì thời gian ở một số điểm còn ngắn.'],
            ],
            'bien-xanh-quy-nhon' => [
                ['title' => 'Biển rất đẹp', 'rating' => 5, 'comment' => 'Kỳ Co và Eo Gió đúng là điểm sáng, nước biển trong và chụp ảnh lên rất đẹp.'],
                ['title' => 'Phù hợp nhóm bạn', 'rating' => 5, 'comment' => 'Tour đi thoải mái, có nhiều thời gian tự do và lịch trình không quá nặng.'],
                ['title' => 'Hải sản tươi', 'rating' => 4, 'comment' => 'Các bữa ăn hải sản khá ổn, phục vụ nhanh và không bị chặt chém.'],
            ],
            'kham-pha-mien-tay' => [
                ['title' => 'Trải nghiệm rất thật', 'rating' => 5, 'comment' => 'Chợ nổi buổi sáng rất đáng thử, cảm giác đúng chất miền Tây sông nước.'],
                ['title' => 'Trẻ em rất thích', 'rating' => 5, 'comment' => 'Lịch trình có vườn trái cây và đi đò nên gia đình đi chung rất vui.'],
                ['title' => 'Ăn uống dân dã', 'rating' => 4, 'comment' => 'Món ăn miền Tây ngon, tour nhẹ nhàng và dễ đi cho nhiều độ tuổi.'],
            ],
            'con-dao-cao-cap' => [
                ['title' => 'Đáng tiền cho kỳ nghỉ riêng tư', 'rating' => 5, 'comment' => 'Resort tốt, dịch vụ riêng tư và biển yên tĩnh đúng như mong đợi.'],
                ['title' => 'Tour lịch sử sâu sắc', 'rating' => 5, 'comment' => 'Phần tham quan di tích rất ấn tượng, hướng dẫn viên kể chuyện hay.'],
                ['title' => 'Rất thư giãn', 'rating' => 4, 'comment' => 'Lịch trình cân bằng giữa nghỉ dưỡng và tham quan, phù hợp cặp đôi.'],
            ],
        ];

        $customerPool = $users->where('role', 'customer')->values();
        foreach ($tours as $tourIndex => $tour) {
            $themes = $reviewThemes[$tour->slug] ?? [
                ['title' => 'Trải nghiệm tốt', 'rating' => 5, 'comment' => 'Tour rõ ràng, dịch vụ ổn và phù hợp để tham khảo.'],
                ['title' => 'Đáng cân nhắc', 'rating' => 4, 'comment' => 'Lịch trình hợp lý, hướng dẫn viên thân thiện và dễ theo dõi.'],
                ['title' => 'Ổn định', 'rating' => 4, 'comment' => 'Thông tin đầy đủ, phù hợp cho khách muốn đi du lịch trọn gói.'],
            ];

            foreach ($themes as $reviewIndex => $theme) {
                $customer = $customerPool[($tourIndex + $reviewIndex) % max($customerPool->count(), 1)];
                if (! $customer) {
                    continue;
                }

                Review::firstOrCreate(
                    ['tour_id' => $tour->_id, 'user_id' => $customer->_id, 'title' => $theme['title']],
                    [
                        'booking_id' => null,
                        'rating' => $theme['rating'],
                        'comment' => $theme['comment'],
                        'images' => [],
                        'status' => 'approved',
                        'created_at' => Carbon::now()->subDays(rand(2, 60)),
                    ]
                );
            }
        }

        $this->command->info('Đã khởi tạo dữ liệu nền đầy đủ hơn. Không tạo dữ liệu giao dịch giả.');
        return;

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
                'method' => 'bank',
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
            ]);
        }

        if ($guideCandidate && $guideUsers->isNotEmpty()) {
            foreach ($guideUsers as $guideUser) {
                Guide::create([
                    'user_id' => $guideUser->_id,
                    'license_number' => 'GUIDE-'.strtoupper(Str::random(8)),
                    'experience_years' => rand(2, 10),
                    'specialization' => ['tour_du_lich', 'van_hoa'][array_rand(['tour_du_lich', 'van_hoa'])],
                    'languages' => ['tiếng Việt', 'tiếng Anh'],
                    'bio' => 'Hướng dẫn viên chuyên nghiệp với kinh nghiệm dẫn tour tại khu vực miền Trung và miền Nam.',
                    'status' => 'active',
                    'created_at' => Carbon::now()->subDays(rand(10, 60)),
                ]);
            }
        }
    }
}
