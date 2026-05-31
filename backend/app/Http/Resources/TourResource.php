<?php

namespace App\Http\Resources;

use App\Models\Booking;
use App\Models\Partner;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TourResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $linkedPartnerIds = collect($this->linked_partner_ids ?? [])
            ->filter()
            ->map(fn ($id) => (string) $id)
            ->values();

        $linkedPartners = $linkedPartnerIds->isEmpty()
            ? collect()
            : Partner::whereIn('_id', $linkedPartnerIds->all())->get(['_id', 'company_name', 'service_type']);

        $bookedPax = Booking::where('tour_id', $this->_id)
            ->whereIn('status', ['pending', 'confirmed', 'completed'])
            ->sum('num_pax');

        $availableSlots = collect($this->departures ?? [])->sum(fn ($departure) => (int) ($departure['available_slots'] ?? 0));
        $capacity = $bookedPax + $availableSlots;
        $fillRate = $capacity > 0 ? round(($bookedPax / $capacity) * 100, 2) : 0;

        return [
            'id' => (string) $this->_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'destination' => $this->destination,
            'category' => $this->category,
            'pinned' => (bool) ($this->pinned ?? false),
            'duration_days' => $this->duration_days,
            'max_pax' => $this->max_pax,
            'price_per_person' => $this->price_per_person,
            'promotion_type' => $this->promotion_type ?: 'none',
            'promotion_value' => $this->promotion_value ?: 0,
            'effective_price' => $this->effectivePrice(),
            'images' => $this->normalizeImages(),
            'highlights' => $this->normalizeList($this->highlights) ?: $this->defaultHighlights(),
            'destination_overview' => filled($this->destination_overview) ? $this->destination_overview : $this->defaultDestinationOverview(),
            'historical_background' => filled($this->historical_background) ? $this->historical_background : $this->defaultHistoricalBackground(),
            'local_culture' => $this->normalizeList($this->local_culture) ?: $this->defaultLocalCulture(),
            'best_time_to_visit' => filled($this->best_time_to_visit) ? $this->best_time_to_visit : $this->defaultBestTimeToVisit(),
            'weather_notes' => filled($this->weather_notes) ? $this->weather_notes : $this->defaultWeatherNotes(),
            'included_services' => $this->normalizeList($this->included_services) ?: $this->defaultIncludedServices(),
            'excluded_services' => $this->normalizeList($this->excluded_services) ?: $this->defaultExcludedServices(),
            'suitable_for' => $this->normalizeList($this->suitable_for) ?: $this->defaultSuitableFor(),
            'travel_tips' => $this->normalizeList($this->travel_tips) ?: $this->defaultTravelTips(),
            'meeting_point' => filled($this->meeting_point) ? $this->meeting_point : $this->defaultMeetingPoint(),
            'itinerary' => $this->normalizeItinerary() ?: $this->defaultItinerary(),
            'participation_conditions' => [
                'Mang theo CCCD hoặc hộ chiếu bản gốc khi khởi hành',
                'Có mặt trước giờ khởi hành ít nhất 30 phút',
                'Thông báo sớm nếu có ăn chay hoặc yêu cầu đặc biệt',
                'Trẻ em cần đi cùng người giám hộ hợp lệ',
            ],
            'status' => $this->status,
            'reject_reason' => $this->reject_reason,
            'departures' => collect($this->departures ?? [])->map(function ($departure) {
                return [
                    'date' => $departure['date'] ?? null,
                    'available_slots' => (int) ($departure['available_slots'] ?? 0),
                    'price_override' => $departure['price_override'] ?? null,
                    'status' => $departure['status'] ?? 'active',
                    'assigned_guide_id' => isset($departure['assigned_guide_id']) ? (string) $departure['assigned_guide_id'] : null,
                ];
            })->values()->all(),
            'linked_partner_ids' => $linkedPartnerIds->all(),
            'linked_partners' => $linkedPartners->map(fn ($partner) => [
                'id' => (string) $partner->_id,
                'company_name' => $partner->company_name,
                'service_type' => $partner->service_type,
            ])->values()->all(),
            'summary' => [
                'booked_pax' => (int) $bookedPax,
                'available_slots' => (int) $availableSlots,
                'fill_rate' => $fillRate,
            ],
            'created_by' => $this->created_by ? (string) $this->created_by : null,
            'assigned_guide_id' => $this->assigned_guide_id ? (string) $this->assigned_guide_id : null,
            'creator' => $this->whenLoaded('creator', fn () => [
                'id' => (string) $this->creator->_id,
                'name' => $this->creator->name,
                'email' => $this->creator->email,
            ]),
            'guide' => $this->whenLoaded('guide', fn () => $this->guide ? [
                'id' => (string) $this->guide->_id,
                'name' => $this->guide->name,
                'email' => $this->guide->email,
            ] : null),
            'created_at' => optional($this->created_at)->toISOString(),
            'updated_at' => optional($this->updated_at)->toISOString(),
        ];
    }

    private function effectivePrice(): float
    {
        $basePrice = (float) $this->price_per_person;
        $promotionType = $this->promotion_type ?: 'none';
        $promotionValue = (float) ($this->promotion_value ?: 0);

        return match ($promotionType) {
            'percent' => max(0, $basePrice - (($basePrice * $promotionValue) / 100)),
            'fixed' => max(0, $basePrice - $promotionValue),
            default => $basePrice,
        };
    }

    private function normalizeList($value): array
    {
        return collect($value ?? [])
            ->filter(fn ($item) => is_string($item) && filled(trim($item)))
            ->map(fn ($item) => trim($item))
            ->values()
            ->all();
    }

    private function normalizeImages(): array
    {
        $images = $this->normalizeList($this->images);

        if (! empty($images)) {
            return $images;
        }

        $seed = strtolower(str_replace(' ', '-', trim((string) ($this->slug ?: $this->destination ?: $this->title ?: 'tour'))));

        return [
            "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
            "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80",
        ];
    }

    private function normalizeItinerary(): array
    {
        $itinerary = collect($this->itinerary ?? [])
            ->filter(fn ($item) => is_array($item) && filled($item['title'] ?? null))
            ->map(fn ($item, $index) => [
                'day' => (int) ($item['day'] ?? ($index + 1)),
                'title' => $item['title'],
                'description' => $item['description'] ?? '',
                'image' => $item['image'] ?? null,
            ])
            ->values()
            ->all();

        return $this->looksGenericItinerary($itinerary) ? [] : $itinerary;
    }

    private function defaultHighlights(): array
    {
        return [
            "Lịch trình được thiết kế riêng cho {$this->destination}",
            'Xe đưa đón, khách sạn và hướng dẫn viên được sắp xếp đồng bộ',
            'Điểm đến được chọn lọc theo trải nghiệm thực tế',
            'Phù hợp cho khách muốn tour rõ ràng, dễ theo dõi',
        ];
    }

    private function defaultDestinationOverview(): string
    {
        return filled($this->destination)
            ? "{$this->destination} là điểm đến nổi bật với đặc trưng riêng về cảnh quan, ẩm thực và nhịp sống địa phương, phù hợp cho du khách muốn trải nghiệm thực tế thay vì chỉ tham quan ngắn ngày."
            : 'Điểm đến này được chọn lọc để phù hợp với nhu cầu trải nghiệm, nghỉ dưỡng và tham quan thực tế của du khách.';
    }

    private function defaultHistoricalBackground(): string
    {
        return filled($this->destination)
            ? "Khu vực {$this->destination} gắn với nhiều lớp văn hóa và dấu ấn lịch sử địa phương, từ đời sống cư dân bản địa đến các giai đoạn phát triển du lịch hiện đại."
            : 'Điểm đến này có bối cảnh hình thành gắn với văn hóa và đời sống địa phương đặc trưng.';
    }

    private function defaultLocalCulture(): array
    {
        return [
            'Ẩm thực và phong tục địa phương là điểm nhấn trải nghiệm',
            'Người dân thân thiện, phù hợp cho tour khám phá kết hợp giao lưu',
            'Nhiều hoạt động chụp ảnh, dạo bộ và trải nghiệm đời sống bản địa',
        ];
    }

    private function defaultBestTimeToVisit(): string
    {
        return 'Thời điểm đẹp nhất thường là mùa khô, khi thời tiết ổn định và thuận tiện cho lịch trình ngoài trời.';
    }

    private function defaultWeatherNotes(): string
    {
        return 'Nên theo dõi thời tiết trước ngày đi, mang theo áo khoác mỏng, giày thoải mái và vật dụng cá nhân phù hợp với tuyến tour.';
    }

    private function defaultIncludedServices(): array
    {
        return [
            'Xe du lịch hoặc phương tiện theo lịch trình',
            'Hướng dẫn viên đồng hành',
            'Lưu trú và bữa ăn theo chương trình',
            'Vé tham quan theo nội dung công bố',
        ];
    }

    private function defaultExcludedServices(): array
    {
        return [
            'Vé máy bay / phương tiện di chuyển đến điểm khởi hành',
            'Chi phí cá nhân và các dịch vụ ngoài chương trình',
            'Phụ thu phòng đơn, nâng hạng dịch vụ',
        ];
    }

    private function defaultSuitableFor(): array
    {
        return [
            'Gia đình',
            'Nhóm bạn',
            'Khách thích trải nghiệm thực tế',
        ];
    }

    private function defaultTravelTips(): array
    {
        return [
            'Mang giấy tờ tùy thân còn hiệu lực',
            'Nên có mặt tại điểm tập trung trước giờ khởi hành 30 phút',
            'Chuẩn bị quần áo phù hợp với thời tiết điểm đến',
        ];
    }

    private function defaultMeetingPoint(): string
    {
        return filled($this->destination)
            ? "Điểm đón chính tại {$this->destination}"
            : 'Điểm đón sẽ được thông báo trước khởi hành';
    }

    private function defaultItinerary(): array
    {
        $template = $this->destinationItineraryTemplate();
        $days = max(1, (int) ($this->duration_days ?: 3));

        if (empty($template)) {
            $template = $this->genericItineraryTemplate();
        }

        if (count($template) > $days) {
            return array_slice($template, 0, $days);
        }

        while (count($template) < $days) {
            $day = count($template) + 1;
            $template[] = [
                'day' => $day,
                'title' => $day === $days ? 'Kết thúc và tiễn khách' : 'Trải nghiệm bổ sung',
                'description' => "Tiếp tục khám phá {$this->destination} theo nhịp tour thực tế, kết hợp tham quan, nghỉ ngơi và các trải nghiệm phù hợp với lịch trình.",
            ];
        }

        return $template;
    }

    private function destinationItineraryTemplate(): array
    {
        $key = $this->destinationKey();

        return match ($key) {
            'da-nang' => [
                ['day' => 1, 'title' => 'Đón khách - biển Mỹ Khê', 'description' => 'Đón đoàn, nhận phòng, nghỉ ngơi và tự do dạo biển Mỹ Khê, thưởng thức hải sản địa phương.'],
                ['day' => 2, 'title' => 'Bà Nà Hills - Cầu Vàng', 'description' => 'Di chuyển lên Bà Nà Hills, tham quan Cầu Vàng, làng Pháp và trải nghiệm cáp treo.'],
                ['day' => 3, 'title' => 'Hội An - Ngũ Hành Sơn', 'description' => 'Khám phá Ngũ Hành Sơn, làng đá Non Nước và dạo phố cổ Hội An về đêm.'],
                ['day' => 4, 'title' => 'Mua sắm - tiễn khách', 'description' => 'Thăm chợ địa phương, mua đặc sản và đưa đoàn ra điểm hẹn / sân bay.'],
            ],
            'ha-noi' => [
                ['day' => 1, 'title' => 'Phố cổ - hồ Hoàn Kiếm', 'description' => 'Nhận phòng, dạo phố cổ, tham quan hồ Hoàn Kiếm và thưởng thức ẩm thực đường phố.'],
                ['day' => 2, 'title' => 'Văn Miếu - Bát Tràng', 'description' => 'Tham quan Văn Miếu - Quốc Tử Giám, trải nghiệm làng gốm Bát Tràng và tìm hiểu văn hóa Hà Nội.'],
                ['day' => 3, 'title' => 'Hoàng thành - tiễn khách', 'description' => 'Khám phá Hoàng thành Thăng Long, mua sắm đặc sản và kết thúc chương trình.'],
            ],
            'phu-quoc' => [
                ['day' => 1, 'title' => 'Check-in resort - nghỉ biển', 'description' => 'Đón khách, nhận phòng resort và nghỉ ngơi tự do bên biển.'],
                ['day' => 2, 'title' => 'Hòn Thơm - cáp treo vượt biển', 'description' => 'Trải nghiệm cáp treo, tắm biển, vui chơi và dùng bữa tối hải sản.'],
                ['day' => 3, 'title' => 'Nam đảo - Sunset Town', 'description' => 'Tham quan nhà thùng nước mắm, Sunset Town, chợ đêm và check-in hoàng hôn.'],
                ['day' => 4, 'title' => 'Tự do - tiễn khách', 'description' => 'Nghỉ dưỡng, mua quà lưu niệm và ra sân bay.'],
            ],
            'sa-pa' => [
                ['day' => 1, 'title' => 'Di chuyển lên Sa Pa', 'description' => 'Khởi hành, nhận phòng và dạo thị trấn trong không khí se lạnh.'],
                ['day' => 2, 'title' => 'Fansipan - bản Cát Cát', 'description' => 'Chinh phục Fansipan, tham quan bản Cát Cát và trải nghiệm văn hóa địa phương.'],
                ['day' => 3, 'title' => 'Lao Chải - Tả Van', 'description' => 'Trekking qua thung lũng Mường Hoa, ngắm ruộng bậc thang và làng bản vùng cao.'],
                ['day' => 4, 'title' => 'Chợ Sa Pa - trở về', 'description' => 'Mua đặc sản, trả phòng và kết thúc hành trình.'],
            ],
            'nha-trang' => [
                ['day' => 1, 'title' => 'Biển Nha Trang - nghỉ ngơi', 'description' => 'Đón đoàn, nhận phòng và tự do tắm biển, thư giãn nhẹ nhàng.'],
                ['day' => 2, 'title' => 'VinWonders - cáp treo', 'description' => 'Tham quan khu vui chơi, trải nghiệm cáp treo và show giải trí.'],
                ['day' => 3, 'title' => 'Đảo Hòn Mun - lặn biển', 'description' => 'Di chuyển ra đảo, tắm biển và tham gia các hoạt động dưới nước.'],
                ['day' => 4, 'title' => 'Mua sắm - tiễn khách', 'description' => 'Mua đặc sản, trả phòng và kết thúc tour.'],
            ],
            'hoi-an' => [
                ['day' => 1, 'title' => 'Đến Hội An - dạo phố cổ', 'description' => 'Nhận phòng, dạo phố cổ, chụp hình và thưởng thức món địa phương.'],
                ['day' => 2, 'title' => 'Làng nghề - sông Hoài', 'description' => 'Tham quan làng nghề, trải nghiệm đèn lồng và thuyền trên sông Hoài buổi tối.'],
                ['day' => 3, 'title' => 'Biển An Bàng - tiễn khách', 'description' => 'Tự do nghỉ ngơi tại biển An Bàng, mua quà và trả khách.'],
            ],
            'ha-long' => [
                ['day' => 1, 'title' => 'Cảng tàu - lên du thuyền', 'description' => 'Lên du thuyền, dùng bữa trưa và bắt đầu hành trình qua vịnh.'],
                ['day' => 2, 'title' => 'Hang động - chèo kayak', 'description' => 'Tham quan hang động, chèo kayak và ngắm cảnh vịnh Hạ Long.'],
                ['day' => 3, 'title' => 'Ngắm bình minh - trở về', 'description' => 'Thưởng thức bình minh trên vịnh, trả phòng và trở về đất liền.'],
            ],
            'da-lat' => [
                ['day' => 1, 'title' => 'Đà Lạt trung tâm', 'description' => 'Nhận phòng, tham quan khu trung tâm và thưởng thức cà phê địa phương.'],
                ['day' => 2, 'title' => 'Thung lũng - vườn hoa', 'description' => 'Tham quan đồi chè, vườn hoa và các điểm check-in nổi bật.'],
                ['day' => 3, 'title' => 'Langbiang - chợ đêm', 'description' => 'Khám phá Langbiang, mua sắm và dạo chợ đêm Đà Lạt.'],
                ['day' => 4, 'title' => 'Mua sắm - tiễn khách', 'description' => 'Mua đặc sản, trả phòng và kết thúc chương trình.'],
            ],
            'hue' => [
                ['day' => 1, 'title' => 'Kinh thành Huế', 'description' => 'Nhận phòng, tham quan Kinh thành và các công trình lịch sử.'],
                ['day' => 2, 'title' => 'Lăng tẩm - sông Hương', 'description' => 'Khám phá lăng tẩm triều Nguyễn, thưởng thức ẩm thực Huế.'],
                ['day' => 3, 'title' => 'Chùa Thiên Mụ - tiễn khách', 'description' => 'Tham quan chùa Thiên Mụ, mua quà và kết thúc chuyến đi.'],
            ],
            'quy-nhon' => [
                ['day' => 1, 'title' => 'Quy Nhơn city tour', 'description' => 'Nhận phòng, tham quan thành phố và dùng bữa tối hải sản.'],
                ['day' => 2, 'title' => 'Kỳ Co - Eo Gió', 'description' => 'Di chuyển ra đảo, tắm biển và check-in cảnh đẹp.'],
                ['day' => 3, 'title' => 'Làng chài - chùa cổ', 'description' => 'Khám phá văn hóa địa phương và các điểm tâm linh.'],
                ['day' => 4, 'title' => 'Mua quà - tiễn khách', 'description' => 'Tự do mua đặc sản và trả khách.'],
            ],
            'can-tho' => [
                ['day' => 1, 'title' => 'Bến Ninh Kiều', 'description' => 'Nhận phòng, tham quan bến Ninh Kiều và dùng bữa tối.'],
                ['day' => 2, 'title' => 'Chợ nổi Cái Răng', 'description' => 'Đi chợ nổi sáng sớm, tham quan vườn trái cây và làng nghề.'],
                ['day' => 3, 'title' => 'Miệt vườn - trở về', 'description' => 'Trải nghiệm miệt vườn, thưởng thức trái cây và tiễn khách.'],
            ],
            'con-dao' => [
                ['day' => 1, 'title' => 'Đến Côn Đảo', 'description' => 'Đón khách, nhận phòng và nghỉ dưỡng riêng tư.'],
                ['day' => 2, 'title' => 'Di tích lịch sử', 'description' => 'Tham quan các di tích lịch sử nổi bật và tìm hiểu bối cảnh địa phương.'],
                ['day' => 3, 'title' => 'Biển và spa', 'description' => 'Tắm biển, thư giãn và dùng bữa tối hải sản.'],
                ['day' => 4, 'title' => 'Tự do - tiễn khách', 'description' => 'Nghỉ ngơi, mua quà và ra sân bay.'],
            ],
            default => [],
        };
    }

    private function genericItineraryTemplate(): array
    {
        $days = max(1, (int) ($this->duration_days ?: 3));
        $plan = [];

        for ($day = 1; $day <= $days; $day++) {
            $plan[] = [
                'day' => $day,
                'title' => match ($day) {
                    1 => 'Đón khách và khởi hành',
                    $days => 'Kết thúc và tiễn khách',
                    default => 'Trải nghiệm điểm nổi bật',
                },
                'description' => match ($day) {
                    1 => "Đón khách tại điểm hẹn, nhận phòng và bắt đầu hành trình tại {$this->destination}.",
                    $days => 'Mua sắm, trả phòng và kết thúc chương trình.',
                    default => 'Tham quan các điểm nổi bật, dùng bữa và nghỉ ngơi theo lịch trình.',
                },
            ];
        }

        return $plan;
    }

    private function looksGenericItinerary(array $itinerary): bool
    {
        if (empty($itinerary)) {
            return true;
        }

        $genericPatterns = [
            'đón khách',
            'khởi hành',
            'trải nghiệm điểm nổi bật',
            'kết thúc và tiễn khách',
            'tham quan các điểm nổi bật',
            'dùng bữa và nghỉ ngơi theo lịch trình',
            'mua sắm, trả phòng và kết thúc chương trình',
        ];

        $genericCount = 0;
        foreach ($itinerary as $item) {
            $haystack = mb_strtolower(trim(($item['title'] ?? '') . ' ' . ($item['description'] ?? '')));
            foreach ($genericPatterns as $pattern) {
                if (str_contains($haystack, $pattern)) {
                    $genericCount++;
                    break;
                }
            }
        }

        return $genericCount === count($itinerary);
    }

    private function destinationKey(): string
    {
        $value = mb_strtolower(trim((string) ($this->slug ?: $this->destination ?: $this->title ?: '')));
        $value = str_replace(['đ', 'Đ'], 'd', $value);
        $value = preg_replace('/[^a-z0-9]+/u', '-', $value) ?? $value;

        return trim($value, '-');
    }
}
