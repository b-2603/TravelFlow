<?php

use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\AgentController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\CustomerController;
use App\Http\Controllers\Api\GuideController;
use App\Http\Controllers\Api\PartnerController;
use App\Http\Controllers\Api\PaymentController;
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

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

Route::get('/tours', [TourController::class, 'index']);
Route::get('/tours/{slug}', [TourController::class, 'show']);
Route::get('/tours/{id}/reviews', [ReviewController::class, 'index']);

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
        Route::post('/manager/tours/{id}/submit', [TourController::class, 'submitForApproval']);
        Route::post('/tours', [TourController::class, 'store']);
        Route::put('/tours/{id}', [TourController::class, 'update']);
        Route::delete('/tours/{id}', [TourController::class, 'destroy']);
    });

    Route::middleware('role:accountant|admin|customer')->group(function () {
        Route::post('/payments', [PaymentController::class, 'store']);
        Route::get('/payments/{id}', [PaymentController::class, 'show']);
    });

    Route::middleware('role:accountant|admin')->group(function () {
        Route::get('/payments', [PaymentController::class, 'index']);
        Route::post('/payments/{id}/confirm', [PaymentController::class, 'confirm']);
        Route::post('/payments/{id}/refund', [PaymentController::class, 'refund']);
        Route::get('/accountant/refund-requests', [PaymentController::class, 'refundRequests']);
        Route::post('/accountant/refund-requests/{id}/approve', [PaymentController::class, 'approveRefund']);
        Route::post('/accountant/refund-requests/{id}/reject', [PaymentController::class, 'rejectRefund']);
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
        Route::get('/settings', [AdminController::class, 'settings']);
        Route::put('/settings', [AdminController::class, 'updateSettings']);
        Route::post('/tours/{id}/approve', [TourController::class, 'approve']);
        Route::post('/tours/{id}/reject', [TourController::class, 'reject']);
        Route::post('/tours/{id}/assign-guide', [AdminController::class, 'assignGuide']);
        Route::post('/reviews/{id}/approve', [ReviewController::class, 'approve']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
    });

    Route::middleware('role:guide|admin')->prefix('guide')->group(function () {
        Route::get('/assignments', [GuideController::class, 'assignments']);
        Route::post('/tours/{id}/update-status', [GuideController::class, 'updateStatus']);
    });

    Route::middleware('role:partner|admin')->prefix('partner')->group(function () {
        Route::get('/services', [PartnerController::class, 'services']);
        Route::put('/profile', [PartnerController::class, 'updateProfile']);
        Route::post('/services', [PartnerController::class, 'storeService']);
        Route::put('/services/{id}', [PartnerController::class, 'updateService']);
    });

    Route::middleware('role:agent|admin')->prefix('agent')->group(function () {
        Route::get('/dashboard', [AgentController::class, 'dashboard']);
        Route::get('/tours', [AgentController::class, 'tours']);
        Route::get('/customers', [AgentController::class, 'customers']);
        Route::get('/bookings', [AgentController::class, 'bookings']);
        Route::post('/bookings', [AgentController::class, 'storeBooking']);
        Route::put('/bookings/{id}', [AgentController::class, 'updateBooking']);
    });
});
