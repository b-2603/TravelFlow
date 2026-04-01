<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\UpdateProfileRequest;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class UserController extends Controller
{
    public function profile(Request $request)
    {
        return $this->apiResponse(true, new UserResource($request->user()), 'Lấy hồ sơ người dùng thành công.');
    }

    public function updateProfile(UpdateProfileRequest $request)
    {
        $user = $request->user();
        $payload = $request->validated();

        if ($request->hasFile('avatar_file')) {
            $payload['avatar'] = Storage::disk('public')->url(
                $request->file('avatar_file')->store('avatars', 'public')
            );
        }

        unset($payload['avatar_file']);

        $user->fill($payload);
        $user->save();

        return $this->apiResponse(true, new UserResource($user), 'Cập nhật hồ sơ thành công.');
    }

    public function changePassword(ChangePasswordRequest $request)
    {
        $user = $request->user();

        if (! Hash::check($request->string('current_password')->toString(), $user->password)) {
            return $this->apiResponse(false, null, 'Mật khẩu hiện tại không đúng.', 422);
        }

        $user->password = $request->string('password')->toString();
        $user->save();

        return $this->apiResponse(true, null, 'Đổi mật khẩu thành công.');
    }
}
