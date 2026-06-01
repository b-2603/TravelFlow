<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\NewsPromotionResource;
use App\Models\ActivityLog;
use App\Models\NewsPromotion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class NewsPromotionController extends Controller
{
    public function index(Request $request)
    {
        $this->ensureDefaultContent();

        $query = NewsPromotion::query()->with('author')->orderByDesc('published_at')->orderByDesc('created_at');
        $isManager = in_array($request->user()?->role, ['admin', 'tour_manager'], true);

        if ($request->filled('type')) {
            $query->where('type', $request->string('type')->toString());
        }

        if ($request->filled('status') && $isManager) {
            $query->where('status', $request->string('status')->toString());
        } elseif (! $isManager) {
            $query->where('status', 'published');
        }

        $items = $query->paginate(12);

        return $this->apiResponse(true, [
            'items' => NewsPromotionResource::collection($items->getCollection()),
            'pagination' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ], 'Lấy danh sách tin tức và ưu đãi thành công.');
    }

    public function show(Request $request, string $id)
    {
        $this->ensureDefaultContent();

        $item = NewsPromotion::query()->with('author')->find($id);

        if (! $item) {
            return $this->apiResponse(false, null, 'Không tìm thấy nội dung.', 404);
        }

        $isManager = in_array($request->user()?->role, ['admin', 'tour_manager'], true);
        if ($item->status !== 'published' && ! $isManager) {
            return $this->apiResponse(false, null, 'Không tìm thấy nội dung.', 404);
        }

        $updated = false;
        if ($this->backfillItemDetails($item)) {
            $updated = true;
            $item->load('author');
        }

        return $this->apiResponse(true, new NewsPromotionResource($item), $updated ? 'Đã cập nhật và lấy chi tiết tin tức / ưu đãi thành công.' : 'Lấy chi tiết tin tức và ưu đãi thành công.');
    }

    public function store(Request $request)
    {
        $this->authorizeManager($request);

        $this->normalizeStructuredPayload($request);

        $payload = $request->validate([
            'type' => ['required', 'in:news,promotion'],
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'tag' => ['nullable', 'string', 'max:100'],
            'detail_sections' => ['nullable', 'array'],
            'key_highlights' => ['nullable', 'array'],
            'benefits' => ['nullable', 'array'],
            'conditions' => ['nullable', 'array'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'target_audience' => ['nullable', 'array'],
            'applicable_tours' => ['nullable', 'array'],
            'booking_channels' => ['nullable', 'array'],
            'faq' => ['nullable', 'array'],
            'contact_info' => ['nullable', 'array'],
            'related_links' => ['nullable', 'array'],
            'cover_image_file' => ['nullable', 'image', 'max:5120'],
            'cover_image' => ['nullable', 'string', 'max:2048'],
            'published_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:published,draft'],
        ]);

        $coverImage = $payload['cover_image'] ?? null;
        if ($request->hasFile('cover_image_file')) {
            $coverImage = Storage::disk('public')->url(
                $request->file('cover_image_file')->store('news-promotions', 'public')
            );
        }

        $item = NewsPromotion::create([
            ...collect($payload)->except(['cover_image_file', 'cover_image'])->all(),
            'tag' => $payload['tag'] ?? ($payload['type'] === 'promotion' ? 'Ưu đãi' : 'Tin tức'),
            'detail_sections' => $payload['detail_sections'] ?? [],
            'key_highlights' => $payload['key_highlights'] ?? [],
            'benefits' => $payload['benefits'] ?? [],
            'conditions' => $payload['conditions'] ?? [],
            'valid_from' => $payload['valid_from'] ?? null,
            'valid_until' => $payload['valid_until'] ?? null,
            'target_audience' => $payload['target_audience'] ?? [],
            'applicable_tours' => $payload['applicable_tours'] ?? [],
            'booking_channels' => $payload['booking_channels'] ?? [],
            'faq' => $payload['faq'] ?? [],
            'contact_info' => $payload['contact_info'] ?? [],
            'related_links' => $payload['related_links'] ?? [],
            'cover_image' => $coverImage,
            'status' => $payload['status'] ?? 'published',
            'published_at' => $payload['published_at'] ?? Carbon::now()->toDateString(),
            'created_by' => $request->user()->_id,
            'updated_by' => $request->user()->_id,
            'created_at' => Carbon::now(),
            'updated_at' => Carbon::now(),
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'news_promotion_created',
            'module' => 'content',
            'detail' => [
                'id' => (string) $item->_id,
                'type' => $item->type,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new NewsPromotionResource($item->load('author')), 'Tạo tin tức / ưu đãi thành công.', 201);
    }

    public function update(Request $request, string $id)
    {
        $this->authorizeManager($request);

        $this->normalizeStructuredPayload($request);

        $item = NewsPromotion::find($id);
        if (! $item) {
            return $this->apiResponse(false, null, 'Không tìm thấy nội dung.', 404);
        }

        $payload = $request->validate([
            'type' => ['required', 'in:news,promotion'],
            'title' => ['required', 'string', 'max:255'],
            'summary' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string'],
            'tag' => ['nullable', 'string', 'max:100'],
            'detail_sections' => ['nullable', 'array'],
            'key_highlights' => ['nullable', 'array'],
            'benefits' => ['nullable', 'array'],
            'conditions' => ['nullable', 'array'],
            'valid_from' => ['nullable', 'date'],
            'valid_until' => ['nullable', 'date'],
            'target_audience' => ['nullable', 'array'],
            'applicable_tours' => ['nullable', 'array'],
            'booking_channels' => ['nullable', 'array'],
            'faq' => ['nullable', 'array'],
            'contact_info' => ['nullable', 'array'],
            'related_links' => ['nullable', 'array'],
            'cover_image_file' => ['nullable', 'image', 'max:5120'],
            'cover_image' => ['nullable', 'string', 'max:2048'],
            'published_at' => ['nullable', 'date'],
            'status' => ['nullable', 'in:published,draft'],
        ]);

        $coverImage = $payload['cover_image'] ?? $item->cover_image;
        if ($request->hasFile('cover_image_file')) {
            $coverImage = Storage::disk('public')->url(
                $request->file('cover_image_file')->store('news-promotions', 'public')
            );
        }

        $item->fill([
            ...collect($payload)->except(['cover_image_file', 'cover_image'])->all(),
            'tag' => $payload['tag'] ?? ($payload['type'] === 'promotion' ? 'Ưu đãi' : 'Tin tức'),
            'detail_sections' => $payload['detail_sections'] ?? [],
            'key_highlights' => $payload['key_highlights'] ?? [],
            'benefits' => $payload['benefits'] ?? [],
            'conditions' => $payload['conditions'] ?? [],
            'valid_from' => $payload['valid_from'] ?? null,
            'valid_until' => $payload['valid_until'] ?? null,
            'target_audience' => $payload['target_audience'] ?? [],
            'applicable_tours' => $payload['applicable_tours'] ?? [],
            'booking_channels' => $payload['booking_channels'] ?? [],
            'faq' => $payload['faq'] ?? [],
            'contact_info' => $payload['contact_info'] ?? [],
            'related_links' => $payload['related_links'] ?? [],
            'cover_image' => $coverImage,
            'status' => $payload['status'] ?? 'published',
            'published_at' => $payload['published_at'] ?? Carbon::now()->toDateString(),
            'updated_by' => $request->user()->_id,
            'updated_at' => Carbon::now(),
        ]);
        $item->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'news_promotion_updated',
            'module' => 'content',
            'detail' => [
                'id' => (string) $item->_id,
                'type' => $item->type,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new NewsPromotionResource($item->load('author')), 'Cập nhật tin tức / ưu đãi thành công.');
    }

    public function destroy(Request $request, string $id)
    {
        $this->authorizeManager($request);

        $item = NewsPromotion::find($id);
        if (! $item) {
            return $this->apiResponse(false, null, 'Không tìm thấy nội dung.', 404);
        }

        $item->delete();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'news_promotion_deleted',
            'module' => 'content',
            'detail' => [
                'id' => (string) $item->_id,
                'type' => $item->type,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, null, 'Xóa tin tức / ưu đãi thành công.');
    }

    private function authorizeManager(Request $request): void
    {
        if (! in_array($request->user()?->role, ['admin', 'tour_manager'], true)) {
            abort(403, 'Forbidden.');
        }
    }

    private function ensureDefaultContent(): void
    {
        if (NewsPromotion::count() > 0) {
            return;
        }

        $creatorId = User::where('role', 'admin')->value('_id')
            ?? User::where('role', 'tour_manager')->value('_id');

        $defaults = [
            [
                'type' => 'news',
                'title' => 'TravelFlow ra mắt trang Tin tức & Ưu đãi',
                'summary' => 'Khu vực mới giúp khách hàng xem nhanh bài viết và khuyến mãi theo thời gian thực.',
                'content' => 'TravelFlow vừa bổ sung khu vực Tin tức & Ưu đãi để hiển thị các thông tin cập nhật mới nhất về tour, chương trình sale theo mùa, ưu đãi đặc biệt và các thông báo vận hành quan trọng.',
                'tag' => 'Cập nhật hệ thống',
                'detail_sections' => [
                    ['title' => 'Mục tiêu của chuyên mục', 'content' => 'Giúp khách hàng theo dõi tin tức du lịch, chương trình giảm giá và các cập nhật vận hành ở một nơi duy nhất.'],
                    ['title' => 'Cách sử dụng', 'content' => 'Người dùng mở trang và bấm vào từng bài để xem đầy đủ thông tin chi tiết.'],
                ],
                'key_highlights' => ['Cập nhật theo thời gian thực', 'Có phân loại Tin tức và Ưu đãi', 'Trang chi tiết rõ ràng'],
                'benefits' => ['Xem nhanh nội dung mới nhất', 'Dễ chọn tour phù hợp', 'Không bỏ lỡ khuyến mãi'],
                'conditions' => ['Nội dung được duyệt bởi quản trị viên hoặc quản lý tour', 'Một số ưu đãi có giới hạn thời gian'],
                'valid_from' => Carbon::now()->subDays(1)->toDateString(),
                'valid_until' => Carbon::now()->addMonths(6)->toDateString(),
                'target_audience' => ['Khách hàng', 'Đại lý', 'Nhân viên vận hành'],
                'applicable_tours' => ['Tất cả tour đang mở bán'],
                'booking_channels' => ['Website TravelFlow', 'Bộ phận tư vấn'],
                'faq' => [
                    ['question' => 'Tôi xem tin ở đâu?', 'answer' => 'Tại mục Tin tức & Ưu đãi trên thanh điều hướng.'],
                    ['question' => 'Dữ liệu có lưu thật không?', 'answer' => 'Có, toàn bộ nội dung được lưu trong MongoDB collection news_promotions.'],
                ],
                'contact_info' => ['hotline' => '1900 6868', 'email' => 'hello@travelflow.local'],
                'related_links' => [
                    ['label' => 'Xem tour', 'url' => '/tours'],
                    ['label' => 'Giới thiệu', 'url' => '/about'],
                ],
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
                'detail_sections' => [
                    ['title' => 'Ưu đãi áp dụng cho', 'content' => 'Các tour biển đang mở bán gồm Đà Nẵng, Quy Nhơn và Phú Quốc.'],
                    ['title' => 'Giá trị khuyến mãi', 'content' => 'Giảm 15% trực tiếp trên giá tour, áp dụng cho đơn hợp lệ trong thời gian chương trình.'],
                    ['title' => 'Cách nhận ưu đãi', 'content' => 'Đặt tour sớm và hoàn tất xác nhận theo hướng dẫn của tư vấn viên.'],
                ],
                'key_highlights' => ['Giảm 15%', 'Áp dụng tour biển', 'Số lượng có hạn'],
                'benefits' => ['Tiết kiệm chi phí', 'Ưu tiên chỗ đẹp', 'Dễ chốt tour sớm'],
                'conditions' => ['Áp dụng cho booking mới', 'Không cộng dồn với ưu đãi khác nếu không ghi rõ', 'Tuân theo thời hạn chương trình'],
                'valid_from' => Carbon::now()->subDays(2)->toDateString(),
                'valid_until' => Carbon::now()->addDays(20)->toDateString(),
                'target_audience' => ['Khách lẻ', 'Gia đình', 'Nhóm bạn'],
                'applicable_tours' => ['Đà Nẵng', 'Quy Nhơn', 'Phú Quốc'],
                'booking_channels' => ['Website TravelFlow', 'Hotline', 'Tư vấn viên'],
                'faq' => [
                    ['question' => 'Có áp dụng mọi ngày không?', 'answer' => 'Áp dụng trong khung thời gian chương trình và tùy tồn chỗ.'],
                    ['question' => 'Tôi phải làm gì để nhận ưu đãi?', 'answer' => 'Đặt tour và xác nhận theo hướng dẫn của bộ phận tư vấn.'],
                ],
                'contact_info' => ['hotline' => '1900 6868', 'email' => 'promo@travelflow.local'],
                'related_links' => [
                    ['label' => 'Danh sách tour biển', 'url' => '/tours?category=bien'],
                ],
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
                'detail_sections' => [
                    ['title' => 'Điểm mới', 'content' => 'Quản trị viên và quản lý tour nhìn thấy lịch phân công rõ hơn theo từng ngày.'],
                    ['title' => 'Lợi ích vận hành', 'content' => 'Giảm trùng lịch, dễ theo dõi trạng thái và hỗ trợ điều phối nhanh hơn.'],
                ],
                'key_highlights' => ['Trùng lịch giảm', 'Dễ điều phối', 'Theo dõi theo ngày'],
                'benefits' => ['Tiết kiệm thời gian', 'Quản lý tập trung', 'Đồng bộ đội ngũ'],
                'conditions' => ['Chỉ áp dụng cho tài khoản có quyền quản trị'], 
                'valid_from' => Carbon::now()->subDays(4)->toDateString(),
                'valid_until' => Carbon::now()->addMonths(3)->toDateString(),
                'target_audience' => ['Admin', 'Tour manager', 'Điều hành tour'],
                'applicable_tours' => ['Tất cả tour đang vận hành'],
                'booking_channels' => ['Hệ thống nội bộ'],
                'faq' => [
                    ['question' => 'Ai xem được mục này?', 'answer' => 'Nhân sự có quyền quản trị hoặc quản lý tour.'],
                ],
                'contact_info' => ['email' => 'ops@travelflow.local'],
                'related_links' => [],
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
                'detail_sections' => [
                    ['title' => 'Nội dung ưu đãi', 'content' => 'Tặng thêm 1 bữa tối trong lịch trình cho nhóm gia đình từ 4 khách trở lên.'],
                    ['title' => 'Phù hợp với', 'content' => 'Gia đình nhiều thế hệ, nhóm có trẻ em và khách muốn lịch trình nhẹ nhàng.'],
                    ['title' => 'Lưu ý', 'content' => 'Cần xác nhận điều kiện áp dụng cùng tư vấn viên trước khi chốt booking.'],
                ],
                'key_highlights' => ['Tặng 1 bữa tối', 'Nhóm từ 4 khách', 'Dành cho gia đình'],
                'benefits' => ['Tối ưu chi phí', 'Gia tăng trải nghiệm', 'Phù hợp nhóm gia đình'],
                'conditions' => ['Nhóm từ 4 khách trở lên', 'Áp dụng cho một số tour nghỉ dưỡng', 'Không quy đổi sang tiền mặt'],
                'valid_from' => Carbon::now()->subDays(6)->toDateString(),
                'valid_until' => Carbon::now()->addDays(30)->toDateString(),
                'target_audience' => ['Gia đình', 'Nhóm nhiều thế hệ'],
                'applicable_tours' => ['Một số tour nghỉ dưỡng được chọn'],
                'booking_channels' => ['Website', 'Tư vấn viên'],
                'faq' => [
                    ['question' => 'Có áp dụng cho mọi tour không?', 'answer' => 'Không, chỉ áp dụng cho danh sách tour nghỉ dưỡng được chọn.'],
                    ['question' => 'Tôi cần đặt tối thiểu bao nhiêu người?', 'answer' => 'Từ 4 khách trở lên.'],
                ],
                'contact_info' => ['hotline' => '1900 6868', 'email' => 'family@travelflow.local'],
                'related_links' => [
                    ['label' => 'Tour nghỉ dưỡng', 'url' => '/tours?category=resort'],
                ],
                'cover_image' => 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(6)->toDateString(),
                'status' => 'published',
            ],
        ];

        foreach ($defaults as $item) {
            $existing = NewsPromotion::query()
                ->where('type', $item['type'])
                ->where('title', $item['title'])
                ->first();

            $attributes = [
                ...$item,
                'created_by' => $creatorId,
                'updated_by' => $creatorId,
                'updated_at' => Carbon::now(),
            ];

            if ($existing) {
                $existing->fill($attributes);
                $existing->save();
                continue;
            }

            NewsPromotion::create([
                ...$attributes,
                'created_at' => Carbon::now(),
            ]);
        }
    }

    private function normalizeStructuredPayload(Request $request): void
    {
        foreach ([
            'detail_sections',
            'key_highlights',
            'benefits',
            'conditions',
            'target_audience',
            'applicable_tours',
            'booking_channels',
            'faq',
            'related_links',
        ] as $key) {
            $value = $request->input($key);
            if (is_string($value) && $value !== '') {
                $decoded = json_decode($value, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $request->merge([$key => $decoded]);
                }
            }
        }

        $contactInfo = $request->input('contact_info');
        if (is_string($contactInfo) && $contactInfo !== '') {
            $decoded = json_decode($contactInfo, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $request->merge(['contact_info' => $decoded]);
            }
        }
    }

    private function backfillItemDetails(NewsPromotion $item): bool
    {
        $template = collect($this->defaultContentTemplates())->firstWhere('title', $item->title);
        if (! $template) {
            $template = collect($this->defaultContentTemplates())->firstWhere('type', $item->type);
        }

        if (! $template) {
            return false;
        }

        $changes = [];
        foreach ([
            'detail_sections',
            'key_highlights',
            'benefits',
            'conditions',
            'valid_from',
            'valid_until',
            'target_audience',
            'applicable_tours',
            'booking_channels',
            'faq',
            'contact_info',
            'related_links',
            'cover_image',
            'tag',
            'summary',
            'content',
            'published_at',
        ] as $field) {
            $current = $item->{$field} ?? null;
            if (blank($current)) {
                $changes[$field] = $template[$field] ?? $current;
            }
        }

        if (empty($changes)) {
            return false;
        }

        $changes['updated_by'] = $item->updated_by ?: $item->created_by;
        $changes['updated_at'] = Carbon::now();
        $item->fill($changes);
        $item->save();

        return true;
    }

    private function defaultContentTemplates(): array
    {
        return [
            [
                'type' => 'news',
                'title' => 'TravelFlow ra mắt trang Tin tức & Ưu đãi',
                'summary' => 'Khu vực mới giúp khách hàng xem nhanh bài viết và khuyến mãi theo thời gian thực.',
                'content' => 'TravelFlow vừa bổ sung khu vực Tin tức & Ưu đãi để hiển thị các thông tin cập nhật mới nhất về tour, chương trình sale theo mùa, ưu đãi đặc biệt và các thông báo vận hành quan trọng.',
                'tag' => 'Cập nhật hệ thống',
                'detail_sections' => [
                    ['title' => 'Mục tiêu của chuyên mục', 'content' => 'Giúp khách hàng theo dõi tin tức du lịch, chương trình giảm giá và các cập nhật vận hành ở một nơi duy nhất.'],
                    ['title' => 'Cách sử dụng', 'content' => 'Người dùng mở trang và bấm vào từng bài để xem đầy đủ thông tin chi tiết.'],
                ],
                'key_highlights' => ['Cập nhật theo thời gian thực', 'Có phân loại Tin tức và Ưu đãi', 'Trang chi tiết rõ ràng'],
                'benefits' => ['Xem nhanh nội dung mới nhất', 'Dễ chọn tour phù hợp', 'Không bỏ lỡ khuyến mãi'],
                'conditions' => ['Nội dung được duyệt bởi quản trị viên hoặc quản lý tour', 'Một số ưu đãi có giới hạn thời gian'],
                'valid_from' => Carbon::now()->subDays(1)->toDateString(),
                'valid_until' => Carbon::now()->addMonths(6)->toDateString(),
                'target_audience' => ['Khách hàng', 'Đại lý', 'Nhân viên vận hành'],
                'applicable_tours' => ['Tất cả tour đang mở bán'],
                'booking_channels' => ['Website TravelFlow', 'Bộ phận tư vấn'],
                'faq' => [
                    ['question' => 'Tôi xem tin ở đâu?', 'answer' => 'Tại mục Tin tức & Ưu đãi trên thanh điều hướng.'],
                    ['question' => 'Dữ liệu có lưu thật không?', 'answer' => 'Có, toàn bộ nội dung được lưu trong MongoDB collection news_promotions.'],
                ],
                'contact_info' => ['hotline' => '1900 6868', 'email' => 'hello@travelflow.local'],
                'related_links' => [
                    ['label' => 'Xem tour', 'url' => '/tours'],
                    ['label' => 'Giới thiệu', 'url' => '/about'],
                ],
                'cover_image' => 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(1)->toDateString(),
            ],
            [
                'type' => 'promotion',
                'title' => 'Sale hè - Giảm 15% cho tour biển chọn lọc',
                'summary' => 'Ưu đãi áp dụng cho các tour biển nổi bật trong tháng, số lượng chỗ có hạn.',
                'content' => 'Chương trình ưu đãi mùa hè áp dụng cho một số tour biển như Đà Nẵng, Quy Nhơn và Phú Quốc. Khách đặt sớm sẽ được giảm 15% trực tiếp trên giá tour và ưu tiên chọn chỗ đẹp.',
                'tag' => 'Ưu đãi hot',
                'detail_sections' => [
                    ['title' => 'Ưu đãi áp dụng cho', 'content' => 'Các tour biển đang mở bán gồm Đà Nẵng, Quy Nhơn và Phú Quốc.'],
                    ['title' => 'Giá trị khuyến mãi', 'content' => 'Giảm 15% trực tiếp trên giá tour, áp dụng cho đơn hợp lệ trong thời gian chương trình.'],
                    ['title' => 'Cách nhận ưu đãi', 'content' => 'Đặt tour sớm và hoàn tất xác nhận theo hướng dẫn của tư vấn viên.'],
                ],
                'key_highlights' => ['Giảm 15%', 'Áp dụng tour biển', 'Số lượng có hạn'],
                'benefits' => ['Tiết kiệm chi phí', 'Ưu tiên chỗ đẹp', 'Dễ chốt tour sớm'],
                'conditions' => ['Áp dụng cho booking mới', 'Không cộng dồn với ưu đãi khác nếu không ghi rõ', 'Tuân theo thời hạn chương trình'],
                'valid_from' => Carbon::now()->subDays(2)->toDateString(),
                'valid_until' => Carbon::now()->addDays(20)->toDateString(),
                'target_audience' => ['Khách lẻ', 'Gia đình', 'Nhóm bạn'],
                'applicable_tours' => ['Đà Nẵng', 'Quy Nhơn', 'Phú Quốc'],
                'booking_channels' => ['Website TravelFlow', 'Hotline', 'Tư vấn viên'],
                'faq' => [
                    ['question' => 'Có áp dụng mọi ngày không?', 'answer' => 'Áp dụng trong khung thời gian chương trình và tùy tồn chỗ.'],
                    ['question' => 'Tôi phải làm gì để nhận ưu đãi?', 'answer' => 'Đặt tour và xác nhận theo hướng dẫn của bộ phận tư vấn.'],
                ],
                'contact_info' => ['hotline' => '1900 6868', 'email' => 'promo@travelflow.local'],
                'related_links' => [
                    ['label' => 'Danh sách tour biển', 'url' => '/tours?category=bien'],
                ],
                'cover_image' => 'https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(2)->toDateString(),
            ],
            [
                'type' => 'news',
                'title' => 'Tối ưu quy trình phân công hướng dẫn viên',
                'summary' => 'Bộ phận vận hành có thể theo dõi phân công theo ngày khởi hành rõ ràng hơn.',
                'content' => 'Quy trình phân công hướng dẫn viên đã được tối ưu để dễ kiểm tra lịch làm việc, hạn chế trùng lịch và hỗ trợ điều phối tour theo từng ngày khởi hành chính xác hơn.',
                'tag' => 'Vận hành',
                'detail_sections' => [
                    ['title' => 'Điểm mới', 'content' => 'Quản trị viên và quản lý tour nhìn thấy lịch phân công rõ hơn theo từng ngày.'],
                    ['title' => 'Lợi ích vận hành', 'content' => 'Giảm trùng lịch, dễ theo dõi trạng thái và hỗ trợ điều phối nhanh hơn.'],
                ],
                'key_highlights' => ['Trùng lịch giảm', 'Dễ điều phối', 'Theo dõi theo ngày'],
                'benefits' => ['Tiết kiệm thời gian', 'Quản lý tập trung', 'Đồng bộ đội ngũ'],
                'conditions' => ['Chỉ áp dụng cho tài khoản có quyền quản trị'],
                'valid_from' => Carbon::now()->subDays(4)->toDateString(),
                'valid_until' => Carbon::now()->addMonths(3)->toDateString(),
                'target_audience' => ['Admin', 'Tour manager', 'Điều hành tour'],
                'applicable_tours' => ['Tất cả tour đang vận hành'],
                'booking_channels' => ['Hệ thống nội bộ'],
                'faq' => [
                    ['question' => 'Ai xem được mục này?', 'answer' => 'Nhân sự có quyền quản trị hoặc quản lý tour.'],
                ],
                'contact_info' => ['email' => 'ops@travelflow.local'],
                'related_links' => [],
                'cover_image' => 'https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(4)->toDateString(),
            ],
            [
                'type' => 'promotion',
                'title' => 'Combo gia đình - Tặng thêm 1 bữa tối',
                'summary' => 'Ưu đãi dành cho nhóm gia đình đặt từ 4 người trở lên trên một số tour nghỉ dưỡng.',
                'content' => 'Khách hàng đặt tour theo nhóm gia đình sẽ được tặng thêm một bữa tối trong lịch trình khi đáp ứng điều kiện của chương trình. Đây là ưu đãi phù hợp cho chuyến đi muốn tối ưu chi phí nhưng vẫn giữ trải nghiệm thoải mái.',
                'tag' => 'Combo gia đình',
                'detail_sections' => [
                    ['title' => 'Nội dung ưu đãi', 'content' => 'Tặng thêm 1 bữa tối trong lịch trình cho nhóm gia đình từ 4 khách trở lên.'],
                    ['title' => 'Phù hợp với', 'content' => 'Gia đình nhiều thế hệ, nhóm có trẻ em và khách muốn lịch trình nhẹ nhàng.'],
                    ['title' => 'Lưu ý', 'content' => 'Cần xác nhận điều kiện áp dụng cùng tư vấn viên trước khi chốt booking.'],
                ],
                'key_highlights' => ['Tặng 1 bữa tối', 'Nhóm từ 4 khách', 'Dành cho gia đình'],
                'benefits' => ['Tối ưu chi phí', 'Gia tăng trải nghiệm', 'Phù hợp nhóm gia đình'],
                'conditions' => ['Nhóm từ 4 khách trở lên', 'Áp dụng cho một số tour nghỉ dưỡng', 'Không quy đổi sang tiền mặt'],
                'valid_from' => Carbon::now()->subDays(6)->toDateString(),
                'valid_until' => Carbon::now()->addDays(30)->toDateString(),
                'target_audience' => ['Gia đình', 'Nhóm nhiều thế hệ'],
                'applicable_tours' => ['Một số tour nghỉ dưỡng được chọn'],
                'booking_channels' => ['Website', 'Tư vấn viên'],
                'faq' => [
                    ['question' => 'Có áp dụng cho mọi tour không?', 'answer' => 'Không, chỉ áp dụng cho danh sách tour nghỉ dưỡng được chọn.'],
                    ['question' => 'Tôi cần đặt tối thiểu bao nhiêu người?', 'answer' => 'Từ 4 khách trở lên.'],
                ],
                'contact_info' => ['hotline' => '1900 6868', 'email' => 'family@travelflow.local'],
                'related_links' => [
                    ['label' => 'Tour nghỉ dưỡng', 'url' => '/tours?category=resort'],
                ],
                'cover_image' => 'https://images.unsplash.com/photo-1515693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80',
                'published_at' => Carbon::now()->subDays(6)->toDateString(),
            ],
        ];
    }
}
