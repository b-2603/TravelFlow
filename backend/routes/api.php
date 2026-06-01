<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BankTransferWebhookController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\GuideController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\NewsPromotionController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\TourController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'data' => [
            'service' => 'travel-management-api',
            'status' => 'ok',
        ],
        'message' => 'API is reachable.',
        'code' => 200,
    ]);
});

Route::get('/bootstrap', function (Request $request) {
    return response()->json([
        'success' => true,
        'data' => [
            'frontend_url' => env('FRONTEND_URL'),
            'authenticated' => (bool) $request->user(),
        ],
        'message' => 'Prompt 3 route bootstrap loaded.',
        'code' => 200,
    ]);
});

Route::get('/settings/payment', [AdminController::class, 'paymentSettings']);
Route::post('/webhooks/bank-transfer', [BankTransferWebhookController::class, 'handle']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::get('/tours', [TourController::class, 'index']);
Route::get('/tours/{slug}', [TourController::class, 'show']);
Route::get('/tours/{id}/reviews', [ReviewController::class, 'index']);
Route::get('/news-promotions', [NewsPromotionController::class, 'index']);
Route::get('/news-promotions/{id}', [NewsPromotionController::class, 'show']);

Route::middleware('jwt')->group(function () {
    Route::prefix('auth')->group(function () {
        Route::get('/me', [AuthController::class, 'me']);
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/refresh-token', [AuthController::class, 'refreshToken']);
    });

    Route::middleware('role:customer|admin|tour_manager|agent|accountant|guide|partner')->group(function () {
        Route::get('/bookings', [BookingController::class, 'index']);
        Route::post('/bookings', [BookingController::class, 'store']);
        Route::get('/bookings/{id}', [BookingController::class, 'show']);
        Route::put('/bookings/{id}', [BookingController::class, 'update']);
        Route::get('/bookings/{id}/document', [BookingController::class, 'document']);
        Route::get('/bookings/{id}/cancel-preview', [BookingController::class, 'cancelPreview']);
        Route::post('/bookings/{id}/cancel', [BookingController::class, 'cancel']);
        Route::post('/reviews', [ReviewController::class, 'store']);
    });

    Route::middleware('role:customer|admin|tour_manager|agent|accountant|guide|partner')->group(function () {
        Route::get('/profile', [UserController::class, 'profile']);
        Route::put('/profile', [UserController::class, 'updateProfile']);
        Route::post('/profile/change-password', [UserController::class, 'changePassword']);
    });

    Route::middleware('role:customer|admin')->prefix('customer')->group(function () {
        Route::get('/dashboard', [CustomerController::class, 'dashboard']);
        Route::get('/favorites', [CustomerController::class, 'favorites']);
        Route::post('/favorites/{tourId}', [CustomerController::class, 'addFavorite']);
        Route::delete('/favorites/{tourId}', [CustomerController::class, 'removeFavorite']);
        Route::get('/supports', [CustomerController::class, 'supports']);
        Route::post('/supports', [CustomerController::class, 'createSupport']);
        Route::get('/refund-requests', [CustomerController::class, 'refundRequests']);
        Route::post('/refund-requests', [CustomerController::class, 'createRefundRequest']);
    });

    Route::middleware('role:tour_manager|admin')->group(function () {
        Route::get('/manager/tours', [TourController::class, 'managerIndex']);
        Route::get('/manager/meta', [TourController::class, 'managerMeta']);
        Route::get('/manager/news-promotions', [NewsPromotionController::class, 'index']);
        Route::post('/manager/news-promotions', [NewsPromotionController::class, 'store']);
        Route::put('/manager/news-promotions/{id}', [NewsPromotionController::class, 'update']);
        Route::delete('/manager/news-promotions/{id}', [NewsPromotionController::class, 'destroy']);
        Route::get('/manager/tours/{id}', [TourController::class, 'managerShow']);
        Route::post('/manager/tours/{id}/submit', [TourController::class, 'submitForApproval']);
        Route::post('/manager/tours/{id}/toggle-pin', [TourController::class, 'togglePinned']);
        Route::post('/manager/tours/{id}/duplicate', [TourController::class, 'duplicate']);
        Route::post('/tours', [TourController::class, 'store']);
        Route::put('/tours/{id}', [TourController::class, 'update']);
        Route::delete('/tours/{id}', [TourController::class, 'destroy']);
    });

    Route::middleware('role:accountant|admin|customer')->group(function () {
        Route::post('/payments', [PaymentController::class, 'store']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
        Route::post('/payments/{id}/customer-confirm', [PaymentController::class, 'customerConfirm']);
    });

    Route::middleware('role:accountant|admin')->group(function () {
        Route::get('/accountant/dashboard', [PaymentController::class, 'dashboard']);
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/payments/{id}/confirm', [PaymentController::class, 'confirm']);
        Route::get('/accountant/logs', [AdminController::class, 'logs']);
        Route::get('/accountant/refund-requests', [PaymentController::class, 'refundRequests']);
        Route::post('/accountant/refund-requests/{id}/approve', [PaymentController::class, 'approveRefund']);
        Route::post('/accountant/refund-requests/{id}/reject', [PaymentController::class, 'rejectRefund']);
        Route::post('/accountant/refund-requests/{id}/refunded', [PaymentController::class, 'markRefunded']);
        Route::get('/accountant/partner-liabilities', [PaymentController::class, 'partnerLiabilities']);
        Route::get('/accountant/reports', [PaymentController::class, 'financeReport']);
        Route::get('/accountant/reports/export', [PaymentController::class, 'exportFinanceReport']);
    });

    Route::middleware('role:admin|accountant')->prefix('admin')->group(function () {
        Route::get('/bookings', [BookingController::class, 'adminIndex']);
        Route::post('/bookings/{id}/confirm', [BookingController::class, 'confirm']);
    });

    Route::middleware('role:admin')->prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/users', [AdminController::class, 'users']);
        Route::post('/users', [AdminController::class, 'createStaff']);
        Route::get('/users/{id}', [AdminController::class, 'showUser']);
        Route::get('/tours', [AdminController::class, 'tours']);
        Route::get('/guide-assignments', [AdminController::class, 'guideAssignments']);
        Route::put('/users/{id}', [AdminController::class, 'updateUser']);
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetPassword']);
        Route::post('/users/{id}/lock', [AdminController::class, 'lockUser']);
        Route::post('/users/{id}/unlock', [AdminController::class, 'unlockUser']);
        Route::get('/logs', [AdminController::class, 'logs']);
        Route::get('/partners', [AdminController::class, 'partners']);
        Route::post('/partners/{id}/approve', [AdminController::class, 'approvePartner']);
        Route::post('/partners/{id}/reject', [AdminController::class, 'rejectPartner']);
        Route::get('/supports', [AdminController::class, 'supports']);
        Route::post('/supports/{id}/reply', [AdminController::class, 'replySupport']);
        Route::get('/reviews', [AdminController::class, 'reviews']);
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
        Route::post('/tours/{id}/approve', [TourController::class, 'approve']);
        Route::post('/tours/{id}/reject', [TourController::class, 'reject']);
        Route::post('/tours/{id}/assign-guide', [AdminController::class, 'assignGuide']);
        Route::post('/reviews/{id}/approve', [ReviewController::class, 'approve']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    });

    Route::middleware('role:guide|admin')->prefix('guide')->group(function () {
        // Dashboard và thống kê
        Route::get('/dashboard', [GuideController::class, 'dashboard']);
        Route::get('/stats', [GuideController::class, 'personalStats']);
        
        // Quản lý tour được phân công
        Route::get('/assignments', [GuideController::class, 'assignments']);
        Route::get('/assignments/{tourId}', [GuideController::class, 'showAssignment']);
        Route::get('/assignments/{tourId}/{departureDate}', [GuideController::class, 'showAssignment']);
        
        // Điểm danh và tiến trình
        Route::post('/tours/{id}/update-status', [GuideController::class, 'updateStatus']);
        Route::post('/tours/{tourId}/attendance/{departureDate}', [GuideController::class, 'takeAttendance']);
        Route::get('/tours/{tourId}/progress', [GuideController::class, 'progressHistory']);
        
        // Thông tin đoàn và đối tác
        Route::get('/tours/{tourId}/passengers', [GuideController::class, 'passengers']);
        Route::get('/tours/{tourId}/partners', [GuideController::class, 'partners']);
        
        // Báo cáo và ghi chú
        Route::post('/tours/{tourId}/report-incident', [GuideController::class, 'reportIncident']);
        Route::post('/tours/{tourId}/day-note', [GuideController::class, 'submitDayNote']);
        
        // Thông báo
        Route::get('/notifications', [GuideController::class, 'notifications']);
    });

    Route::middleware('role:partner|admin')->prefix('partner')->group(function () {
        Route::get('/dashboard', [PartnerController::class, 'dashboard']);
        Route::get('/services', [PartnerController::class, 'services']);
        Route::put('/profile', [PartnerController::class, 'updateProfile']);
        Route::post('/services', [PartnerController::class, 'storeService']);
        Route::put('/services/{id}', [PartnerController::class, 'updateService']);
        Route::post('/services/{id}/toggle-status', [PartnerController::class, 'toggleServiceStatus']);
        Route::delete('/services/{id}', [PartnerController::class, 'deleteService']);
    });

    Route::middleware('role:agent|admin')->prefix('agent')->group(function () {
        // Dashboard và thống kê
        Route::get('/dashboard', [AgentController::class, 'dashboard']);
        Route::get('/stats', [AgentController::class, 'personalStats']);
        
        // Quản lý tour để tư vấn
        Route::get('/tours', [AgentController::class, 'tours']);
        Route::get('/tours/{id}', [AgentController::class, 'showTour']);
        
        // Quản lý khách hàng
        Route::get('/customers', [AgentController::class, 'customers']);
        Route::get('/customers/{id}', [AgentController::class, 'showCustomer']);
        
        // Quản lý booking phụ trách
        Route::get('/bookings', [AgentController::class, 'bookings']);
        Route::get('/bookings/{id}', [AgentController::class, 'showBooking']);
        Route::post('/bookings', [AgentController::class, 'storeBooking']);
        Route::put('/bookings/{id}', [AgentController::class, 'updateBooking']);
        
        // Xác nhận thông tin hành khách
        Route::post('/bookings/{id}/confirm-passenger', [AgentController::class, 'confirmPassengerInfo']);
        
        // Xử lý hủy booking
        Route::post('/bookings/{id}/cancel', [AgentController::class, 'processCancellation']);
        
        // Gửi reminder trước chuyến đi
        Route::post('/bookings/{id}/send-reminder', [AgentController::class, 'sendPreDepartureReminder']);
        
        // Hỗ trợ sự cố
        Route::get('/support-tickets', [AgentController::class, 'supportTickets']);
        Route::post('/support-tickets/{ticketId}/reply', [AgentController::class, 'replySupportTicket']);
        
        // Tạo custom tour
        Route::post('/custom-tours', [AgentController::class, 'createCustomTour']);
    });
});
