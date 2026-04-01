<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Foundation\Validation\ValidatesRequests;

abstract class Controller
{
    use AuthorizesRequests;
    use DispatchesJobs;
    use ValidatesRequests;

    protected function apiResponse(bool $success, mixed $data = null, string $message = '', int $code = 200)
    {
        return response()->json([
            'success' => $success,
            'data' => $data,
            'message' => $message,
            'code' => $code,
        ], $code);
    }
}
