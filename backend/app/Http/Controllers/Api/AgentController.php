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
use App\Models\SupportTicket;
use App\Models\Tour;
use App\Models\User;
use App\Services\EmailService;
use App\Services\TourDepartureService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AgentController extends Controller
{
    public function __construct(
        private readonly TourDepartureService $departureService,
        private readonly EmailService $emailService
    ) {
    }

    /**
     * Dashboard của nhân viên tư vấn
     * Hiển thị thống kê và thông tin tổng quan
     */
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

        // Thống kê support tickets liên quan đến bookings của agent
        $bookingIds = $allAssigned->pluck('_id')->toArray();
        $openTickets = SupportTicket::whereIn('booking_id', $bookingIds)
            ->where('status', 'open')
            ->count();

        return $this->apiResponse(true, [
            'stats' => [
                'customers' => User::where('role', 'customer')->count(),
                'assigned_bookings' => $allAssigned->count(),
                'confirmed_bookings' => $confirmed,
                'assigned_revenue' => $assignedRevenue,
                'cancel_rate' => round(($cancelled / $total) * 100, 2),
                'close_rate' => round(($confirmed / $total) * 100, 2),
                'open_tickets' => $openTickets,
            ],
            'recent_bookings' => BookingResource::collection($myBookings),
            'available_tours' => TourResource::collection($approvedTours),
        ], 'Lấy dashboard nhân viên tư vấn thành công.');
    }

    /**
     * Xem danh sách tour để tư vấn
     * Hỗ trợ tìm kiếm và lọc
     */
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

        if ($request->filled('category')) {
            $query->where('category', $request->string('category')->toString());
        }

        if ($request->filled('destination')) {
            $query->where('destination', 'like', '%'.$request->string('destination')->toString().'%');
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

    /**
     * Xem chi tiết một tour để tư vấn
     */
    public function showTour(string $id)
    {
        $tour = Tour::where('_id', $id)
            ->where('status', 'approved')
            ->whereNull('deleted_at')
            ->with(['creator', 'guide', 'departures'])
            ->first();

        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        return $this->apiResponse(true, [
            'tour' => new TourResource($tour),
        ], 'Lấy thông tin tour thành công.');
    }

    /**
     * Xem danh sách khách hàng
     * Hỗ trợ tìm kiếm
     */
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

    /**
     * Xem thông tin chi tiết khách hàng kèm lịch sử booking
     */
    public function showCustomer(string $id)
    {
        $customer = User::where('_id', $id)
            ->where('role', 'customer')
            ->with(['bookings' => function ($query) {
                $query->with(['tour', 'assignedAgent'])
                    ->orderByDesc('created_at')
                    ->limit(10);
            }])
            ->first();

        if (! $customer) {
            return $this->apiResponse(false, null, 'Không tìm thấy khách hàng.', 404);
        }

        $bookingStats = Booking::where('user_id', $customer->_id)
            ->select('status')
            ->get()
            ->groupBy('status')
            ->map->count();

        return $this->apiResponse(true, [
            'customer' => new UserResource($customer),
            'booking_stats' => [
                'total' => Booking::where('user_id', $customer->_id)->count(),
                'completed' => $bookingStats->get('completed', 0),
                'cancelled' => $bookingStats->get('cancelled', 0),
                'pending' => $bookingStats->get('pending', 0),
                'confirmed' => $bookingStats->get('confirmed', 0),
            ],
        ], 'Lấy thông tin khách hàng thành công.');
    }

    /**
     * Xem danh sách booking được giao phụ trách
     * Hỗ trợ lọc theo trạng thái
     */
    public function bookings(Request $request)
    {
        $query = Booking::with(['tour', 'user', 'assignedAgent'])
            ->where('assigned_agent_id', $request->user()->_id)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('departure_from') && $request->filled('departure_to')) {
            $query->whereBetween('departure_date', [
                Carbon::parse($request->input('departure_from'))->startOfDay(),
                Carbon::parse($request->input('departure_to'))->endOfDay(),
            ]);
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

    /**
     * Xem chi tiết một booking phụ trách
     */
    public function showBooking(Request $request, string $id)
    {
        $agent = $request->user();
        $booking = Booking::with(['tour', 'user', 'assignedAgent', 'payments', 'supportTickets'])
            ->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->assigned_agent_id !== (string) $agent->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking này.', 403);
        }

        return $this->apiResponse(true, [
            'booking' => new BookingResource($booking),
        ], 'Lấy thông tin booking thành công.');
    }

    /**
     * Nhân viên tư vấn tạo booking thay cho khách hàng
     */
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

    /**
     * Cập nhật booking phụ trách
     * Cho phép cập nhật internal_note, special_requirements, departure_date
     */
    public function updateBooking(UpdateAgentBookingRequest $request, string $id)
    {
        $agent = $request->user();
        $booking = Booking::with(['tour', 'user', 'assignedAgent'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->assigned_agent_id !== (string) $agent->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking này.', 403);
        }

        // Xử lý thay đổi departure_date nếu có
        if ($request->has('departure_date') && $request->filled('departure_date')) {
            $newDepartureDate = Carbon::parse($request->input('departure_date'))->toDateString();
            $oldDepartureDate = $booking->departure_date->toDateString();

            if ($oldDepartureDate !== $newDepartureDate) {
                $tour = $booking->tour;
                $numPax = $booking->num_pax;

                // Kiểm tra slot cho ngày mới
                $this->departureService->ensureDepartureHasSlots($tour, $newDepartureDate, $numPax);

                // Hoàn slot cũ
                $this->departureService->incrementSlots($tour, $oldDepartureDate, $numPax);

                // Trừ slot mới
                $this->departureService->decrementSlots($tour, $newDepartureDate, $numPax);

                // Cập nhật lại giá nếu có price_override
                $selectedDeparture = collect($tour->departures)->firstWhere('date', $newDepartureDate);
                $unitPrice = $selectedDeparture['price_override'] ?? $tour->price_per_person;
                $booking->total_price = $unitPrice * $numPax;
            }

            $booking->departure_date = Carbon::parse($newDepartureDate);
        }

        $booking->fill($request->validated());
        $booking->save();

        ActivityLog::create([
            'user_id' => $agent->_id,
            'action' => 'agent_booking_updated',
            'module' => 'agent',
            'detail' => ['booking_id' => (string) $booking->_id],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new BookingResource($booking), 'Cập nhật booking phụ trách thành công.');
    }

    /**
     * Xác nhận lại thông tin hành khách
     * Agent xác nhận thông tin hành khách đã được kiểm tra và chính xác
     */
    public function confirmPassengerInfo(Request $request, string $id)
    {
        $agent = $request->user();
        $validated = $request->validate([
            'passenger_confirmed' => ['required', 'boolean'],
            'confirmation_note' => ['nullable', 'string', 'max:500'],
        ]);

        $booking = Booking::with(['tour', 'user', 'assignedAgent'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->assigned_agent_id !== (string) $agent->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking này.', 403);
        }

        if (! in_array($booking->status, ['pending', 'confirmed'])) {
            return $this->apiResponse(false, null, 'Booking không ở trạng thái có thể xác nhận.', 400);
        }

        $booking->passenger_confirmed = $validated['passenger_confirmed'];
        $booking->passenger_confirmation_note = $validated['confirmation_note'] ?? null;
        $booking->passenger_confirmed_at = $validated['passenger_confirmed'] ? Carbon::now() : null;
        $booking->save();

        // Nếu xác nhận thông tin, chuyển trạng thái sang confirmed
        if ($validated['passenger_confirmed']) {
            $booking->status = 'confirmed';
            $booking->save();
        }

        ActivityLog::create([
            'user_id' => $agent->_id,
            'action' => 'agent_passenger_confirmed',
            'module' => 'agent',
            'detail' => [
                'booking_id' => (string) $booking->_id,
                'confirmed' => $validated['passenger_confirmed'],
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new BookingResource($booking), 
            $validated['passenger_confirmed'] 
                ? 'Xác nhận thông tin hành khách thành công. Booking đã chuyển sang trạng thái confirmed.' 
                : 'Đánh dấu thông tin hành khách chưa xác thực thành công.'
        );
    }

    /**
     * Xử lý yêu cầu hủy booking và chuyển kế toán
     * Agent khởi tạo yêu cầu hủy và chuyển cho kế toán xử lý
     */
    public function processCancellation(Request $request, string $id)
    {
        $agent = $request->user();
        $validated = $request->validate([
            'cancellation_reason' => ['required', 'string', 'max:500'],
            'refund_amount' => ['nullable', 'numeric', 'min:0'],
            'cancellation_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = Booking::with(['tour', 'user', 'assignedAgent', 'payments'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->assigned_agent_id !== (string) $agent->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking này.', 403);
        }

        if (! in_array($booking->status, ['pending', 'confirmed'])) {
            return $this->apiResponse(false, null, 'Booking không ở trạng thái có thể hủy.', 400);
        }

        // Đánh dấu booking cần hủy và chờ kế toán xử lý
        $booking->cancellation_requested = true;
        $booking->cancellation_requested_at = Carbon::now();
        $booking->cancellation_reason = $validated['cancellation_reason'];
        $booking->cancellation_note = $validated['cancellation_note'] ?? null;
        $booking->requested_refund_amount = $validated['refund_amount'] ?? null;
        $booking->save();

        // Tạo activity log
        ActivityLog::create([
            'user_id' => $agent->_id,
            'action' => 'agent_cancellation_requested',
            'module' => 'agent',
            'detail' => [
                'booking_id' => (string) $booking->_id,
                'reason' => $validated['cancellation_reason'],
                'refund_amount' => $validated['refund_amount'] ?? null,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        // Gửi email thông báo cho khách hàng về yêu cầu hủy
        $this->emailService->sendSupportReply($booking->user->email, [
            'subject' => 'Yêu cầu hủy booking #' . substr((string) $booking->_id, -6),
            'booking_id' => (string) $booking->_id,
            'tour_title' => $booking->tour->title ?? 'Tour',
            'reason' => $validated['cancellation_reason'],
            'agent_name' => $agent->name,
        ]);

        return $this->apiResponse(true, new BookingResource($booking), 
            'Yêu cầu hủy booking đã được gửi đến kế toán để xử lý.'
        );
    }

    /**
     * Hỗ trợ sự cố hành trình
     * Xem danh sách support tickets liên quan đến bookings của agent
     */
    public function supportTickets(Request $request)
    {
        $agent = $request->user();
        $bookingIds = Booking::where('assigned_agent_id', $agent->_id)
            ->pluck('_id')
            ->toArray();

        $query = SupportTicket::with(['user', 'booking'])
            ->whereIn('booking_id', $bookingIds)
            ->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->string('priority')->toString());
        }

        $tickets = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => $tickets->getCollection()->map(function ($ticket) {
                return [
                    '_id' => (string) $ticket->_id,
                    'booking_id' => (string) $ticket->booking_id,
                    'booking_tour_title' => $ticket->booking->tour->title ?? null,
                    'customer_name' => $ticket->user->name ?? null,
                    'subject' => $ticket->subject,
                    'status' => $ticket->status,
                    'priority' => $ticket->priority,
                    'created_at' => $ticket->created_at,
                    'updated_at' => $ticket->updated_at,
                ];
            }),
            'pagination' => [
                'current_page' => $tickets->currentPage(),
                'last_page' => $tickets->lastPage(),
                'per_page' => $tickets->perPage(),
                'total' => $tickets->total(),
            ],
        ], 'Lấy danh sách hỗ trợ sự cố thành công.');
    }

    /**
     * Phản hồi support ticket
     */
    public function replySupportTicket(Request $request, string $ticketId)
    {
        $agent = $request->user();
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:2000'],
        ]);

        $ticket = SupportTicket::with(['booking', 'user'])->find($ticketId);

        if (! $ticket) {
            return $this->apiResponse(false, null, 'Không tìm thấy ticket hỗ trợ.', 404);
        }

        // Kiểm tra agent có phụ trách booking này không
        if ($ticket->booking && (string) $ticket->booking->assigned_agent_id !== (string) $agent->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking liên quan đến ticket này.', 403);
        }

        // Cập nhật ticket
        if (! is_array($ticket->messages)) {
            $ticket->messages = [];
        }
        $ticket->messages[] = [
            'sender_id' => (string) $agent->_id,
            'sender_name' => $agent->name,
            'sender_role' => 'agent',
            'message' => $validated['message'],
            'created_at' => Carbon::now()->toIso8601String(),
        ];
        $ticket->status = 'in_progress';
        $ticket->assigned_agent_id = $agent->_id;
        $ticket->save();

        // Gửi email thông báo cho khách
        $this->emailService->sendSupportReply($ticket->user->email, [
            'subject' => 'Phản hồi ticket hỗ trợ #' . substr($ticketId, -6),
            'ticket_id' => $ticketId,
            'message' => $validated['message'],
            'agent_name' => $agent->name,
        ]);

        ActivityLog::create([
            'user_id' => $agent->_id,
            'action' => 'agent_support_reply',
            'module' => 'agent',
            'detail' => [
                'ticket_id' => $ticketId,
                'booking_id' => (string) $ticket->booking_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, null, 'Phản hồi ticket hỗ trợ thành công.');
    }

    /**
     * Gửi email/SMS nhắc trước chuyến đi
     * Agent gửi reminder cho khách hàng về chuyến đi sắp tới
     */
    public function sendPreDepartureReminder(Request $request, string $id)
    {
        $agent = $request->user();
        $validated = $request->validate([
            'custom_message' => ['nullable', 'string', 'max:1000'],
            'send_sms' => ['nullable', 'boolean'],
        ]);

        $booking = Booking::with(['tour', 'user', 'assignedAgent'])->find($id);

        if (! $booking) {
            return $this->apiResponse(false, null, 'Không tìm thấy booking.', 404);
        }

        if ((string) $booking->assigned_agent_id !== (string) $agent->_id) {
            return $this->apiResponse(false, null, 'Bạn không phụ trách booking này.', 403);
        }

        // Kiểm tra booking chưa khởi hành
        if ($booking->departure_date && $booking->departure_date->isPast()) {
            return $this->apiResponse(false, null, 'Chuyến đi đã qua hoặc đang diễn ra.', 400);
        }

        $tourTitle = $booking->tour->title ?? 'Tour';
        $departureDate = $booking->departure_date->format('d/m/Y');
        $customerName = $booking->user->name ?? 'Quý khách';
        $agentName = $agent->name;

        $message = $validated['custom_message'] ?? 
            "Kính chào {$customerName},\n\n" .
            "Nhân viên tư vấn {$agentName} xin nhắc về chuyến đi sắp tới:\n" .
            "- Tour: {$tourTitle}\n" .
            "- Ngày khởi hành: {$departureDate}\n" .
            "- Số khách: {$booking->num_pax}\n\n" .
            "Vui lòng kiểm tra lại thông tin và chuẩn bị đầy đủ giấy tờ cần thiết.\n" .
            "Mọi thắc mắc xin liên hệ hotline để được hỗ trợ.\n\n" .
            "Trân trọng cảm ơn!";

        // Gửi email reminder
        $this->emailService->sendPreDepartureReminder($booking->user->email, [
            'booking_id' => (string) $booking->_id,
            'tour_title' => $tourTitle,
            'departure_date' => $departureDate,
            'customer_name' => $customerName,
            'agent_name' => $agentName,
            'message' => $message,
        ]);

        // Gửi SMS nếu được yêu cầu
        if ($validated['send_sms'] && $booking->user->phone) {
            $smsMessage = "{$tourTitle} - KH: {$departureDate}. LH: 1900xxxx. Agent: {$agentName}";
            Log::info('SMS reminder queued.', [
                'phone' => $booking->user->phone,
                'message' => $smsMessage,
            ]);
        }

        // Ghi nhận đã gửi reminder
        if (! is_array($booking->reminders)) {
            $booking->reminders = [];
        }
        $booking->reminders[] = [
            'sent_by' => (string) $agent->_id,
            'sent_by_name' => $agentName,
            'sent_at' => Carbon::now()->toIso8601String(),
            'type' => $validated['send_sms'] ? 'email_sms' : 'email',
            'message' => $message,
        ];
        $booking->save();

        ActivityLog::create([
            'user_id' => $agent->_id,
            'action' => 'agent_sent_reminder',
            'module' => 'agent',
            'detail' => [
                'booking_id' => (string) $booking->_id,
                'type' => $validated['send_sms'] ? 'email_sms' : 'email',
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, null, 'Gửi email nhắc trước chuyến đi thành công.');
    }

    /**
     * Tạo custom tour (tour tùy chỉnh theo yêu cầu khách hàng)
     */
    public function createCustomTour(Request $request)
    {
        $agent = $request->user();
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'customer_id' => ['required', 'string'],
            'destination' => ['required', 'string', 'max:100'],
            'duration' => ['required', 'integer', 'min:1'],
            'description' => ['nullable', 'string'],
            'estimated_price' => ['required', 'numeric', 'min:0'],
            'num_pax' => ['required', 'integer', 'min:1'],
            'preferred_date' => ['nullable', 'date', 'after_or_equal:today'],
            'special_requests' => ['nullable', 'array'],
            'special_requests.*' => ['string', 'max:500'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        // Kiểm tra customer tồn tại
        $customer = User::where('_id', $validated['customer_id'])
            ->where('role', 'customer')
            ->first();

        if (! $customer) {
            return $this->apiResponse(false, null, 'Không tìm thấy khách hàng.', 404);
        }

        // Tạo tour custom (dưới dạng draft, chờ tour_manager hoặc admin duyệt)
        $tour = Tour::create([
            'title' => $validated['title'],
            'slug' => \Str::slug($validated['title']) . '-' . uniqid(),
            'destination' => $validated['destination'],
            'duration' => $validated['duration'],
            'description' => $validated['description'] ?? null,
            'price_per_person' => $validated['estimated_price'],
            'category' => 'custom',
            'status' => 'draft',
            'highlights' => [],
            'itinerary' => [],
            'images' => [],
            'departures' => $validated['preferred_date'] ? [[
                'date' => $validated['preferred_date'],
                'slots' => 1,
                'price_override' => $validated['estimated_price'],
            ]] : [],
            'created_by' => $agent->_id,
            'is_custom' => true,
            'custom_for_customer' => $customer->_id,
            'custom_requests' => $validated['special_requests'] ?? [],
        ]);

        // Tạo booking draft cho custom tour
        $booking = null;
        if ($validated['preferred_date']) {
            $booking = Booking::create([
                'tour_id' => $tour->_id,
                'user_id' => $customer->_id,
                'assigned_agent_id' => $agent->_id,
                'departure_date' => Carbon::parse($validated['preferred_date']),
                'num_pax' => $validated['num_pax'],
                'total_price' => $validated['estimated_price'] * $validated['num_pax'],
                'status' => 'pending',
                'passengers' => [],
                'note' => $validated['note'],
                'internal_note' => 'Custom tour created by agent',
                'special_requirements' => $validated['special_requests'] ?? [],
                'payment_status' => 'unpaid',
            ]);
        }

        ActivityLog::create([
            'user_id' => $agent->_id,
            'action' => 'agent_created_custom_tour',
            'module' => 'agent',
            'detail' => [
                'tour_id' => (string) $tour->_id,
                'customer_id' => (string) $customer->_id,
                'booking_id' => $booking ? (string) $booking->_id : null,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, [
            'tour' => new TourResource($tour),
            'booking' => $booking ? new BookingResource($booking) : null,
        ], 'Tạo custom tour thành công. Tour đang ở trạng thái draft.', 201);
    }

    /**
     * Thống kê KPI cá nhân của agent
     */
    public function personalStats(Request $request)
    {
        $agent = $request->user();
        $period = $request->input('period', 'month'); // day, week, month, year

        $startDate = match($period) {
            'day' => Carbon::now()->startOfDay(),
            'week' => Carbon::now()->startOfWeek(),
            'month' => Carbon::now()->startOfMonth(),
            'year' => Carbon::now()->startOfYear(),
            default => Carbon::now()->startOfMonth(),
        };

        $endDate = match($period) {
            'day' => Carbon::now()->endOfDay(),
            'week' => Carbon::now()->endOfWeek(),
            'month' => Carbon::now()->endOfMonth(),
            'year' => Carbon::now()->endOfYear(),
            default => Carbon::now()->endOfMonth(),
        };

        $allBookings = Booking::where('assigned_agent_id', $agent->_id);
        $periodBookings = clone $allBookings;
        $periodBookings->whereBetween('created_at', [$startDate, $endDate]);

        $periodBookingsList = $periodBookings->get();
        $allBookingsList = $allBookings->get();

        $periodRevenue = (float) $periodBookingsList->where('payment_status', 'paid')->sum('total_price');
        $allRevenue = (float) $allBookingsList->where('payment_status', 'paid')->sum('total_price');

        // Thống kê theo trạng thái
        $statusBreakdown = $periodBookingsList->groupBy('status')->map->count();
        $paymentBreakdown = $periodBookingsList->groupBy('payment_status')->map->count();

        // Xu hướng theo ngày trong period
        $dailyTrend = $periodBookingsList->groupBy(function ($booking) {
            return Carbon::parse($booking->created_at)->format('Y-m-d');
        })->map(function ($bookings) {
            return [
                'count' => $bookings->count(),
                'revenue' => (float) $bookings->where('payment_status', 'paid')->sum('total_price'),
            ];
        });

        return $this->apiResponse(true, [
            'period' => [
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'type' => $period,
            ],
            'current_period' => [
                'total_bookings' => $periodBookingsList->count(),
                'revenue' => $periodRevenue,
                'confirmed' => $statusBreakdown->get('confirmed', 0),
                'completed' => $statusBreakdown->get('completed', 0),
                'cancelled' => $statusBreakdown->get('cancelled', 0),
                'pending' => $statusBreakdown->get('pending', 0),
                'paid_bookings' => $paymentBreakdown->get('paid', 0),
                'unpaid_bookings' => $paymentBreakdown->get('unpaid', 0),
                'partially_paid' => $paymentBreakdown->get('partially_paid', 0),
            ],
            'all_time' => [
                'total_bookings' => $allBookingsList->count(),
                'revenue' => $allRevenue,
                'cancel_rate' => round(($allBookingsList->where('status', 'cancelled')->count() / max(1, $allBookingsList->count())) * 100, 2),
                'close_rate' => round((($allBookingsList->where('status', 'confirmed')->count() + $allBookingsList->where('status', 'completed')->count()) / max(1, $allBookingsList->count())) * 100, 2),
            ],
            'daily_trend' => $dailyTrend,
        ], 'Lấy thống kê KPI thành công.');
    }
}