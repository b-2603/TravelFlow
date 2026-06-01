<?php

namespace Database\Seeders;

use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\FavoriteTour;
use App\Models\Guide;
use App\Models\Partner;
use App\Models\PartnerService;
use App\Models\Payment;
use App\Models\NewsPromotion;
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
                    ['day' => 1, 'title' => 'Đón sân bay và tắm biển Mỹ Khê', 'description' => 'Đón đoàn tại sân bay hoặc điểm hẹn, di chuyển về khách sạn gần biển Mỹ Khê, nhận phòng, nghỉ ngơi, tắm biển nhẹ và dùng bữa tối hải sản ven biển.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Bà Nà Hills & Cầu Vàng', 'description' => 'Khởi hành sớm lên Bà Nà Hills, trải nghiệm cáp treo, ghé Cầu Vàng, khu làng Pháp, hầm rượu và các điểm check-in nổi bật trước khi trở về Đà Nẵng.', 'image' => 'https://images.unsplash.com/photo-1559592481-74153c49ca83?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Hội An và phố cổ', 'description' => 'Di chuyển tới Hội An, tham quan chùa Cầu, nhà cổ, dạo phố đèn lồng, ăn tối đặc sản miền Trung và tự do chụp ảnh bên sông Hoài.', 'image' => 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Chợ Hàn và tiễn khách', 'description' => 'Ăn sáng, ghé chợ Hàn mua đặc sản như mực khô, bánh khô mè, sắp xếp thời gian nghỉ ngơi rồi tiễn khách ra sân bay hoặc điểm đón.', 'image' => 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80'],
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
                    'https://i.pinimg.com/1200x/1d/19/6e/1d196e0d409a209df71f782d686727b6.jpg',
                    'https://i.pinimg.com/736x/6c/0f/2c/6c0f2c0e4d57e6deb5588337d4daada3.jpg',
                    'https://i.pinimg.com/736x/17/0f/af/170faf1b74df32ca3673bdb84fde3280.jpg',
                    'https://i.pinimg.com/736x/c2/c5/94/c2c5945fa9edae6777f17ceb34f4f01e.jpg',
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
                    ['day' => 1, 'title' => 'Phố cổ & Hồ Hoàn Kiếm', 'description' => 'Nhận phòng khu trung tâm, đi bộ quanh Hồ Gươm, ghé đền Ngọc Sơn, chụp ảnh cầu Thê Húc và thưởng thức ẩm thực phố cổ buổi tối.', 'image' => 'https://i.pinimg.com/1200x/1d/19/6e/1d196e0d409a209df71f782d686727b6.jpg'],
                    ['day' => 2, 'title' => 'Văn Miếu và làng gốm Bát Tràng', 'description' => 'Tham quan Văn Miếu - Quốc Tử Giám, nghe giới thiệu lịch sử khoa bảng, sau đó đi Bát Tràng trải nghiệm làm gốm và mua đồ thủ công.', 'image' => 'https://i.pinimg.com/736x/6c/0f/2c/6c0f2c0e4d57e6deb5588337d4daada3.jpg'],
                    ['day' => 3, 'title' => 'Hoàng thành Thăng Long và tiễn khách', 'description' => 'Khám phá Hoàng thành, dạo Nhà hát Lớn, ghé phố Tràng Tiền mua quà lưu niệm rồi di chuyển ra sân bay.', 'image' => 'https://i.pinimg.com/736x/17/0f/af/170faf1b74df32ca3673bdb84fde3280.jpg'],
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
                    'https://i.pinimg.com/736x/4d/b8/44/4db8442df7cd5d6745915ab76636438b.jpg',
                    'https://i.pinimg.com/1200x/7c/78/4f/7c784f8be13f4a7b56860e99b277e03c.jpg',
                    'https://i.pinimg.com/736x/6f/72/44/6f72440d0d359b5708bea78bac14cd56.jpg',
                    'https://i.pinimg.com/736x/77/f5/cf/77f5cf2518b0ffb018168be996e99a78.jpg',
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
                    ['day' => 1, 'title' => 'Đón khách và nhận phòng resort', 'description' => 'Đón tại sân bay Phú Quốc, đưa về resort ven biển, nhận phòng, nghỉ ngơi và tự do tắm biển hoặc sử dụng tiện ích hồ bơi.', 'image' => 'https://i.pinimg.com/736x/4d/b8/44/4db8442df7cd5d6745915ab76636438b.jpg'],
                    ['day' => 2, 'title' => 'Cáp treo Hòn Thơm và Bãi Sao', 'description' => 'Đi cáp treo vượt biển ra Hòn Thơm, tham quan bãi biển, vui chơi, tắm biển tại Bãi Sao và thưởng thức bữa trưa hải sản.', 'image' => 'https://i.pinimg.com/1200x/7c/78/4f/7c784f8be13f4a7b56860e99b277e03c.jpg'],
                    ['day' => 3, 'title' => 'Tham quan Dương Đông và chợ đêm', 'description' => 'Tham quan nhà thùng nước mắm, cơ sở tiêu, sau đó đi chợ đêm Dương Đông để ăn hải sản và mua đặc sản địa phương.', 'image' => 'https://i.pinimg.com/736x/6f/72/44/6f72440d0d359b5708bea78bac14cd56.jpg'],
                    ['day' => 4, 'title' => 'Tự do nghỉ dưỡng và tiễn khách', 'description' => 'Thư giãn tại resort, đi dạo bãi biển, kiểm tra hành lý, mua quà đặc sản và làm thủ tục trả phòng, ra sân bay.', 'image' => 'https://i.pinimg.com/736x/77/f5/cf/77f5cf2518b0ffb018168be996e99a78.jpg'],
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
                    'https://i.pinimg.com/736x/42/c6/57/42c657114f301fc3212563e50467b5ae.jpg',
                    'https://i.pinimg.com/736x/65/fd/99/65fd9902f7ba4a0db13d608c491f8cb0.jpg',
                    'https://i.pinimg.com/736x/1e/7e/8c/1e7e8c30c60131976c8c65ea66aa12e3.jpg',
                    'https://i.pinimg.com/1200x/92/0f/09/920f09eb9d3c8dea8a9ca894a15501c7.jpg',
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
                    ['day' => 1, 'title' => 'Di chuyển lên Sa Pa', 'description' => 'Khởi hành từ Hà Nội, di chuyển bằng xe giường nằm hoặc tàu, đến Sa Pa nhận phòng và dạo chợ đêm thị trấn.', 'image' => 'https://i.pinimg.com/736x/42/c6/57/42c657114f301fc3212563e50467b5ae.jpg'],
                    ['day' => 2, 'title' => 'Fansipan & Bản làng', 'description' => 'Đi cáp treo lên Fansipan, tham quan bản Cát Cát, tìm hiểu kiến trúc nhà gỗ và thưởng thức món vùng cao.', 'image' => 'https://i.pinimg.com/736x/65/fd/99/65fd9902f7ba4a0db13d608c491f8cb0.jpg'],
                    ['day' => 3, 'title' => 'Trekking Mường Hoa', 'description' => 'Trekking nhẹ qua Lao Chải - Tả Van, ngắm ruộng bậc thang, suối Mường Hoa và giao lưu với người dân bản địa.', 'image' => 'https://i.pinimg.com/736x/1e/7e/8c/1e7e8c30c60131976c8c65ea66aa12e3.jpg'],
                    ['day' => 4, 'title' => 'Mua đặc sản và trở về', 'description' => 'Thăm chợ Sa Pa mua táo mèo, thổ cẩm, ăn trưa nhẹ rồi di chuyển về Hà Nội hoặc điểm kết thúc.', 'image' => 'https://i.pinimg.com/1200x/92/0f/09/920f09eb9d3c8dea8a9ca894a15501c7.jpg'],
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
                    'https://i.pinimg.com/736x/a5/92/f9/a592f911220939a5ec1bc56608fc5c60.jpg',
                    'https://i.pinimg.com/1200x/a8/8a/75/a88a75504a1e0083bf39f9bac8cd7e3a.jpg',
                    'https://i.pinimg.com/736x/cd/f1/2a/cdf12afb32ba694bc13b3d7ab4ef7817.jpg',
                    'https://i.pinimg.com/736x/f1/ec/8a/f1ec8a3976dd540d28bb54d17136ae39.jpg',
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
                    ['day' => 1, 'title' => 'Tắm biển và nhận phòng', 'description' => 'Đón đoàn, nhận phòng khách sạn gần bãi biển và thư giãn trên bờ cát.', 'image' => 'https://i.pinimg.com/736x/a5/92/f9/a592f911220939a5ec1bc56608fc5c60.jpg'],
                    ['day' => 2, 'title' => 'VinWonders và cáp treo', 'description' => 'Tham quan VinWonders Nha Trang, trải nghiệm công viên nước và cáp treo Hòn Tre.', 'image' => 'https://i.pinimg.com/1200x/a8/8a/75/a88a75504a1e0083bf39f9bac8cd7e3a.jpg'],
                    ['day' => 3, 'title' => 'Hòn Mun và lặn san hô', 'description' => 'Lên tàu ra Hòn Mun, lặn ngắm san hô và khám phá thế giới biển.', 'image' => 'https://i.pinimg.com/736x/cd/f1/2a/cdf12afb32ba694bc13b3d7ab4ef7817.jpg'],
                    ['day' => 4, 'title' => 'Mua sắm đặc sản và tiễn khách', 'description' => 'Mua quà biển, trả phòng và đưa đoàn ra sân bay/điểm đón.', 'image' => 'https://i.pinimg.com/736x/f1/ec/8a/f1ec8a3976dd540d28bb54d17136ae39.jpg'],
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
                    'https://i.pinimg.com/1200x/b0/37/28/b03728f65a60819c7c68e9937fe66a2b.jpg',
                    'https://i.pinimg.com/1200x/e2/f5/87/e2f58751ae90b63181c5261c0c90e481.jpg',
                    'https://i.pinimg.com/1200x/80/67/6a/80676a43421ada329b129ceaa3336291.jpg',
                    'https://i.pinimg.com/1200x/7e/fa/e4/7efae43a044a6aaaa14bf0c44ade770d.jpg',
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
                    'https://i.pinimg.com/1200x/4e/33/ad/4e33ade06fa576399ecd801b79514c7b.jpg',
                    'https://i.pinimg.com/1200x/71/ae/6c/71ae6cdcac2bb881c4b6ba1be61f0fc0.jpg',
                    'https://i.pinimg.com/736x/39/b5/2f/39b52ffeb8b647b16a773256bf119640.jpg',
                    'https://i.pinimg.com/736x/af/5e/a8/af5ea8e834030685456c12132e92ecf3.jpg',
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
                    ['day' => 1, 'title' => 'Lên du thuyền Orchid Cruise', 'description' => 'Tập trung tại Cảng tàu khách quốc tế Hạ Long, check-in cabin du thuyền 4 sao và thưởng thức bữa trưa trên boong.', 'image' => 'https://i.pinimg.com/1200x/4e/33/ad/4e33ade06fa576399ecd801b79514c7b.jpg'],
                    ['day' => 2, 'title' => 'Thăm hang Sửng Sốt', 'description' => 'Khám phá hang Sửng Sốt, đi kayak quanh những đảo đá vôi và chụp ảnh cảnh quan vịnh.', 'image' => 'https://i.pinimg.com/1200x/71/ae/6c/71ae6cdcac2bb881c4b6ba1be61f0fc0.jpg'],
                    ['day' => 3, 'title' => 'Bình minh và làng chài Cửa Vạn', 'description' => 'Ngắm bình minh trên boong, dùng bữa sáng và thăm làng chài nổi Cửa Vạn để hiểu đời sống ngư dân.', 'image' => 'https://i.pinimg.com/736x/39/b5/2f/39b52ffeb8b647b16a773256bf119640.jpg'],
                    ['day' => 4, 'title' => 'Tiễn khách tại Hạ Long', 'description' => 'Ăn trưa trên tàu, trả phòng cabin và trở về cảng để tiễn đoàn.', 'image' => 'https://i.pinimg.com/736x/af/5e/a8/af5ea8e834030685456c12132e92ecf3.jpg'],
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
                    'https://i.pinimg.com/1200x/b0/d7/21/b0d7210f14ee6d2b9c81f2d4c5845284.jpg',
                    'https://i.pinimg.com/736x/e7/63/0a/e7630a89f6f32aa0cdd20b843dcdca95.jpg',
                    'https://i.pinimg.com/736x/db/52/ce/db52ce5b21e3138b8be6d9c388440441.jpg',
                    'https://i.pinimg.com/736x/ef/78/09/ef780970059d2f16e454a7e903b0667c.jpg',
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
                    ['day' => 1, 'title' => 'Đại Nội và chùa Thiên Mụ', 'description' => 'Tham quan Ngọ Môn, Điện Thái Hoà, Tử Cấm Thành, sau đó di chuyển ra chùa Thiên Mụ bên sông Hương để nghe giới thiệu về lịch sử cố đô.', 'image' => 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Lăng Minh Mạng và Khải Định', 'description' => 'Khởi hành tham quan hai lăng tẩm tiêu biểu, tìm hiểu kiến trúc, cảnh quan và câu chuyện triều Nguyễn; buổi chiều ghé làng hương, làng nón hoặc xưởng làm mè xửng.', 'image' => 'https://images.unsplash.com/photo-1570308175441-d7e50d0c5b7a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Sông Hương và tiễn khách', 'description' => 'Du thuyền trên sông Hương nghe ca Huế, ghé cầu Tràng Tiền, mua quà lưu niệm và di chuyển ra sân bay/ga tàu.', 'image' => 'https://images.unsplash.com/photo-1589779137213-95ece3820a2d?auto=format&fit=crop&w=800&q=80'],
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
                    ['day' => 1, 'title' => 'Quy Nhơn city tour', 'description' => 'Nhận phòng, tham quan trung tâm thành phố, dạo bờ biển Quy Nhơn, ghé tháp Đôi hoặc quảng trường trung tâm rồi ăn tối hải sản.', 'image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Kỳ Co và Eo Gió', 'description' => 'Di chuyển ra bến cano, tắm biển Kỳ Co, chụp ảnh tại Eo Gió, dùng bữa trưa hải sản và nghỉ ngơi trên bãi biển.', 'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Làng chài Nhơn Hải và Ghềnh Ráng', 'description' => 'Tham quan làng chài, tìm hiểu nghề biển, ghé Ghềnh Ráng - Tiên Sa, mộ Hàn Mặc Tử và các điểm chụp hình ven biển.', 'image' => 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Mua quà - tiễn khách', 'description' => 'Ăn sáng, mua đặc sản địa phương, trả phòng, ghé chợ hoặc cửa hàng hải sản khô rồi tiễn khách ra sân bay.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
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
                    ['day' => 1, 'title' => 'Cần Thơ city tour', 'description' => 'Nhận phòng, tham quan bến Ninh Kiều, cầu đi bộ, chợ đêm và dùng bữa tối với món địa phương.', 'image' => 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Chợ nổi Cái Răng và vườn trái cây', 'description' => 'Khởi hành sớm ra chợ nổi, thưởng thức bữa sáng trên thuyền, sau đó ghé vườn trái cây và nghỉ trưa tại nhà vườn.', 'image' => 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Miệt vườn trải nghiệm', 'description' => 'Đi xuồng qua rạch nhỏ, tham gia làm bánh dân gian, nghe đờn ca tài tử và thưởng thức đặc sản trước khi tiễn khách.', 'image' => 'https://images.unsplash.com/photo-1544551763-ced5c0e0d0d6?auto=format&fit=crop&w=800&q=80'],
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
                    ['day' => 1, 'title' => 'Đến Côn Đảo và nhận phòng', 'description' => 'Đón khách tại sân bay, đưa về resort, nhận phòng và tự do nghỉ ngơi bên bãi biển riêng.', 'image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 2, 'title' => 'Tham quan di tích lịch sử', 'description' => 'Thăm trại Phú Hải, chuồng cọp, nghĩa trang Hàng Dương và nghe kể về lịch sử Côn Đảo qua từng điểm dừng.', 'image' => 'https://images.unsplash.com/photo-1581404172462-87063f27f09a?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 3, 'title' => 'Biển đảo và spa nghỉ dưỡng', 'description' => 'Tắm biển An Hải, đi tàu/chèo kayak nếu thời tiết phù hợp, nghỉ spa và dùng bữa tối hải sản.', 'image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=800&q=80'],
                    ['day' => 4, 'title' => 'Tự do và tiễn khách', 'description' => 'Dạo biển buổi sáng, mua quà đặc sản địa phương, trả phòng và di chuyển ra sân bay Côn Sơn.', 'image' => 'https://images.unsplash.com/photo-1559128010-7c1ad6e1b6a5?auto=format&fit=crop&w=800&q=80'],
                ],
            ],
            [
                'title' => 'Sông nước Tiền Giang',
                'slug' => 'song-nuoc-tien-giang',
                'destination' => 'Tiền Giang',
                'category' => 'Trải nghiệm',
                'duration_days' => 2,
                'max_pax' => 24,
                'price_per_person' => 3250000,
                'images' => [
                    'https://i.pinimg.com/736x/50/2e/2f/502e2fc0265e6dd672da35b4d3e0d8a9.jpg',
                    'https://i.pinimg.com/1200x/40/88/a6/4088a615e8a22f670126945632f59373.jpg',
                    'https://i.pinimg.com/1200x/07/1d/ae/071daef286ebc98731e578503d907a3b.jpg',
                    'https://i.pinimg.com/1200x/72/36/de/7236deb7f512e9e7d49f3f41cc8eb9bf.jpg',
                ],
                'description' => 'Tour ngắn ngày khám phá miền Tây sông nước với chợ nổi, vườn trái cây, làng nghề kẹo dừa và trải nghiệm đò chèo địa phương. ',
                'destination_overview' => 'Tiền Giang là cửa ngõ miền Tây với sông Tiền, vườn cây trái trĩu quả và không khí miệt vườn rất đặc trưng. ',
                'historical_background' => 'Vùng đất này hình thành từ hệ thống kênh rạch lâu đời, gắn với thương mại đường sông và đời sống nông nghiệp trù phú. ',
                'local_culture' => [
                    'Chợ nổi và thuyền ghe là một phần đời sống thường ngày.',
                    'Ẩm thực miền Tây ngọt thanh, dân dã và giàu hương vị trái cây.',
                    'Người dân hiếu khách, thích chia sẻ câu chuyện miệt vườn.',
                ],
                'best_time_to_visit' => 'Mùa khô và mùa trái cây chín từ khoảng tháng 5 đến tháng 8. ',
                'weather_notes' => 'Chuẩn bị nón, kem chống nắng và giày dễ đi vì di chuyển cả trên bộ lẫn trên đò. ',
                'highlights' => [
                    'Chợ nổi buổi sớm',
                    'Vườn trái cây và làng nghề',
                    'Ẩm thực miền Tây dân dã',
                    'Lịch trình ngắn, phù hợp cuối tuần',
                ],
                'included_services' => [
                    'Xe du lịch đời mới',
                    'Ăn trưa đặc sản địa phương',
                    'Vé tham quan theo lịch trình',
                    'Hướng dẫn viên tiếng Việt',
                ],
                'excluded_services' => [
                    'Chi phí mua trái cây / quà mang về',
                    'Đồ uống ngoài chương trình',
                    'Phụ thu ngoài hành trình',
                ],
                'suitable_for' => ['Gia đình', 'Nhóm bạn', 'Khách lớn tuổi'],
                'travel_tips' => [
                    'Nên khởi hành sớm để kịp chợ nổi.',
                    'Mang tiền lẻ để mua quà tại làng nghề.',
                ],
                'meeting_point' => 'TP. Hồ Chí Minh hoặc điểm hẹn theo đoàn',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Chợ nổi và vườn trái cây', 'description' => 'Khởi hành từ rất sớm để kịp chợ nổi, đi thuyền len lỏi giữa các ghe hàng, dùng bữa sáng trên sông, sau đó ghé vườn trái cây để hái quả và nghỉ trưa tại nhà vườn.', 'image' => 'https://i.pinimg.com/736x/50/2e/2f/502e2fc0265e6dd672da35b4d3e0d8a9.jpg'],
                    ['day' => 2, 'title' => 'Làng nghề kẹo dừa', 'description' => 'Tham quan cơ sở làm kẹo dừa, nghe giới thiệu quy trình sản xuất, thử làm kẹo thủ công, đi đò chèo trên rạch nhỏ và mua quà đặc sản trước khi trở về điểm đón.', 'image' => 'https://i.pinimg.com/1200x/40/88/a6/4088a615e8a22f670126945632f59373.jpg'],
                ],
            ],
            [
                'title' => 'Khám phá Phong Nha',
                'slug' => 'kham-pha-phong-nha',
                'destination' => 'Quảng Bình',
                'category' => 'Thiên nhiên',
                'duration_days' => 3,
                'max_pax' => 20,
                'price_per_person' => 5600000,
                'images' => [
                    'https://i.pinimg.com/736x/86/3f/0a/863f0a9b1d3e9894a93ba7c9c15dd662.jpg',
                    'https://i.pinimg.com/1200x/06/f9/0e/06f90efe6e9979e865cf8bd8fd61fd21.jpg',
                    'https://i.pinimg.com/1200x/05/eb/31/05eb31f2ffe7dfc5bafe697b20baf870.jpg',
                    'https://i.pinimg.com/736x/f0/05/0b/f0050bfcb64b3227ab6e28c285c504a9.jpg',
                ],
                'description' => 'Hành trình kết hợp động Phong Nha, sông Son và khám phá hệ thống hang động kỳ vĩ của Quảng Bình, phù hợp người thích thiên nhiên và trải nghiệm vừa phải. ',
                'destination_overview' => 'Phong Nha là vùng lõi của di sản thiên nhiên thế giới với núi đá vôi, sông ngầm và rừng nguyên sinh rất đặc biệt. ',
                'historical_background' => 'Khu vực này gắn với lịch sử khai phá miền Trung và nay trở thành điểm du lịch sinh thái nổi tiếng. ',
                'local_culture' => [
                    'Người dân Quảng Bình mộc mạc, thẳng thắn và hiếu khách.',
                    'Ẩm thực địa phương có cá kho, bánh bột lọc và hải sản vùng sông biển.',
                    'Du lịch ở đây thường kết hợp sinh thái, hang động và nghỉ dưỡng nhẹ.',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 3 đến tháng 8, khi thời tiết thuận lợi cho tham quan hang động. ',
                'weather_notes' => 'Mang giày có độ bám tốt, áo nhẹ thấm hút và túi chống nước cho đồ điện tử. ',
                'highlights' => [
                    'Hang động và sông ngầm',
                    'Cảnh quan karst kỳ vĩ',
                    'Lịch trình vừa phải, ít mệt',
                    'Phù hợp gia đình thích thiên nhiên',
                ],
                'included_services' => [
                    'Xe du lịch / xe địa phương',
                    'Khách sạn 4 sao hoặc homestay chất lượng',
                    'Bữa ăn theo chương trình',
                    'Vé tham quan Phong Nha',
                ],
                'excluded_services' => [
                    'Vé máy bay',
                    'Đồ uống ngoài chương trình',
                    'Chi phí trò chơi tự chọn',
                ],
                'suitable_for' => ['Gia đình', 'Khách yêu thiên nhiên', 'Nhóm bạn'],
                'travel_tips' => [
                    'Nên chuẩn bị áo mưa mỏng nếu đi mùa chuyển mùa.',
                    'Không nên mang đồ quá cồng kềnh khi vào hang.',
                ],
                'meeting_point' => 'Sân bay Đồng Hới hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đến Đồng Hới', 'description' => 'Đón khách tại sân bay, đi dọc biển Nhật Lệ, nhận phòng và ăn tối hải sản tại nhà hàng ven biển; buổi tối tự do dạo quảng trường hoặc cà phê ven sông.', 'image' => 'https://i.pinimg.com/736x/86/3f/0a/863f0a9b1d3e9894a93ba7c9c15dd662.jpg'],
                    ['day' => 2, 'title' => 'Khám phá Phong Nha', 'description' => 'Di chuyển tới Phong Nha - Kẻ Bàng, ngồi thuyền trên sông Son, thăm động Phong Nha, đi bộ khám phá khu vực hang động và quay về Đồng Hới nghỉ đêm.', 'image' => 'https://i.pinimg.com/1200x/06/f9/0e/06f90efe6e9979e865cf8bd8fd61fd21.jpg'],
                    ['day' => 3, 'title' => 'Làng quê Quảng Bình', 'description' => 'Thăm làng quê ven sông, tìm hiểu đời sống người dân địa phương, ăn trưa món miền Trung và ghé chợ quê mua đặc sản trước khi tiễn khách.', 'image' => 'https://i.pinimg.com/1200x/05/eb/31/05eb31f2ffe7dfc5bafe697b20baf870.jpg'],
                ],
            ],
            [
                'title' => 'Biển cát Mũi Né',
                'slug' => 'bien-cat-mui-ne',
                'destination' => 'Mũi Né',
                'category' => 'Biển',
                'duration_days' => 3,
                'max_pax' => 22,
                'price_per_person' => 4950000,
                'images' => [
                    'https://i.pinimg.com/1200x/9b/16/b9/9b16b9ed93bad33ce5f7723427d25b87.jpg',
                    'https://i.pinimg.com/736x/d5/9e/b1/d59eb16f5e5a504425707b1674f40879.jpg',
                    'https://i.pinimg.com/1200x/38/1b/7b/381b7b46d52cf869482da3b1d74807cf.jpg',
                    'https://i.pinimg.com/736x/1f/f3/bb/1ff3bbe664197035938eb21adb084c61.jpg',
                ],
                'description' => 'Tour biển - cát - nắng với đồi cát bay, làng chài, suối Tiên và nghỉ dưỡng ven biển Mũi Né, phù hợp khách thích chụp ảnh và thư giãn. ',
                'destination_overview' => 'Mũi Né nổi bật với nắng đẹp, cồn cát vàng, biển xanh và những resort trải dài dọc bờ biển. ',
                'historical_background' => 'Khu vực này từ làng chài truyền thống đã phát triển thành điểm du lịch nổi tiếng của Bình Thuận. ',
                'local_culture' => [
                    'Ngư dân Mũi Né sống gắn bó với biển và nghề đánh bắt.',
                    'Ẩm thực có bánh căn, mực một nắng và hải sản tươi.',
                    'Phong cách du lịch mang tính nghỉ dưỡng, vui chơi và chụp hình.',
                ],
                'best_time_to_visit' => 'Mùa khô từ tháng 11 đến tháng 4 là đẹp nhất để ngắm nắng và đồi cát. ',
                'weather_notes' => 'Mang nón rộng vành, kính râm và nước uống vì thời tiết khá nắng và khô. ',
                'highlights' => [
                    'Đồi cát bay',
                    'Suối Tiên và làng chài',
                    'Resort ven biển',
                    'Lịch trình chụp ảnh đẹp',
                ],
                'included_services' => [
                    'Khách sạn/resort 4 sao',
                    'Xe đưa đón tham quan',
                    'Các bữa ăn theo chương trình',
                    'Hướng dẫn viên và bảo hiểm',
                ],
                'excluded_services' => [
                    'Vé xe/vé máy bay đến điểm khởi hành',
                    'Chi phí thuê ván trượt cát',
                    'Đồ uống ngoài chương trình',
                ],
                'suitable_for' => ['Nhóm bạn', 'Cặp đôi', 'Gia đình'],
                'travel_tips' => [
                    'Nên đi đồi cát lúc sáng sớm hoặc chiều muộn để tránh nắng gắt.',
                    'Mang giày dễ tháo để đi cát thoải mái hơn.',
                ],
                'meeting_point' => 'Sân bay Liên Khương / Phan Thiết hoặc khách sạn trung tâm',
                'itinerary' => [
                    ['day' => 1, 'title' => 'Đến Mũi Né và nhận phòng', 'description' => 'Đón khách tại điểm hẹn, nhận phòng resort ven biển, thư giãn hồ bơi hoặc tắm biển chiều muộn và dùng bữa tối với hải sản địa phương.', 'image' => 'https://i.pinimg.com/1200x/9b/16/b9/9b16b9ed93bad33ce5f7723427d25b87.jpg'],
                    ['day' => 2, 'title' => 'Đồi cát bay và suối Tiên', 'description' => 'Đi sớm để ngắm bình minh trên đồi cát, chụp ảnh, trượt cát, sau đó men theo suối Tiên khám phá các mảng đá màu và cảnh quan tự nhiên độc đáo.', 'image' => 'https://i.pinimg.com/736x/d5/9e/b1/d59eb16f5e5a504425707b1674f40879.jpg'],
                    ['day' => 3, 'title' => 'Làng chài và tiễn khách', 'description' => 'Tham quan làng chài buổi sáng để xem thuyền cá cập bến, mua hải sản khô hoặc quà lưu niệm, rồi trả phòng và tiễn khách ra điểm kết thúc.', 'image' => 'https://i.pinimg.com/1200x/38/1b/7b/381b7b46d52cf869482da3b1d74807cf.jpg'],
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

        foreach ($customers as $index => $customer) {
            if ($tours->isEmpty()) {
                break;
            }

            $tour = $tours[$index % $tours->count()];
            $departure = collect($tour->departures ?? [])->first();

            if (! $departure || empty($departure['date'])) {
                continue;
            }

            $existingBooking = Booking::where('tour_id', $tour->_id)
                ->where('user_id', $customer->_id)
                ->where('note', 'Dữ liệu mẫu đặt tour')
                ->first();

            $numPax = $index + 1;
            $booking = $existingBooking ?? Booking::create([
                'tour_id' => $tour->_id,
                'user_id' => $customer->_id,
                'assigned_agent_id' => $agent?->_id,
                'departure_date' => Carbon::parse($departure['date']),
                'num_pax' => $numPax,
                'total_price' => $numPax * (float) $tour->price_per_person,
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

            if (! $existingBooking) {
                $booking->created_at = Carbon::now()->subDays($index + 1);
                $booking->updated_at = Carbon::now()->subDays($index + 1);
                $booking->save();
            }

            Payment::firstOrCreate(
                ['transaction_id' => 'SEED-BOOKING-'.str_pad((string) ($index + 1), 3, '0', STR_PAD_LEFT)],
                [
                    'booking_id' => $booking->_id,
                    'user_id' => $customer->_id,
                    'amount' => $booking->payment_status === 'paid' ? $booking->total_price : $booking->total_price / 2,
                    'method' => 'bank',
                    'payment_scope' => $booking->payment_status === 'paid' ? 'full' : 'deposit',
                    'status' => 'success',
                    'paid_at' => Carbon::now()->subDays($index + 1),
                ]
            );

            $existingSeedLog = ActivityLog::where('user_id', $customer->_id)
                ->where('action', 'seeded_booking_created')
                ->where('module', 'bookings')
                ->where('detail.booking_id', (string) $booking->_id)
                ->first();

            if (! $existingSeedLog) {
                ActivityLog::create([
                    'user_id' => $customer->_id,
                    'action' => 'seeded_booking_created',
                    'module' => 'bookings',
                    'detail' => [
                        'booking_id' => (string) $booking->_id,
                        'tour_id' => (string) $tour->_id,
                    ],
                    'ip_address' => '127.0.0.1',
                    'created_at' => Carbon::now()->subDays($index + 1),
                ]);
            }

            FavoriteTour::firstOrCreate([
                'user_id' => $customer->_id,
                'tour_id' => $tour->_id,
            ]);

            if ($index === 0) {
                SupportTicket::firstOrCreate(
                    [
                        'user_id' => $customer->_id,
                        'booking_id' => $booking->_id,
                        'subject' => 'Cần hỗ trợ thông tin tập trung',
                    ],
                    [
                        'message' => 'Nhờ xác nhận lại giờ tập trung và vật dụng cần chuẩn bị trước chuyến đi.',
                        'status' => 'answered',
                        'reply' => 'Vui lòng có mặt trước giờ khởi hành 30 phút và mang theo CCCD hoặc hộ chiếu bản gốc.',
                    ]
                );
            }

            if ($index === 1) {
                RefundRequest::firstOrCreate(
                    [
                        'user_id' => $customer->_id,
                        'booking_id' => $booking->_id,
                    ],
                    [
                        'reason' => 'Tôi cần dời kế hoạch cá nhân nên muốn được hỗ trợ hoàn tiền cho booking này.',
                        'amount_requested' => $booking->total_price,
                        'status' => 'pending',
                        'admin_note' => null,
                    ]
                );
            }
        }

        if (isset($partnerUser, $partnerProfile) && $partnerUser && $partnerProfile) {
            $demoTourBlueprints = [
                [
                    'slug' => 'bien-my-khe-nghi-duong',
                    'title' => 'Biển Mỹ Khê nghỉ dưỡng',
                    'destination' => 'Đà Nẵng',
                    'category' => 'Biển',
                    'price_per_person' => 3500000,
                    'departure_date' => Carbon::now()->addDays(8),
                    'available_slots' => 18,
                ],
                [
                    'slug' => 'da-nang-resort-tron-goi',
                    'title' => 'Đà Nẵng resort trọn gói',
                    'destination' => 'Đà Nẵng',
                    'category' => 'Resort',
                    'price_per_person' => 4250000,
                    'departure_date' => Carbon::now()->addDays(12),
                    'available_slots' => 16,
                ],
                [
                    'slug' => 'hoi-an-van-hoa-ket-hop',
                    'title' => 'Hội An văn hóa kết hợp',
                    'destination' => 'Hội An',
                    'category' => 'Văn hóa',
                    'price_per_person' => 5750000,
                    'departure_date' => Carbon::now()->addDays(15),
                    'available_slots' => 20,
                ],
            ];

            $demoTours = collect();
            foreach ($demoTourBlueprints as $index => $blueprint) {
                $demoTours->push(Tour::updateOrCreate(
                    ['slug' => $blueprint['slug']],
                    [
                        'title' => $blueprint['title'],
                        'description' => 'Tour demo phục vụ dashboard đối tác với số liệu cụ thể.',
                        'destination' => $blueprint['destination'],
                        'category' => $blueprint['category'],
                        'duration_days' => 3 + $index,
                        'max_pax' => 20 + ($index * 2),
                        'price_per_person' => $blueprint['price_per_person'],
                        'images' => [
                            'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                        ],
                        'highlights' => [
                            'Số liệu thật cho trang tổng quan đối tác',
                            'Tương thích với dữ liệu booking và payment',
                        ],
                        'destination_overview' => 'Tour mẫu dành cho partner dashboard.',
                        'historical_background' => 'Dữ liệu demo được tạo để hiển thị số liệu cụ thể.',
                        'local_culture' => ['Ẩm thực địa phương', 'Trải nghiệm nghỉ dưỡng', 'Di chuyển linh hoạt'],
                        'best_time_to_visit' => 'Quanh năm',
                        'weather_notes' => 'Phù hợp cho màn hình demo và kiểm thử nội bộ.',
                        'included_services' => ['Xe đưa đón', 'Lưu trú', 'Hướng dẫn viên'],
                        'excluded_services' => ['Chi tiêu cá nhân'],
                        'suitable_for' => ['Gia đình', 'Nhóm bạn'],
                        'travel_tips' => ['Đặt sớm để giữ chỗ'],
                        'meeting_point' => 'Điểm đón theo xác nhận',
                        'itinerary' => [
                            ['day' => 1, 'title' => 'Khởi hành', 'description' => 'Đón khách và bắt đầu hành trình demo.'],
                            ['day' => 2, 'title' => 'Trải nghiệm chính', 'description' => 'Tham quan và sử dụng dịch vụ đối tác.'],
                            ['day' => 3, 'title' => 'Kết thúc', 'description' => 'Tổng kết và tiễn khách.'],
                        ],
                        'status' => 'approved',
                        'approved_at' => Carbon::now()->subDays(10 + $index),
                        'created_by' => $creator?->_id,
                        'assigned_guide_id' => $guideUsers->isNotEmpty() ? $guideUsers[$index % $guideUsers->count()]->_id : null,
                        'linked_partner_ids' => [(string) $partnerProfile->_id],
                        'departures' => [
                            [
                                'date' => $blueprint['departure_date']->toDateString(),
                                'available_slots' => $blueprint['available_slots'],
                                'price_override' => null,
                                'status' => 'active',
                                'assigned_guide_id' => $guideUsers->isNotEmpty() ? $guideUsers[$index % $guideUsers->count()]->_id : null,
                            ],
                        ],
                    ]
                ));
            }

            $demoServices = [
                [
                    'name' => 'Phòng Deluxe hướng biển',
                    'service_category' => 'hotel',
                    'price' => 1450000,
                    'unit' => 'phòng/đêm',
                    'available_quantity' => 12,
                    'pricing_note' => 'Áp dụng cuối tuần tăng 12%',
                    'status' => 'active',
                ],
                [
                    'name' => 'Gói buffet sáng & đưa đón',
                    'service_category' => 'hotel',
                    'price' => 350000,
                    'unit' => 'khách',
                    'available_quantity' => 40,
                    'pricing_note' => 'Bao gồm 2 chiều đưa đón sân bay',
                    'status' => 'active',
                ],
                [
                    'name' => 'Dịch vụ spa thư giãn',
                    'service_category' => 'spa',
                    'price' => 650000,
                    'unit' => 'lần',
                    'available_quantity' => 8,
                    'pricing_note' => 'Giảm giá cho khách lưu trú từ 2 đêm',
                    'status' => 'inactive',
                ],
            ];

            foreach ($demoServices as $serviceIndex => $serviceData) {
                PartnerService::updateOrCreate(
                    [
                        'partner_id' => $partnerProfile->_id,
                        'name' => $serviceData['name'],
                    ],
                    [
                        'service_category' => $serviceData['service_category'],
                        'price' => $serviceData['price'],
                        'unit' => $serviceData['unit'],
                        'available_quantity' => $serviceData['available_quantity'],
                        'pricing_note' => $serviceData['pricing_note'],
                        'status' => $serviceData['status'],
                    ]
                );
            }

            $demoCustomers = $customers->values();
            $demoBookings = [
                [
                    'note' => 'DEMO-PARTNER-BOOKING-01',
                    'tour' => $demoTours[0],
                    'customer' => $demoCustomers[0] ?? null,
                    'num_pax' => 2,
                    'total_price' => 7000000,
                    'status' => 'confirmed',
                    'payment_status' => 'partial',
                    'payment_amount' => 3500000,
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(0),
                ],
                [
                    'note' => 'DEMO-PARTNER-BOOKING-02',
                    'tour' => $demoTours[1],
                    'customer' => $demoCustomers[1] ?? null,
                    'num_pax' => 2,
                    'total_price' => 4250000,
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'payment_amount' => 4250000,
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(1),
                ],
                [
                    'note' => 'DEMO-PARTNER-BOOKING-03',
                    'tour' => $demoTours[2],
                    'customer' => $demoCustomers[2] ?? null,
                    'num_pax' => 1,
                    'total_price' => 5500000,
                    'status' => 'confirmed',
                    'payment_status' => 'partial',
                    'payment_amount' => 2750000,
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(2),
                ],
                [
                    'note' => 'DEMO-PARTNER-BOOKING-04',
                    'tour' => $demoTours[0],
                    'customer' => $demoCustomers[3] ?? $demoCustomers[0] ?? null,
                    'num_pax' => 3,
                    'total_price' => 5000000,
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'payment_amount' => 5000000,
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(3),
                ],
                [
                    'note' => 'DEMO-PARTNER-BOOKING-05',
                    'tour' => $demoTours[1],
                    'customer' => $demoCustomers[0] ?? null,
                    'num_pax' => 1,
                    'total_price' => 3250000,
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'payment_amount' => 3250000,
                    'paid_at' => Carbon::now()->startOfMonth()->addDays(4),
                ],
            ];

            foreach ($demoBookings as $bookingIndex => $bookingData) {
                if (! $bookingData['tour'] || ! $bookingData['customer']) {
                    continue;
                }

                $booking = Booking::updateOrCreate(
                    ['note' => $bookingData['note']],
                    [
                        'tour_id' => $bookingData['tour']->_id,
                        'user_id' => $bookingData['customer']->_id,
                        'assigned_agent_id' => $agent?->_id,
                        'departure_date' => Carbon::parse($bookingData['tour']->departures[0]['date'] ?? Carbon::now()->addDays($bookingIndex + 7)),
                        'num_pax' => $bookingData['num_pax'],
                        'total_price' => $bookingData['total_price'],
                        'status' => $bookingData['status'],
                        'passengers' => [
                            [
                                'name' => $bookingData['customer']->name,
                                'dob' => '1995-01-01',
                                'passport' => 'DEMO'.str_pad((string) ($bookingIndex + 1), 6, '0', STR_PAD_LEFT),
                            ],
                        ],
                        'internal_note' => 'Dữ liệu demo cho dashboard đối tác.',
                        'special_requirements' => ['Xác nhận trước giờ khởi hành'],
                        'payment_status' => $bookingData['payment_status'],
                    ]
                );

                Payment::updateOrCreate(
                    ['transaction_id' => $bookingData['note'].'-PAYMENT'],
                    [
                        'booking_id' => $booking->_id,
                        'user_id' => $bookingData['customer']->_id,
                        'amount' => $bookingData['payment_amount'],
                        'method' => 'bank',
                        'payment_scope' => $bookingData['payment_status'] === 'paid' ? 'full' : 'deposit',
                        'status' => 'success',
                        'paid_at' => $bookingData['paid_at'],
                    ]
                );
            }

            $linkedTourCount = Tour::whereNull('deleted_at')
                ->get()
                ->filter(function ($tour) use ($partnerProfile) {
                    return collect($tour->linked_partner_ids ?? [])
                        ->map(fn ($id) => (string) $id)
                        ->contains((string) $partnerProfile->_id);
                })
                ->count();

            $bookingIds = Booking::whereIn('tour_id', $demoTours->pluck('_id')->all())->pluck('_id')->all();
            $paymentCount = count($demoBookings);

            $this->command->info(sprintf(
                'Đã tạo demo đối tác: %d dịch vụ, %d tour liên kết, %d booking, %d payment.',
                PartnerService::where('partner_id', $partnerProfile->_id)->count(),
                $linkedTourCount,
                count($bookingIds),
                $paymentCount
            ));
        }

        $this->command->info('Đã khởi tạo dữ liệu nền và giao dịch mẫu.');
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

        $newsItems = [
            [
                'type' => 'news',
                'title' => 'TravelFlow ra mắt trang Tin tức & Ưu đãi',
                'summary' => 'Khu vực mới giúp khách hàng xem nhanh bài viết và chương trình khuyến mãi theo thời gian thực.',
                'content' => 'TravelFlow vừa bổ sung khu vực Tin tức & Ưu đãi để hiển thị các thông tin cập nhật mới nhất về tour, chương trình sale theo mùa, ưu đãi đặc biệt và các thông báo vận hành quan trọng.',
                'tag' => 'Cập nhật hệ thống',
                'cover_image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(1)->toDateString(),
                'status' => 'published',
            ],
            [
                'type' => 'promotion',
                'title' => 'Sale hè - Giảm 15% cho tour biển chọn lọc',
                'summary' => 'Ưu đãi áp dụng cho các tour biển nổi bật trong tháng, số lượng chỗ có hạn.',
                'content' => 'Chương trình ưu đãi mùa hè áp dụng cho một số tour biển như Đà Nẵng, Quy Nhơn và Phú Quốc. Khách đặt sớm sẽ được giảm 15% trực tiếp trên giá tour và ưu tiên chọn chỗ đẹp.',
                'tag' => 'Ưu đãi hot',
                'cover_image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(2)->toDateString(),
                'status' => 'published',
            ],
            [
                'type' => 'news',
                'title' => 'Tối ưu quy trình phân công hướng dẫn viên',
                'summary' => 'Bộ phận vận hành có thể theo dõi phân công theo ngày khởi hành rõ ràng hơn.',
                'content' => 'Quy trình phân công hướng dẫn viên đã được tối ưu để dễ kiểm tra lịch làm việc, hạn chế trùng lịch và hỗ trợ điều phối tour theo từng ngày khởi hành chính xác hơn.',
                'tag' => 'Vận hành',
                'cover_image' => 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(4)->toDateString(),
                'status' => 'published',
            ],
            [
                'type' => 'promotion',
                'title' => 'Combo gia đình - Tặng thêm 1 bữa tối',
                'summary' => 'Ưu đãi dành cho nhóm gia đình đặt từ 4 người trở lên trên một số tour nghỉ dưỡng.',
                'content' => 'Khách hàng đặt tour theo nhóm gia đình sẽ được tặng thêm một bữa tối trong lịch trình khi đáp ứng điều kiện của chương trình. Đây là ưu đãi phù hợp cho chuyến đi muốn tối ưu chi phí nhưng vẫn giữ trải nghiệm thoải mái.',
                'tag' => 'Combo gia đình',
                'cover_image' => 'https://images.unsplash.com/photo-1515693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(6)->toDateString(),
                'status' => 'published',
            ],
        ];

        foreach ($newsItems as $item) {
            NewsPromotion::firstOrCreate(
                [
                    'type' => $item['type'],
                    'title' => $item['title'],
                ],
                [
                    ...$item,
                    'created_by' => $creator->_id,
                    'updated_by' => $creator->_id,
                    'created_at' => Carbon::now(),
                    'updated_at' => Carbon::now(),
                ]
            );
        }
    }
}
