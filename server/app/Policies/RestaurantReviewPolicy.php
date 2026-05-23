<?php

namespace App\Policies;

use App\Models\RestaurantReview;
use App\Models\User;

class RestaurantReviewPolicy
{
    public function update(User $user, RestaurantReview $review): bool
    {
        return (int) $review->user_id === (int) $user->id;
    }

    public function delete(User $user, RestaurantReview $review): bool
    {
        return (int) $review->user_id === (int) $user->id;
    }
}
