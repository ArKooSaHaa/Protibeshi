<?php

namespace App\Services;

use App\Models\Restaurant;

class RestaurantRatingService
{
    public function refresh(Restaurant $restaurant): void
    {
        $stats = $restaurant->reviews()
            ->selectRaw('AVG(rating) as avg_rating, COUNT(*) as review_count')
            ->first();

        $restaurant->rating = $stats && $stats->avg_rating !== null
            ? round((float) $stats->avg_rating, 2)
            : 0.0;
        $restaurant->total_reviews = $stats ? (int) $stats->review_count : 0;
        $restaurant->save();
    }
}
