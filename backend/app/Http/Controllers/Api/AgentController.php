<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AgentStoreBookingRequest;
use App\Http\Requests\UpdateAgentBookingRequest;
use App\Http\Resources\BookingResource;
use App\Http\Resources\TourResource;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Tour;
use App\Models\User;
use App\Services\TourDepartureService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AgentController extends Controller
{
    public function __construct(private readonly TourDepartureService $departureService)
    {
    }

    public function dashboard(Request $request)
    {
        $agent = $request->user();

        $approvedTours = Tour::where('status', 'approved')
            ->whereNull('deleted_at')
            ->with(['creator', 'guide'])
            ->orderByDesc('created_at')
            ->limit(6)
            ->get();

        $myBookings = Booking::with(['tour', 'user', 'assignedAgent'])
            ->where('assigned_agent_id', $agent->_id)
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        $allAssigned = Booking::where('assigned_agent_id', $agent->_id)->get();
        $assignedRevenue = (float) $allAssigned->sum('total_price');
        $cancelled = $allAssigned->where('status', 'cancelled')->count();
        $confirmed = $allAssigned->whereIn('status', ['confirmed', 'completed'])->count();
        $total = max(1, $allAssigned->count());

        return $this->apiResponse(true, [
            'stats' => [
                'customers' => User::where('role', 'customer')->count(),
                'assigned_bookings' => $allAssigned->count(),
                'confirmed_bookings' => $confirmed,
                'assigned_revenue' => $assignedRevenue,
                'cancel_rate' => round(($cancelled / $total) * 100, 2),
                'close_rate' => round(($confirmed / $total) * 100, 2),
            ],
            'recent_bookings' => BookingResource::collection($myBookings),
            'available_tours' => TourResource::collection($approvedTours),
        ], 'Lấy dashboard nhân viên tư vấn thành công.');
    }

    public function tours(Request $request)
    {
        $query = Tour::where('status', 'approved')->whereNull('deleted_at')->with(['creator', 'guide']);

        if ($request->filled('q')) {
            $keyword = $request->string('q')->toString();
            $query->where(function ($builder) use ($keyword) {
                $builder->where('title', 'like', '%'.$keyword.'%')
                    ->orWhere('destination', 'like', '%'.$keyword.'%')
                    ->orWhere('category', 'like', '%'.$keyword.'%');
            });
        }

        $tours = $query->orderByDesc('created_at')->paginate(20);

        return $this->apiResponse(true, [
            'items' => TourResource::collection($tours->getCollection()),
            'pagination' => [
                'current_page' => $tours->currentPage(),
                'last_page' => $tours->lastPage(),
                'per_page' => $tours->perPage(),
                'total' => $tours->total(),
            ],
        ], 'Lấy danh sách tour để tư vấn thành công.');
    }

    public function customers(Request $request)
    {
        $query = User::where('role', 'customer')->orderByDesc('created_at');

        if ($request->filled('q')) {
            $keyword = $request->string('q')->toString();
            $query->where(function ($builder) use ($keyword) {
                $builder->where('name', 'like', '%'.$keyword.'%')
                    ->orWhere('email', 'like', '%'.$keyword.'%')
                    ->orWhere('phone', 'like', '%'.$keyword.'%')
                    ->orWhere('username', 'like', '%'.$keyword.'%');
            });
        }

        $customers = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => UserResource::collection($customers->getCollection()),
            'pagination' => [
                'current_page' => $customers->currentPage(),
                'last_page' => $customers->lastPage(),
                'per_page' => $customers->perPage(),
                'total' => $customers->total(),
            ],
        ], 'Lấy danh sách khách hàng thành công.');
    }

    public function bookings(Request $request)
    {
        $query = Booking::with(['tour', 'user', 'assignedAgent'])
            ->where('assigned_agent_id', $request->user()->_id)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $bookings = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => BookingResource::collection($bookings->getCollection()),
            'pagination' => [
                'current_page' => $bookings->currentPage(),
                'last_page' => $bookings->lastPage(),
                'per_page' => $bookings->perPage(),
                'total' => $bookings->total(),
            ],
        ], 'Lấy danh sách booking phụ trách thành công.');
    }

    public function storeBooking(AgentStoreBookingRequest $request)
    {
        $customer = User::where('_id', $request->string('customer_id')->toString())
            ->where('role', 'customer')
            ->first();

        if (! $customer) {
            return $this->apiResponse(false, null, 'Không tìm thấy khách hàng.', 404);
        }

        $tour = Tour::where('_id', $request->string('tour_id')->toString())
            ->whereNull('deleted_at')
            ->first();

        if (! $tour || $tour->status !== 'approved') {
            return $this->apiResponse(false, null, 'Tour hiện không thể đặt.', 404);
        }

        $numPax = (int) $request->input('num_pax');
        $passengers = $request->input('passengers', []);

        if (count($passengers) !== $numPax) {
            throw ValidationException::withMessages([
                'passengers' => ['Số lượng hành khách phải khớp với số khách đăng ký.'],
            ]);
        }

        $departureDate = Carbon::parse($request->input('departure_date'))->toDateString();
        $this->departureService->ensureDepartureHasSlots($tour, $departureDate, $numPax);
        $selectedDeparture = collect($tour->departures)->firstWhere('date', $departureDate);
        $unitPrice = $selectedDeparture['price_override'] ?? $tour->price_per_person;

        $booking = Booking::create([
            'tour_id' => $tour->_id,
            'user_id' => $customer->_id,
            'assigned_agent_id' => $request->user()->_id,
            'departure_date' => Carbon::parse($departureDate),
            'num_pax' => $numPax,
            'total_price' => $unitPrice * $numPax,
            'status' => 'pending',
            'passengers' => $passengers,
            'note' => $request->input('note'),
            'internal_note' => $request->input('internal_note'),
            'special_requirements' => $request->input('special_requirements', []),
            'payment_status' => 'unpaid',
        ]);

        $this->departureService->decrementSlots($tour, $departureDate, $numPax);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'agent_booking_created',
            'module' => 'agent',
            'detail' => [
                'booking_id' => (string) $booking->_id,
                'customer_id' => (string) $customer->_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(
            true,
            new BookingResource($booking->load(['tour', 'user', 'assignedAgent'])),
            'Nhân viên tư vấn đã tạo booking thành công.',
            201
        );
    }

    public function updateBooking(UpdateAgentBookingRequest $request, string $id)
    {
        $booking = Booking::with(['tour', 'user', 'assignedAgent'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->assigned_agent_id !== (string) $request->user()->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking này.', 403);
        }

        $booking->fill($request->validated());
        $booking->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'agent_booking_updated',
            'module' => 'agent',
            'detail' => ['booking_id' => (string) $booking->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new BookingResource($booking), 'Cập nhật booking phụ trách thành công.');
    }
}
