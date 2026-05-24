<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class RestaurantResource extends JsonResource
{
    public function toArray($request): array
    {
        $user = $this->whenLoaded('user');

        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'category' => $this->category,
            'location' => $this->location,
            'address' => $this->address,
            'phone' => $this->phone,
            'website' => $this->website,
            'opening_time' => $this->opening_time,
            'closing_time' => $this->closing_time,
            'price_range' => $this->price_range,
            'delivery_available' => (bool) $this->delivery_available,
            'image' => $this->image,
            'image_url' => $this->image_url,
            'cover_image' => $this->cover_image,
            'cover_image_url' => $this->cover_image_url,
            'rating' => (float) $this->rating,
            'total_reviews' => (int) $this->total_reviews,
            'is_verified' => (bool) $this->is_verified,
            'status' => $this->status,
            'views_count' => (int) $this->views_count,
            'created_at' => $this->created_at,
            'user' => $user ? [
                'id' => $user->id,
                'name' => trim(($user->first_name ?? '') . ' ' . ($user->last_name ?? '')),
                'profile_picture_url' => $user->profile_picture
                    ? url(Storage::url($user->profile_picture))
                    : null,
            ] : null,
        ];
    }
}
