<?php

namespace App\Http\Controllers;

use App\Enums\RestaurantStatus;
use App\Http\Requests\Restaurant\StoreRestaurantReviewRequest;
use App\Http\Requests\Restaurant\UpdateRestaurantReviewRequest;
use App\Http\Resources\RestaurantReviewResource;
use App\Models\Restaurant;
use App\Models\RestaurantReview;
use App\Services\RestaurantRatingService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;

class RestaurantReviewController extends Controller
{
    use ApiResponse;

    public function index(Restaurant $restaurant)
    {
        if ($restaurant->status !== RestaurantStatus::Approved->value) {
            return $this->error('Restaurant not found', 404);
        }

        $reviews = $restaurant->reviews()
            ->with('user')
            ->paginate(10);

        return $this->successWithPagination(
            $reviews,
            'Restaurant reviews fetched successfully',
            RestaurantReviewResource::collection($reviews)
        );
    }

    public function store(
        StoreRestaurantReviewRequest $request,
        Restaurant $restaurant,
        RestaurantRatingService $ratingService
    ) {
        if ($restaurant->status !== RestaurantStatus::Approved->value) {
            return $this->error('Restaurant not found', 404);
        }

        $existing = RestaurantReview::query()
            ->where('user_id', $request->user()->id)
            ->where('restaurant_id', $restaurant->id)
            ->first();

        if ($existing) {
            return $this->error('You already reviewed this restaurant', 409);
        }

        $review = $restaurant->reviews()->create([
            'user_id' => $request->user()->id,
            'rating' => (int) $request->input('rating'),
            'review' => $request->input('review'),
        ]);

        $ratingService->refresh($restaurant);

        return $this->success(
            'Review added successfully',
            new RestaurantReviewResource($review->load('user')),
            201
        );
    }

    public function update(
        UpdateRestaurantReviewRequest $request,
        RestaurantReview $review,
        RestaurantRatingService $ratingService
    ) {
        $this->authorize('update', $review);

        $review->fill($request->validated());
        $review->save();

        $review->load('user');
        $ratingService->refresh($review->restaurant);

        return $this->success('Review updated successfully', new RestaurantReviewResource($review));
    }

    public function destroy(RestaurantReview $review, RestaurantRatingService $ratingService)
    {
        $this->authorize('delete', $review);

        $restaurant = $review->restaurant;
        $review->delete();

        $ratingService->refresh($restaurant);

        return $this->success('Review deleted successfully');
    }
}
