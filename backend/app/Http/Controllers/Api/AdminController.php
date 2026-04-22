<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AdminResetPasswordRequest;
use App\Http\Requests\CreateStaffRequest;
use App\Http\Requests\SupportReplyRequest;
use App\Http\Requests\SystemSettingUpdateRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Resources\ActivityLogResource;
use App\Http\Resources\TourResource;
use App\Http\Resources\UserResource;
use App\Models\ActivityLog;
use App\Models\Booking;
use App\Models\Partner;
use App\Models\Payment;
use App\Models\SupportTicket;
use App\Models\SystemSetting;
use App\Models\Tour;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AdminController extends Controller
{
    public function dashboard()
    {
        $today = Carbon::today();
        $thirtyDaysAgo = Carbon::now()->subDays(30);

        $monthlyRevenue = collect(range(5, 0))->map(function ($monthOffset) {
            $start = now()->copy()->startOfMonth()->subMonths($monthOffset);
            $end = $start->copy()->endOfMonth();

            return [
                'label' => 'Tháng '.$start->format('m/Y'),
                'value' => (float) Payment::where('status', 'success')
                    ->whereBetween('paid_at', [$start, $end])
                    ->sum('amount'),
            ];
        })->values();

        return $this->apiResponse(true, [
            'total_revenue' => (float) Payment::where('status', 'success')->sum('amount'),
            'bookings_today' => Booking::where('created_at', '>=', $today)->count(),
            'tours_active' => Tour::where('status', 'approved')->whereNull('deleted_at')->count(),
            'users_new_30_days' => User::where('created_at', '>=', $thirtyDaysAgo)->count(),
            'pending_partners' => Partner::where('status', 'pending')->count(),
            'open_support_tickets' => SupportTicket::where('status', 'open')->count(),
            'locked_users' => User::where('status', 'locked')->count(),
            'monthly_revenue' => $monthlyRevenue,
            'booking_status' => [
                'pending' => Booking::where('status', 'pending')->count(),
                'confirmed' => Booking::where('status', 'confirmed')->count(),
                'cancelled' => Booking::where('status', 'cancelled')->count(),
                'completed' => Booking::where('status', 'completed')->count(),
            ],
        ], 'Lấy thống kê tổng quan thành công.');
    }

    public function users(Request $request)
    {
        $query = User::query()->with(['partnerProfile'])->orderByDesc('created_at');

        if ($request->filled('role')) {
            $query->where('role', $request->string('role')->toString());
        }

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        if ($request->filled('search')) {
            $search = $request->string('search')->toString();
            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', '%'.$search.'%')
                    ->orWhere('username', 'like', '%'.$search.'%')
                    ->orWhere('email', 'like', '%'.$search.'%');
            });
        }

        $users = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => UserResource::collection($users->getCollection()),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ], 'Lấy danh sách người dùng thành công.');
    }

    public function showUser(string $id)
    {
        $user = User::with(['partnerProfile', 'guideProfile'])->find($id);

        if (! $user) {
            return $this->apiResponse(false, null, 'Không tìm thấy người dùng.', 404);
        }

        $recentLogs = ActivityLog::where('user_id', $user->_id)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get();

        return $this->apiResponse(true, [
            'user' => new UserResource($user),
            'recent_logs' => ActivityLogResource::collection($recentLogs),
            'stats' => [
                'bookings_count' => $user->bookings()->count(),
                'payments_count' => $user->payments()->count(),
                'reviews_count' => $user->reviews()->count(),
            ],
        ], 'Lấy chi tiết người dùng thành công.');
    }

    public function createStaff(CreateStaffRequest $request)
    {
        $payload = $request->validated();

        if (User::where('email', $payload['email'])->exists()) {
            return $this->apiResponse(false, null, 'Email đã tồn tại.', 422);
        }

        if (User::where('username', $payload['username'])->exists()) {
            return $this->apiResponse(false, null, 'Tên đăng nhập đã tồn tại.', 422);
        }

        $payload['status'] = 'active';
        $payload['role_name_vi'] = User::roleNameMap()[$payload['role']] ?? $payload['role'];

        if ($request->hasFile('avatar_file')) {
            $payload['avatar'] = Storage::disk('public')->url(
                $request->file('avatar_file')->store('avatars', 'public')
            );
        }

        unset($payload['avatar_file']);

        $user = User::create($payload);

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'staff_created',
            'module' => 'admin',
            'detail' => [
                'created_user_id' => (string) $user->_id,
                'role' => $user->role,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new UserResource($user), 'Tạo tài khoản nhân sự thành công.', 201);
    }

    public function tours(Request $request)
    {
        $query = Tour::query()->with(['creator', 'guide'])->whereNull('deleted_at')->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $tours = $query->paginate(20);

        return $this->apiResponse(true, [
            'items' => TourResource::collection($tours->getCollection()),
            'pagination' => [
                'current_page' => $tours->currentPage(),
                'last_page' => $tours->lastPage(),
                'per_page' => $tours->perPage(),
                'total' => $tours->total(),
            ],
        ], 'Lấy danh sách tour thành công.');
    }

    public function updateUser(UpdateUserRequest $request, string $id)
    {
        $user = User::find($id);

        if (! $user) {
            return $this->apiResponse(false, null, 'Không tìm thấy người dùng.', 404);
        }

        $payload = $request->validated();

        if (! empty($payload['role'])) {
            $payload['role_name_vi'] = User::roleNameMap()[$payload['role']] ?? $payload['role'];
        }

        $user->fill($payload);
        $user->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'user_updated',
            'module' => 'admin',
            'detail' => [
                'target_user_id' => (string) $user->_id,
                'changes' => array_keys($payload),
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new UserResource($user), 'Cập nhật người dùng thành công.');
    }

    public function resetPassword(AdminResetPasswordRequest $request, string $id)
    {
        $user = User::find($id);

        if (! $user) {
            return $this->apiResponse(false, null, 'Không tìm thấy người dùng.', 404);
        }

        $user->password = $request->string('password')->toString();
        $user->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'password_reset_by_admin',
            'module' => 'admin',
            'detail' => [
                'target_user_id' => (string) $user->_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new UserResource($user), 'Đặt lại mật khẩu thành công.');
    }

    public function lockUser(string $id)
    {
        return $this->setUserStatus($id, 'locked', 'Khóa tài khoản thành công.');
    }

    public function unlockUser(string $id)
    {
        return $this->setUserStatus($id, 'active', 'Mở khóa tài khoản thành công.');
    }

    public function logs(Request $request)
    {
        $query = ActivityLog::query()->orderByDesc('created_at');

        if ($request->filled('user')) {
            $query->where('user_id', $request->string('user')->toString());
        }

        if ($request->filled('module')) {
            $query->where('module', $request->string('module')->toString());
        }

        if ($request->filled('date')) {
            $date = Carbon::parse($request->input('date'));
            $query->whereBetween('created_at', [$date->copy()->startOfDay(), $date->copy()->endOfDay()]);
        }

        $logs = $query->paginate(50);

        return $this->apiResponse(true, [
            'items' => ActivityLogResource::collection($logs->getCollection()),
            'pagination' => [
                'current_page' => $logs->currentPage(),
                'last_page' => $logs->lastPage(),
                'per_page' => $logs->perPage(),
                'total' => $logs->total(),
            ],
        ], 'Lấy nhật ký hoạt động thành công.');
    }

    public function assignGuide(Request $request, string $id)
    {
        $request->validate([
            'guide_id' => ['required', 'string'],
            'departure_date' => ['nullable', 'date'],
        ]);

        $tour = Tour::find($id);

        if (! $tour) {
            return $this->apiResponse(false, null, 'Không tìm thấy tour.', 404);
        }

        $guide = User::where('_id', $request->string('guide_id')->toString())
            ->where('role', 'guide')
            ->where('status', 'active')
            ->first();

        if (! $guide) {
            return $this->apiResponse(false, null, 'Không tìm thấy hướng dẫn viên.', 404);
        }

        $departureDate = $request->filled('departure_date')
            ? Carbon::parse($request->input('departure_date'))->toDateString()
            : null;

        if ($departureDate) {
            $tour->departures = collect($tour->departures ?? [])
                ->map(function ($departure) use ($departureDate, $guide) {
                    if (($departure['date'] ?? null) === $departureDate) {
                        $departure['assigned_guide_id'] = $guide->_id;
                    }

                    return $departure;
                })
                ->values()
                ->all();
        } else {
            $tour->assigned_guide_id = $guide->_id;
        }

        $tour->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'guide_assigned',
            'module' => 'tours',
            'detail' => [
                'tour_id' => (string) $tour->_id,
                'guide_id' => (string) $guide->_id,
                'departure_date' => $departureDate,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new TourResource($tour->load(['creator', 'guide'])), 'Phân công hướng dẫn viên thành công.');
    }

    public function guideAssignments()
    {
        $bookingGroups = Booking::with(['tour', 'user'])
            ->whereIn('status', ['pending', 'confirmed'])
            ->orderByDesc('created_at')
            ->get()
            ->filter(fn ($booking) => $booking->tour && $booking->tour->status === 'approved')
            ->groupBy(fn ($booking) => (string) $booking->tour_id.'|'.optional($booking->departure_date)->toDateString());

        $items = $bookingGroups->map(function ($groupedBookings, $groupKey) {
            [$tourId, $departureDate] = explode('|', $groupKey);
            $tour = optional($groupedBookings->first())->tour;

            if (! $tour) {
                return null;
            }

            $departure = collect($tour->departures ?? [])->firstWhere('date', $departureDate) ?? [];
            $guideId = (string) ($departure['assigned_guide_id'] ?? $tour->assigned_guide_id ?? '');
            $guide = $guideId ? User::find($guideId) : null;

            return [
                'assignment_key' => $groupKey,
                'tour_id' => (string) $tour->_id,
                'tour_title' => $tour->title,
                'tour_slug' => $tour->slug,
                'destination' => $tour->destination,
                'category' => $tour->category,
                'departure_date' => $departureDate,
                'departure_status' => $departure['status'] ?? 'active',
                'bookings_count' => $groupedBookings->count(),
                'passenger_count' => (int) $groupedBookings->sum('num_pax'),
                'assignment_status' => $guide ? 'assigned' : 'unassigned',
                'guide' => $guide ? [
                    'id' => (string) $guide->_id,
                    'name' => $guide->name,
                    'email' => $guide->email,
                ] : null,
                'customers' => $groupedBookings->map(function ($booking) {
                    return [
                        'booking_id' => (string) $booking->_id,
                        'name' => $booking->user?->name,
                        'email' => $booking->user?->email,
                        'phone' => $booking->user?->phone,
                        'num_pax' => (int) $booking->num_pax,
                        'status' => $booking->status,
                    ];
                })->values()->all(),
            ];
        })->filter()->sortBy([
            ['departure_date', 'asc'],
            ['tour_title', 'asc'],
        ])->values();

        return $this->apiResponse(true, $items, 'Lấy danh sách điều phối hướng dẫn viên thành công.');
    }

    public function partners(Request $request)
    {
        $query = Partner::with(['user'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $items = $query->get()->map(function ($partner) {
            return [
                'id' => (string) $partner->_id,
                'company_name' => $partner->company_name,
                'service_type' => $partner->service_type,
                'status' => $partner->status,
                'contact_info' => $partner->contact_info,
                'user' => $partner->user ? [
                    'id' => (string) $partner->user->_id,
                    'name' => $partner->user->name,
                    'email' => $partner->user->email,
                    'phone' => $partner->user->phone,
                ] : null,
                'created_at' => optional($partner->created_at)->toISOString(),
            ];
        })->values();

        return $this->apiResponse(true, ['items' => $items], 'Lấy danh sách đối tác thành công.');
    }

    public function approvePartner(Request $request, string $id)
    {
        $partner = Partner::find($id);

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy đối tác.', 404);
        }

        $partner->status = 'active';
        $partner->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'partner_approved',
            'module' => 'admin',
            'detail' => [
                'partner_id' => (string) $partner->_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, ['id' => (string) $partner->_id], 'Đã duyệt đối tác thành công.');
    }

    public function rejectPartner(Request $request, string $id)
    {
        $partner = Partner::find($id);

        if (! $partner) {
            return $this->apiResponse(false, null, 'Không tìm thấy đối tác.', 404);
        }

        $partner->status = 'inactive';
        $partner->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'partner_rejected',
            'module' => 'admin',
            'detail' => [
                'partner_id' => (string) $partner->_id,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, ['id' => (string) $partner->_id], 'Đã từ chối đối tác.');
    }

    public function supports(Request $request)
    {
        $query = SupportTicket::with(['user', 'booking.tour', 'handledBy'])->orderByDesc('created_at');

        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }

        $items = $query->get()->map(function ($ticket) {
            return [
                'id' => (string) $ticket->_id,
                'subject' => $ticket->subject,
                'message' => $ticket->message,
                'status' => $ticket->status,
                'reply' => $ticket->reply,
                'handled_at' => optional($ticket->handled_at)->toISOString(),
                'handler' => $ticket->handledBy ? [
                    'id' => (string) $ticket->handledBy->_id,
                    'name' => $ticket->handledBy->name,
                    'role' => $ticket->handledBy->role,
                    'role_name_vi' => $ticket->handledBy->role_name_vi,
                ] : null,
                'user' => $ticket->user ? [
                    'id' => (string) $ticket->user->_id,
                    'name' => $ticket->user->name,
                    'email' => $ticket->user->email,
                ] : null,
                'booking' => $ticket->booking ? [
                    'id' => (string) $ticket->booking->_id,
                    'tour' => $ticket->booking->tour ? [
                        'id' => (string) $ticket->booking->tour->_id,
                        'title' => $ticket->booking->tour->title,
                    ] : null,
                ] : null,
                'created_at' => optional($ticket->created_at)->toISOString(),
            ];
        })->values();

        return $this->apiResponse(true, ['items' => $items], 'Lấy danh sách ticket hỗ trợ thành công.');
    }

    public function replySupport(SupportReplyRequest $request, string $id)
    {
        $ticket = SupportTicket::find($id);

        if (! $ticket) {
            return $this->apiResponse(false, null, 'Không tìm thấy ticket hỗ trợ.', 404);
        }

        $status = $request->input('status') ?: 'answered';

        $ticket->reply = $request->string('reply')->toString();
        $ticket->status = $status;
        $ticket->handled_by = $request->user()->_id;
        $ticket->handled_at = Carbon::now();
        $ticket->save();

        ActivityLog::create([
            'user_id' => $request->user()->_id,
            'action' => 'support_ticket_replied',
            'module' => 'admin',
            'detail' => [
                'ticket_id' => (string) $ticket->_id,
                'status' => $status,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, ['id' => (string) $ticket->_id], 'Đã phản hồi ticket hỗ trợ.');
    }

    public function settings()
    {
        $settings = SystemSetting::first();

        if (! $settings) {
            $settings = SystemSetting::create([
                'company_name' => 'TravelFlow',
                'logo' => null,
                'address' => 'TP. Hồ Chí Minh',
                'hotline' => '1900 0000',
                'bank_name' => 'TPBank',
                'bank_code' => 'TPB',
                'bank_account_number' => '0328754062',
                'bank_account_name' => 'NGUYEN TRAN THAI BAO',
                'bank_branch' => '',
                'payment_note_prefix' => 'BOOKING',
                'payment_methods' => ['bank', 'momo', 'vnpay'],
                'cancellation_policy' => [
                    'tiers' => [
                        [
                            'key' => 'flex_15_plus',
                            'label' => 'Hủy trước 15+ ngày',
                            'min_days' => 15,
                            'max_days' => null,
                            'refund_rate' => 1.0,
                            'fee_rate' => 0.0,
                            'processing_days' => [3, 5],
                            'refund_text' => 'Hoàn 100%, miễn phí hoàn toàn',
                            'extra_note' => 'Nhận tiền về trong 3–5 ngày làm việc',
                        ],
                        [
                            'key' => 'care_7_14',
                            'label' => 'Hủy trước 7–14 ngày',
                            'min_days' => 7,
                            'max_days' => 14,
                            'refund_rate' => 0.7,
                            'fee_rate' => 0.3,
                            'processing_days' => [5, 7],
                            'refund_text' => 'Hoàn 70%, công ty giữ lại 30% làm phí hủy',
                        ],
                        [
                            'key' => 'late_3_6',
                            'label' => 'Hủy trước 3–6 ngày',
                            'min_days' => 3,
                            'max_days' => 6,
                            'refund_rate' => 0.5,
                            'fee_rate' => 0.5,
                            'processing_days' => [5, 7],
                            'refund_text' => 'Hoàn 50%, công ty đã đặt cọc nhiều dịch vụ',
                        ],
                        [
                            'key' => 'urgent_0_2',
                            'label' => 'Hủy trong 0–2 ngày',
                            'min_days' => 0,
                            'max_days' => 2,
                            'refund_rate' => 0.0,
                            'fee_rate' => 1.0,
                            'processing_days' => [0, 0],
                            'refund_text' => 'Không hoàn tiền mặt',
                            'extra_note' => 'Có thể dời ngày 1 lần miễn phí',
                        ],
                    ],
                    'alternatives' => [
                        ['key' => 'reschedule', 'label' => 'Dời ngày khởi hành'],
                        ['key' => 'change_tour', 'label' => 'Đổi sang tour tương đương'],
                        ['key' => 'voucher', 'label' => 'Nhận voucher bảo lưu 12 tháng'],
                    ],
                ],
                'email_templates' => [
                    'booking_confirmation' => 'Xác nhận booking thành công',
                    'refund_notice' => 'Thông báo hoàn tiền',
                ],
                'featured_destinations' => ['Đà Nẵng', 'Phú Quốc', 'Đà Lạt'],
                'banner_messages' => ['Ưu đãi hè 2026', 'Đặt sớm giữ giá tốt'],
            ]);
        }

        return $this->apiResponse(true, $settings, 'Lấy cấu hình hệ thống thành công.');
    }

    public function paymentSettings()
    {
        $settings = SystemSetting::first();

        $defaults = [
            'company_name' => 'TravelFlow',
            'logo' => null,
            'address' => 'TP. Hồ Chí Minh',
            'hotline' => '1900 0000',
            'bank_name' => 'TPBank',
            'bank_code' => 'TPB',
            'bank_account_number' => '0328754062',
            'bank_account_name' => 'NGUYEN TRAN THAI BAO',
            'bank_branch' => '',
            'payment_note_prefix' => 'BOOKING',
            'payment_methods' => ['bank', 'momo', 'vnpay'],
        ];

        if (! $settings) {
            $settings = SystemSetting::create($defaults);
        } else {
            // Older DB records may exist but miss payment fields -> backfill once to enable QR immediately.
            $dirty = false;
            foreach ([
                'company_name',
                'hotline',
                'bank_name',
                'bank_code',
                'bank_account_number',
                'bank_account_name',
                'bank_branch',
                'payment_note_prefix',
            ] as $key) {
                $value = $settings->{$key} ?? null;
                if ($value === null || $value === '') {
                    $settings->{$key} = $defaults[$key];
                    $dirty = true;
                }
            }
            if ($dirty) {
                $settings->save();
            }
        }

        return $this->apiResponse(true, [
            'company_name' => $settings->company_name,
            'logo' => $settings->logo,
            'hotline' => $settings->hotline,
            'bank_name' => $settings->bank_name,
            'bank_code' => $settings->bank_code,
            'bank_account_number' => $settings->bank_account_number,
            'bank_account_name' => $settings->bank_account_name,
            'bank_branch' => $settings->bank_branch,
            'payment_note_prefix' => $settings->payment_note_prefix,
        ], 'Lấy cấu hình thanh toán thành công.');
    }

    public function updateSettings(SystemSettingUpdateRequest $request)
    {
        $settings = SystemSetting::first() ?? new SystemSetting();
        $settings->fill($request->validated());
        $settings->save();

        return $this->apiResponse(true, $settings, 'Cập nhật cấu hình hệ thống thành công.');
    }

    private function setUserStatus(string $id, string $status, string $message)
    {
        $user = User::find($id);

        if (! $user) {
            return $this->apiResponse(false, null, 'Không tìm thấy người dùng.', 404);
        }

        $user->status = $status;
        $user->save();

        ActivityLog::create([
            'user_id' => auth()->id(),
            'action' => $status === 'locked' ? 'user_locked' : 'user_unlocked',
            'module' => 'admin',
            'detail' => [
                'target_user_id' => (string) $user->_id,
            ],
            'ip_address' => request()->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new UserResource($user), $message);
    }
}
