<?php

namespace App\Services;

use Illuminate\Database\Eloquent\Builder;

class RestaurantQueryService
{
    public function apply(Builder $query, array $filters): Builder
    {
        if (!empty($filters['q'])) {
            $query->search($filters['q']);
        }

        if (!empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (!empty($filters['location'])) {
            $query->where('location', $filters['location']);
        }

        if (!empty($filters['price_range'])) {
            $query->where('price_range', $filters['price_range']);
        }

        if (array_key_exists('delivery_available', $filters) && $filters['delivery_available'] !== null) {
            $query->where('delivery_available', (bool) $filters['delivery_available']);
        }

        if (!empty($filters['verified_only'])) {
            $query->where('is_verified', true);
        }

        if (!empty($filters['min_rating'])) {
            $query->where('rating', '>=', (float) $filters['min_rating']);
        }

        if (!empty($filters['top_rated'])) {
            $query->orderByDesc('rating')->orderByDesc('total_reviews');
        } elseif (!empty($filters['newest'])) {
            $query->latest();
        }

        return $query;
    }
}
