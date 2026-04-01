<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreReviewRequest;
use App\Http\Resources\ReviewResource;
use App\Models\Review;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;

class ReviewController extends Controller
{
    public function index(string $id)
    {
        $reviews = Review::where('tour_id', $id)
            ->where('status', 'approved')
            ->with('user')
            ->orderByDesc('created_at')
            ->get();

        return $this->apiResponse(true, ReviewResource::collection($reviews), 'Reviews retrieved successfully.');
    }

    public function store(StoreReviewRequest $request)
    {
        if (Review::where('tour_id', $request->string('tour_id')->toString())
            ->where('user_id', $request->user()->_id)
            ->exists()) {
            return $this->apiResponse(false, null, 'Bạn đã gửi bài đánh giá cho tour này rồi.', 422);
        }

        $review = Review::create([
            'tour_id' => $request->string('tour_id')->toString(),
            'user_id' => $request->user()->_id,
            'booking_id' => $request->filled('booking_id') ? $request->string('booking_id')->toString() : null,
            'title' => $request->string('title')->toString(),
            'rating' => (int) $request->input('rating'),
            'comment' => $request->string('comment')->toString(),
            'images' => collect($request->file('image_files', []))
                ->map(function ($file) {
                    return Storage::url($file->store('reviews', 'public'));
                })
                ->values()
                ->all(),
            'status' => 'approved',
            'created_at' => Carbon::now(),
        ]);

        return $this->apiResponse(true, new ReviewResource($review->load('user')), 'Review submitted successfully.', 201);
    }

    public function approve(string $id)
    {
        $review = Review::find($id);

        if (! $review) {
            return $this->apiResponse(false, null, 'Review not found.', 404);
        }

        $review->status = 'approved';
        $review->save();

        return $this->apiResponse(true, new ReviewResource($review), 'Review approved successfully.');
    }

    public function destroy(string $id)
    {
        $review = Review::find($id);

        if (! $review) {
            return $this->apiResponse(false, null, 'Review not found.', 404);
        }

        $review->delete();

        return $this->apiResponse(true, null, 'Review deleted successfully.');
    }
}
