<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\PasswordResetToken;
use App\Models\User;
use App\Services\EmailService;
use App\Services\JwtService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function __construct(
        private readonly JwtService $jwtService,
        private readonly EmailService $emailService
    ) {
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'address' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return $this->apiResponse(false, ['errors' => $validator->errors()], 'Dữ liệu không hợp lệ.', 422);
        }

        $user = User::create([
            'name' => $request->string('name')->toString(),
            'username' => $this->generateUsername($request->string('name')->toString()),
            'email' => strtolower($request->string('email')->toString()),
            'password' => $request->string('password')->toString(),
            'phone' => $request->input('phone'),
            'address' => $request->input('address'),
            'role' => 'customer',
            'role_name_vi' => User::roleNameMap()['customer'],
            'status' => 'active',
        ]);

        $tokenData = $this->jwtService->generateToken($user);

        ActivityLog::create([
            'user_id' => $user->_id,
            'action' => 'register',
            'module' => 'auth',
            'detail' => [
                'email' => $user->email,
                'username' => $user->username,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, [
            'token' => $tokenData['token'],
            'user' => $user,
            'expires_in' => $tokenData['expires_in'],
        ], 'Đăng ký tài khoản thành công.', 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'login' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'max:255'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return $this->apiResponse(false, ['errors' => $validator->errors()], 'Dữ liệu không hợp lệ.', 422);
        }

        $identifier = trim((string) $request->input('login', $request->input('email', '')));

        if ($identifier === '') {
            return $this->apiResponse(false, [
                'errors' => [
                    'login' => ['Vui lòng nhập email hoặc tên đăng nhập.'],
                ],
            ], 'Dữ liệu không hợp lệ.', 422);
        }

        $loginKey = Str::lower($identifier);

        $user = User::where('email', $loginKey)
            ->orWhere('username', $loginKey)
            ->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return $this->apiResponse(false, null, 'Sai thông tin đăng nhập.', 401);
        }

        if ($user->status === 'locked') {
            return $this->apiResponse(false, null, 'Tài khoản đang bị khóa.', 403);
        }

        $tokenData = $this->jwtService->generateToken($user);

        ActivityLog::create([
            'user_id' => $user->_id,
            'action' => 'login',
            'module' => 'auth',
            'detail' => [
                'email' => $user->email,
                'username' => $user->username,
            ],
            'ip_address' => $request->ip(),
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, [
            'token' => $tokenData['token'],
            'user' => $user,
            'expires_in' => $tokenData['expires_in'],
        ], 'Đăng nhập thành công.');
    }

    public function logout(Request $request)
    {
        $token = $request->attributes->get('jwtToken');
        $user = $request->user();

        if ($token) {
            $this->jwtService->blacklistToken($token);
        }

        if ($user) {
            ActivityLog::create([
                'user_id' => $user->_id,
                'action' => 'logout',
                'module' => 'auth',
                'detail' => [
                    'email' => $user->email,
                    'username' => $user->username,
                ],
                'ip_address' => $request->ip(),
                'created_at' => Carbon::now(),
            ]);
        }

        return $this->apiResponse(true, null, 'Đăng xuất thành công.');
    }

    public function refreshToken(Request $request)
    {
        $user = $request->user();

        if (! $user) {
            return $this->apiResponse(false, null, 'Chưa xác thực.', 401);
        }

        $currentToken = $request->attributes->get('jwtToken');

        if ($currentToken) {
            $this->jwtService->blacklistToken($currentToken);
        }

        $tokenData = $this->jwtService->generateToken($user);

        return $this->apiResponse(true, [
            'token' => $tokenData['token'],
            'user' => $user,
            'expires_in' => $tokenData['expires_in'],
        ], 'Làm mới phiên đăng nhập thành công.');
    }

    public function me(Request $request)
    {
        $user = $request->user();
        $payload = $request->attributes->get('jwtPayload');

        return $this->apiResponse(true, [
            'user' => $user,
            'payload' => $payload,
        ], 'Lấy thông tin người dùng thành công.');
    }

    public function forgotPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
        ]);

        if ($validator->fails()) {
            return $this->apiResponse(false, ['errors' => $validator->errors()], 'Dữ liệu không hợp lệ.', 422);
        }

        $email = strtolower($request->string('email')->toString());
        $user = User::where('email', $email)->first();

        if (! $user) {
            return $this->apiResponse(true, null, 'Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.');
        }

        $plainToken = Str::random(64);

        PasswordResetToken::updateOrCreate(
            ['email' => $email],
            [
                'email' => $email,
                'token' => Hash::make($plainToken),
                'expires_at' => Carbon::now()->addHour(),
                'created_at' => Carbon::now(),
            ]
        );

        $this->emailService->sendPasswordReset($email, $plainToken);

        return $this->apiResponse(true, null, 'Nếu email tồn tại, hệ thống đã gửi hướng dẫn đặt lại mật khẩu.');
    }

    public function resetPassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return $this->apiResponse(false, ['errors' => $validator->errors()], 'Dữ liệu không hợp lệ.', 422);
        }

        $email = strtolower($request->string('email')->toString());
        $resetRecord = PasswordResetToken::where('email', $email)->first();

        if (! $resetRecord || Carbon::parse($resetRecord->expires_at)->isPast()) {
            return $this->apiResponse(false, null, 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
        }

        if (! Hash::check($request->string('token')->toString(), $resetRecord->token)) {
            return $this->apiResponse(false, null, 'Mã đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.', 400);
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            return $this->apiResponse(false, null, 'Không tìm thấy người dùng.', 404);
        }

        $user->password = $request->string('password')->toString();
        $user->save();
        $resetRecord->delete();

        return $this->apiResponse(true, null, 'Đặt lại mật khẩu thành công.');
    }

    private function generateUsername(string $name): string
    {
        $base = Str::slug($name, '_');

        if ($base === '') {
            $base = 'nguoi_dung';
        }

        $username = Str::lower($base);
        $suffix = 1;

        while (User::where('username', $username)->exists()) {
            $username = Str::lower($base.'_'.$suffix);
            $suffix++;
        }

        return $username;
    }
}
