<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class RestaurantReviewResource extends JsonResource
{
    public function toArray($request)
    {
        $user = $this->whenLoaded('user');

        return [
            'id' => $this->id,
            'rating' => (int) $this->rating,
            'review' => $this->review,
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
