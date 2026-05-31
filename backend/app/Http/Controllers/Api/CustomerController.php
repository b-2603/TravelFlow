<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRefundRequest;
use App\Http\Requests\StoreSupportTicketRequest;
use App\Http\Resources\FavoriteTourResource;
use App\Http\Resources\RefundRequestResource;
use App\Http\Resources\BookingResource;
use App\Http\Resources\SupportTicketResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\FavoriteTour;
use App\Models\Payment;
use App\Models\RefundRequest;
use App\Models\SupportTicket;
use App\Models\Tour;
use Carbon\Carbon;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function dashboard(Request $request)
    {
        $userId = $request->user()->_id;

        $bookings = Booking::where('user_id', $userId)
            ->with(['tour', 'payments', 'review', 'refundRequests', 'supportTickets.handledBy'])
            ->orderByDesc('created_at')
            ->get();

        $favoriteTours = FavoriteTour::where('user_id', $userId)
            ->with(['tour.creator', 'tour.guide'])
            ->orderByDesc('created_at')
            ->get();

        $supportTickets = SupportTicket::where('user_id', $userId)
            ->with(['booking.tour', 'handledBy'])
            ->orderByDesc('created_at')
            ->get();

        $refundRequests = RefundRequest::where('user_id', $userId)
            ->with(['booking.tour'])
            ->orderByDesc('created_at')
            ->get();

        $today = Carbon::today();
        $upcomingBookings = $bookings
            ->filter(fn (Booking $booking) => in_array($booking->status, ['pending', 'confirmed'], true) && optional($booking->departure_date)->greaterThanOrEqualTo($today))
            ->sortBy('departure_date')
            ->values();

        $successPayments = Payment::where('user_id', $userId)
            ->where('status', 'success')
            ->get();

        $summary = [
            'total_bookings' => $bookings->count(),
            'upcoming_bookings' => $upcomingBookings->count(),
            'completed_bookings' => $bookings->where('status', 'completed')->count(),
            'favorite_tours' => $favoriteTours->count(),
            'open_supports' => $supportTickets->whereIn('status', ['open', 'in_progress'])->count(),
            'pending_refunds' => $refundRequests->whereIn('status', ['pending', 'approved'])->count(),
            'total_spent' => (float) $successPayments->sum('amount'),
        ];

        $payload = [
            'summary' => $summary,
            'next_trip' => $this->formatBookingSummary($upcomingBookings->first()),
            'recent_bookings' => BookingResource::collection($bookings->take(5))->resolve(),
            'favorite_tours' => FavoriteTourResource::collection($favoriteTours->take(5))->resolve(),
            'support_tickets' => SupportTicketResource::collection($supportTickets->take(5))->resolve(),
            'refund_requests' => RefundRequestResource::collection($refundRequests->take(5))->resolve(),
            'recent_activity' => $this->buildRecentActivity($bookings, $supportTickets, $refundRequests),
        ];

        return $this->apiResponse(true, $payload, 'Lấy tổng quan khách hàng thành công.');
    }

    public function favorites(Request $request)
    {
        $favorites = FavoriteTour::where('user_id', $request->user()->_id)
            ->with(['tour.creator', 'tour.guide'])
            ->orderByDesc('created_at')
            ->get();

        return $this->apiResponse(true, FavoriteTourResource::collection($favorites), 'Lấy danh sách tour yêu thích thành công.');
    }

    public function addFavorite(Request $request, string $tourId)
    {
        $tour = Tour::where('_id', $tourId)->whereNull('deleted_at')->where('status', 'approved')->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        $favorite = FavoriteTour::firstOrCreate([
            'user_id' => $request->user()->_id,
            'tour_id' => $tour->_id,
        ]);

        return $this->apiResponse(true, new FavoriteTourResource($favorite->load(['tour.creator', 'tour.guide'])), 'Đã lưu tour yêu thích.');
    }

    public function removeFavorite(Request $request, string $tourId)
    {
        FavoriteTour::where('user_id', $request->user()->_id)
            ->where('tour_id', $tourId)
            ->delete();

        return $this->apiResponse(true, null, 'Đã xóa tour khỏi danh sách yêu thích.');
    }

    public function supports(Request $request)
    {
        $tickets = SupportTicket::where('user_id', $request->user()->_id)
            ->with(['booking.tour', 'handledBy'])
            ->orderByDesc('created_at')
            ->get();

        return $this->apiResponse(true, SupportTicketResource::collection($tickets), 'Lấy danh sách hỗ trợ thành công.');
    }

    public function createSupport(StoreSupportTicketRequest $request)
    {
        $bookingId = $request->input('booking_id');

        if ($bookingId) {
            $booking = Booking::where('_id', $bookingId)
                ->where('user_id', $request->user()->_id)
                ->first();

            if (! $booking) {
                return $this->apiResponse(false, null, 'Booking không hợp lệ.', 422);
            }
        }

        $ticket = SupportTicket::create([
            'user_id' => $request->user()->_id,
            'booking_id' => $bookingId,
            'subject' => $request->string('subject')->toString(),
            'message' => $request->string('message')->toString(),
            'status' => 'open',
            'reply' => null,
            'handled_by' => null,
            'handled_at' => null,
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'support_ticket_created',
            'module' => 'support',
            'detail' => ['support_ticket_id' => (string) $ticket->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new SupportTicketResource($ticket->load(['booking.tour', 'handledBy'])), 'Gửi yêu cầu hỗ trợ thành công.', 201);
    }

    public function refundRequests(Request $request)
    {
        $refunds = RefundRequest::where('user_id', $request->user()->_id)
            ->with(['booking.tour'])
            ->orderByDesc('created_at')
            ->get();

        return $this->apiResponse(true, RefundRequestResource::collection($refunds), 'Lấy danh sách yêu cầu hoàn tiền thành công.');
    }

    public function createRefundRequest(StoreRefundRequest $request)
    {
        $booking = Booking::where('_id', $request->string('booking_id')->toString())
            ->where('user_id', $request->user()->_id)
            ->first();

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if (! in_array($booking->status, ['pending', 'confirmed', 'cancelled'], true)) {
            return $this->apiResponse(false, null, 'Booking này không thể gửi yêu cầu hoàn tiền.', 422);
        }

        $existing = RefundRequest::where('booking_id', $booking->_id)
            ->where('user_id', $request->user()->_id)
            ->whereIn('status', ['pending', 'approved'])
            ->first();

        if ($existing) {
            return $this->apiResponse(false, null, 'Booking này đã có yêu cầu hoàn tiền đang xử lý.', 422);
        }

        $refund = RefundRequest::create([
            'user_id' => $request->user()->_id,
            'booking_id' => $booking->_id,
            'reason' => $request->string('reason')->toString(),
            'amount_requested' => (float) ($request->input('amount_requested') ?: $booking->total_price),
            'status' => 'pending',
            'admin_note' => null,
        ]);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'refund_request_created',
            'module' => 'refunds',
            'detail' => ['refund_request_id' => (string) $refund->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new RefundRequestResource($refund->load(['booking.tour'])), 'Gửi yêu cầu hoàn tiền thành công.', 201);
    }

    private function formatBookingSummary(?Booking $booking): ?array
    {
        if (! $booking) {
            return null;
        }

        $paidTotal = (float) $booking->payments->where('status', 'success')->sum('amount');
        $refundedTotal = (float) $booking->payments->where('status', 'refunded')->sum('amount');
        $netPaid = max(0, $paidTotal - $refundedTotal);
        $remainingAmount = max(0, (float) $booking->total_price - $netPaid);

        return [
            'id' => (string) $booking->_id,
            'tour' => $booking->tour ? [
                'id' => (string) $booking->tour->_id,
                'title' => $booking->tour->title,
                'slug' => $booking->tour->slug,
                'destination' => $booking->tour->destination,
            ] : null,
            'departure_date' => optional($booking->departure_date)->toDateString(),
            'status' => $booking->status,
            'payment_status' => $booking->payment_status,
            'total_price' => (float) $booking->total_price,
            'remaining_amount' => $remainingAmount,
            'num_pax' => $booking->num_pax,
        ];
    }

    private function buildRecentActivity($bookings, $supportTickets, $refundRequests): array
    {
        $activities = collect();

        foreach ($bookings->take(3) as $booking) {
            $activities->push([
                'type' => 'booking',
                'title' => $booking->tour?->title ?? 'Đơn đặt tour',
                'description' => 'Booking ' . $booking->status,
                'date' => optional($booking->created_at)->toISOString(),
            ]);
        }

        foreach ($supportTickets->take(2) as $ticket) {
            $activities->push([
                'type' => 'support',
                'title' => $ticket->subject,
                'description' => 'Hỗ trợ ' . $ticket->status,
                'date' => optional($ticket->created_at)->toISOString(),
            ]);
        }

        foreach ($refundRequests->take(2) as $refund) {
            $activities->push([
                'type' => 'refund',
                'title' => $refund->booking?->tour?->title ?? 'Hoàn tiền',
                'description' => 'Yêu cầu hoàn tiền ' . $refund->status,
                'date' => optional($refund->created_at)->toISOString(),
            ]);
        }

        return $activities->sortByDesc('date')->take(6)->values()->all();
    }
}
