<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\RejectTourRequest;
use App\Http\Requests\StoreTourRequest;
use App\Http\Requests\UpdateTourRequest;
use App\Http\Resources\TourResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Partner;
use App\Models\Review;
use App\Models\Tour;
use App\Models\User;
use App\Services\TourDepartureService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TourController extends Controller
{
    public function __construct(private readonly TourDepartureService $departureService)
    {
    }

    public function index(Request $request)
    {
        $query = Tour::query()->whereNull('deleted_at');
        $viewer = $request->user();

        if (! $viewer || ! in_array($viewer->role, ['admin', 'tour_manager'], true)) {
            $query->where('status', 'approved');
        }

        if ($request->filled('q')) {
            $keyword = $request->string('q')->toString();
            $query->where(function ($builder) use ($keyword) {
                $builder->where('title', 'like', '%'.$keyword.'%')
                    ->orWhere('description', 'like', '%'.$keyword.'%')
                    ->orWhere('destination', 'like', '%'.$keyword.'%')
                    ->orWhere('category', 'like', '%'.$keyword.'%');
            });
        }

        if ($request->filled('destination')) {
            $query->where('destination', 'like', '%'.$request->string('destination')->toString().'%');
        }

        if ($request->filled('category')) {
            $query->where('category', $request->string('category')->toString());
        }

        if ($request->filled('price_min')) {
            $query->where('price_per_person', '>=', (float) $request->input('price_min'));
        }

        if ($request->filled('price_max')) {
            $query->where('price_per_person', '<=', (float) $request->input('price_max'));
        }

        if ($request->filled('pax')) {
            $query->where('max_pax', '>=', (int) $request->input('pax'));
        }

        if ($request->filled('duration_min')) {
            $query->where('duration_days', '>=', (int) $request->input('duration_min'));
        }

        if ($request->filled('duration_max')) {
            $query->where('duration_days', '<=', (int) $request->input('duration_max'));
        }

        if ($request->filled('date')) {
            $date = Carbon::parse($request->input('date'))->toDateString();
            $query->where('departures', 'elemMatch', [
                'date' => $date,
                'available_slots' => ['$gt' => 0],
                'status' => 'active',
            ]);
        }

        $sort = $request->string('sort', 'latest')->toString();

        try {
            $matchedTours = $query->with(['creator', 'guide'])->get();
        } catch (\MongoDB\Driver\Exception\Exception $e) {
            Log::error('TourController@index MongoDB unavailable: '.$e->getMessage());
            $matchedTours = collect();
        }

        $sortedTours = match ($sort) {
            'price_asc' => $matchedTours->sortBy(fn ($tour) => $this->effectivePrice($tour))->values(),
            'price_desc' => $matchedTours->sortByDesc(fn ($tour) => $this->effectivePrice($tour))->values(),
            'popular' => $matchedTours->sortByDesc(function ($tour) {
                return Booking::where('tour_id', $tour->_id)->count() + ($tour->reviews()->count() * 2);
            })->values(),
            default => $matchedTours->sortByDesc('created_at')->values(),
        };

        // Always keep pinned tours at the top, regardless of sort mode.
        $pinnedTours = $sortedTours->filter(fn ($tour) => (bool) ($tour->pinned ?? false));
        $regularTours = $sortedTours->reject(fn ($tour) => (bool) ($tour->pinned ?? false));
        $sortedTours = $pinnedTours->concat($regularTours)->values();

        $perPage = max(1, min(24, (int) $request->input('per_page', 9)));
        $page = max(1, (int) $request->input('page', 1));
        $total = $sortedTours->count();
        $items = $sortedTours->slice(($page - 1) * $perPage, $perPage)->values();

        return $this->apiResponse(true, [
            'items' => TourResource::collection($items),
            'pagination' => [
                'current_page' => $page,
                'last_page' => (int) ceil($total / $perPage),
                'per_page' => $perPage,
                'total' => $total,
            ],
        ], 'Tours retrieved successfully.');
    }

    public function show(string $slug)
    {
        $tour = Tour::where('slug', $slug)->whereNull('deleted_at')->with(['creator', 'guide'])->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        return $this->apiResponse(true, new TourResource($tour), 'Tour retrieved successfully.');
    }

    public function store(StoreTourRequest $request)
    {
        $user = $request->user();
        $validated = $request->validated();
        $imageUrls = $this->prepareImageUrls($request, $validated['images'] ?? []);
        $requestedStatus = $validated['status'] ?? null;

        $tour = Tour::create([
            ...$validated,
            'slug' => Str::slug($request->string('title')->toString()).'-'.Str::lower(Str::random(6)),
            'images' => $imageUrls,
            'linked_partner_ids' => $validated['linked_partner_ids'] ?? [],
            'departures' => $this->departureService->normalizeDepartures($request->input('departures', [])),
            'status' => $user->role === 'admin'
                ? ($requestedStatus ?: 'approved')
                : ($requestedStatus === 'draft' ? 'draft' : 'pending'),
            'created_by' => $user->_id,
        ]);

        ActivityLog::create([
            'user_id' => $user->_id,
            'action' => 'tour_created',
            'module' => 'tours',
            'detail' => ['tour_id' => (string) $tour->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new TourResource($tour), 'Tour created successfully.', 201);
    }

    public function managerIndex(Request $request)
    {
        $query = Tour::query()
            ->whereNull('deleted_at')
            ->with(['creator', 'guide'])
            ->orderByDesc('pinned')
            ->orderByDesc('created_at');

        if ($request->user()->role !== 'admin') {
            $query->where('created_by', $request->user()->_id);
        }

        $filteredQuery = clone $query;

        if ($request->filled('status')) {
            $filteredQuery->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $filteredQuery->where(function ($builder) use ($search) {
                $builder->where('title', 'like', '%'.$search.'%')
                    ->orWhere('destination', 'like', '%'.$search.'%')
                    ->orWhere('category', 'like', '%'.$search.'%');
            });
        }

        $summarySource = $filteredQuery->get();

        $tours = $filteredQuery->paginate(20);
        $collection = collect($tours->items());

        return $this->apiResponse(true, [
            'items' => TourResource::collection($collection),
            'pagination' => [
                'current_page' => $tours->currentPage(),
                'last_page' => $tours->lastPage(),
                'per_page' => $tours->perPage(),
                'total' => $tours->total(),
            ],
            'summary' => [
                'total_tours' => $summarySource->count(),
                'pending_tours' => $summarySource->where('status', 'pending')->count(),
                'approved_tours' => $summarySource->where('status', 'approved')->count(),
                'draft_tours' => $summarySource->where('status', 'draft')->count(),
                'rejected_tours' => $summarySource->where('status', 'rejected')->count(),
                'pinned_tours' => $summarySource->where('pinned', true)->count(),
                'total_departures' => $summarySource->sum(fn ($tour) => count($tour->departures ?? [])),
                'total_bookings' => $summarySource->sum(fn ($tour) => Booking::where('tour_id', $tour->_id)->count()),
                'estimated_revenue' => $summarySource->sum(function ($tour) {
                    return Booking::where('tour_id', $tour->_id)
                        ->whereIn('status', ['pending', 'confirmed', 'completed'])
                        ->sum('total_price');
                }),
            ],
        ], 'Manager tours retrieved successfully.');
    }

    public function managerMeta()
    {
        $guides = User::where('role', 'guide')->active()->get(['_id', 'name', 'email']);
        $partners = Partner::active()->get(['_id', 'company_name', 'service_type']);

        return $this->apiResponse(true, [
            'guides' => $guides->map(fn ($guide) => [
                'id' => (string) $guide->_id,
                'name' => $guide->name,
                'email' => $guide->email,
            ])->values(),
            'partners' => $partners->map(fn ($partner) => [
                'id' => (string) $partner->_id,
                'company_name' => $partner->company_name,
                'service_type' => $partner->service_type,
            ])->values(),
        ], 'Manager meta retrieved successfully.');
    }

    public function managerShow(Request $request, string $id)
    {
        $tour = Tour::query()
            ->where('_id', $id)
            ->whereNull('deleted_at')
            ->with(['creator', 'guide'])
            ->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        if ($request->user()->role !== 'admin' && (string) $tour->created_by !== (string) $request->user()->_id) {
            return $this->apiResponse(false, null, 'Forbidden.', 403);
        }

        $bookings = Booking::where('tour_id', $tour->_id)->get();
        $reviews = Review::where('tour_id', $tour->_id)->get();
        $departures = collect($tour->departures ?? []);
        $bookedPax = $bookings->whereIn('status', ['pending', 'confirmed', 'completed'])->sum('num_pax');
        $availableSlots = $departures->sum(fn ($departure) => (int) ($departure['available_slots'] ?? 0));
        $capacity = $bookedPax + $availableSlots;
        $fillRate = $capacity > 0 ? round(($bookedPax / $capacity) * 100, 2) : 0;
        $reviewCount = $reviews->count();
        $averageRating = $reviewCount > 0 ? round($reviews->avg('rating'), 2) : 0;

        return $this->apiResponse(true, [
            'tour' => new TourResource($tour),
            'stats' => [
                'bookings_total' => $bookings->count(),
                'bookings_pending' => $bookings->where('status', 'pending')->count(),
                'bookings_confirmed' => $bookings->where('status', 'confirmed')->count(),
                'bookings_completed' => $bookings->where('status', 'completed')->count(),
                'booked_pax' => (int) $bookedPax,
                'available_slots' => (int) $availableSlots,
                'fill_rate' => $fillRate,
                'review_count' => $reviewCount,
                'average_rating' => $averageRating,
            ],
            'recent_bookings' => $bookings
                ->sortByDesc(fn ($booking) => $booking->created_at ?? null)
                ->take(8)
                ->values()
                ->map(function ($booking) {
                    return [
                        'id' => (string) $booking->_id,
                        'booking_code' => $booking->booking_code,
                        'status' => $booking->status,
                        'departure_date' => $booking->departure_date,
                        'num_pax' => (int) ($booking->num_pax ?? 0),
                        'total_price' => (float) ($booking->total_price ?? 0),
                        'user' => $booking->user ? [
                            'id' => (string) $booking->user->_id,
                            'name' => $booking->user->name,
                            'email' => $booking->user->email,
                        ] : null,
                        'created_at' => optional($booking->created_at)->toISOString(),
                    ];
                })
                ->all(),
            'recent_reviews' => $reviews
                ->sortByDesc(fn ($review) => $review->created_at ?? null)
                ->take(6)
                ->values()
                ->map(function ($review) {
                    return [
                        'id' => (string) $review->_id,
                        'title' => $review->title,
                        'rating' => (int) ($review->rating ?? 0),
                        'comment' => $review->comment,
                        'status' => $review->status,
                        'user' => $review->user ? [
                            'id' => (string) $review->user->_id,
                            'name' => $review->user->name,
                        ] : null,
                        'created_at' => optional($review->created_at)->toISOString(),
                    ];
                })
                ->all(),
        ], 'Manager tour retrieved successfully.');
    }

    public function submitForApproval(Request $request, string $id)
    {
        $tour = Tour::where('_id', $id)->whereNull('deleted_at')->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        if ($request->user()->role !== 'admin' && (string) $tour->created_by !== (string) $request->user()->_id) {
            return $this->apiResponse(false, null, 'Forbidden.', 403);
        }

        $tour->status = 'pending';
        $tour->save();

        return $this->apiResponse(true, new TourResource($tour), 'Tour submitted for approval successfully.');
    }

    public function update(UpdateTourRequest $request, string $id)
    {
        $tour = Tour::where('_id', $id)->whereNull('deleted_at')->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        $validated = $request->validated();
        $imageUrls = $this->prepareImageUrls($request, $validated['images'] ?? []);
        $requestedStatus = $validated['status'] ?? $tour->status;

        $tour->fill($validated);
        $tour->slug = $request->filled('title') ? Str::slug($request->string('title')->toString()) : $tour->slug;
        $tour->images = $imageUrls;
        $tour->linked_partner_ids = $validated['linked_partner_ids'] ?? ($tour->linked_partner_ids ?? []);
        $tour->departures = $this->departureService->normalizeDepartures($request->input('departures', $tour->departures ?? []));
        $tour->status = $request->user()->role === 'admin'
            ? ($requestedStatus ?: 'approved')
            : (in_array($requestedStatus, ['draft', 'pending'], true) ? $requestedStatus : 'pending');
        $tour->save();

        return $this->apiResponse(true, new TourResource($tour), 'Tour updated successfully.');
    }

    public function destroy(Request $request, string $id)
    {
        $tour = Tour::where('_id', $id)->whereNull('deleted_at')->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        $tour->deleted_at = Carbon::now();
        $tour->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'tour_soft_deleted',
            'module' => 'tours',
            'detail' => ['tour_id' => (string) $tour->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, null, 'Tour deleted successfully.');
    }

    public function togglePinned(Request $request, string $id)
    {
        $tour = Tour::where('_id', $id)->whereNull('deleted_at')->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        if ($request->user()->role !== 'admin' && (string) $tour->created_by !== (string) $request->user()->_id) {
            return $this->apiResponse(false, null, 'Forbidden.', 403);
        }

        $tour->pinned = ! (bool) ($tour->pinned ?? false);
        $tour->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => $tour->pinned ? 'tour_pinned' : 'tour_unpinned',
            'module' => 'tours',
            'detail' => ['tour_id' => (string) $tour->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new TourResource($tour), $tour->pinned ? 'Tour pinned successfully.' : 'Tour unpinned successfully.');
    }

    public function duplicate(Request $request, string $id)
    {
        $tour = Tour::where('_id', $id)->whereNull('deleted_at')->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        if ($request->user()->role !== 'admin' && (string) $tour->created_by !== (string) $request->user()->_id) {
            return $this->apiResponse(false, null, 'Forbidden.', 403);
        }

        $copy = $tour->replicate();
        $copy->slug = Str::slug($tour->title).'-copy-'.Str::lower(Str::random(6));
        $copy->status = 'draft';
        $copy->pinned = false;
        $copy->approved_at = null;
        $copy->reject_reason = null;
        $copy->created_by = $request->user()->_id;
        $copy->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'tour_duplicated',
            'module' => 'tours',
            'detail' => [
                'source_tour_id' => (string) $tour->_id,
                'tour_id' => (string) $copy->_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new TourResource($copy), 'Tour duplicated successfully.', 201);
    }

    public function approve(Request $request, string $id)
    {
        $tour = Tour::find($id);

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        $tour->status = 'approved';
        $tour->reject_reason = null;
        $tour->approved_at = Carbon::now();
        $tour->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'tour_approved',
            'module' => 'tours',
            'detail' => ['tour_id' => (string) $tour->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new TourResource($tour), 'Tour approved successfully.');
    }

    public function reject(RejectTourRequest $request, string $id)
    {
        $tour = Tour::find($id);

        if (! $tour) {
            return $this->apiResponse(false, null, 'Tour not found.', 404);
        }

        $tour->status = 'rejected';
        $tour->reject_reason = $request->string('reason')->toString();
        $tour->save();

        return $this->apiResponse(true, new TourResource($tour), 'Tour rejected successfully.');
    }

    private function prepareImageUrls(Request $request, array $existingUrls = []): array
    {
        $urls = collect($existingUrls)
            ->filter(fn ($value) => is_string($value) && filled(trim($value)))
            ->map(fn ($value) => trim($value))
            ->values();

        if (! $request->hasFile('image_files')) {
            return $urls->all();
        }

        $uploadedUrls = collect($request->file('image_files'))
            ->filter()
            ->map(function ($file) {
                $path = $file->store('tours', 'public');

                return Storage::disk('public')->url($path);
            });

        return $urls->merge($uploadedUrls)->values()->all();
    }

    private function effectivePrice(Tour $tour): float
    {
        $basePrice = (float) $tour->price_per_person;
        $promotionType = $tour->promotion_type ?: 'none';
        $promotionValue = (float) ($tour->promotion_value ?: 0);

        return match ($promotionType) {
            'percent' => max(0, $basePrice - (($basePrice * $promotionValue) / 100)),
            'fixed' => max(0, $basePrice - $promotionValue),
            default => $basePrice,
        };
    }
}
