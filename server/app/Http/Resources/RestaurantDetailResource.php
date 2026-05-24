<?php

namespace App\Http\Resources;

class RestaurantDetailResource extends RestaurantResource
{
    public function toArray($request): array
    {
        $data = parent::toArray($request);

        $data['owner_name'] = $this->owner_name;
        $data['description'] = $this->description;
        $data['latitude'] = $this->latitude;
        $data['longitude'] = $this->longitude;
        $data['images'] = RestaurantImageResource::collection($this->whenLoaded('images'));
        $data['reviews'] = RestaurantReviewResource::collection($this->whenLoaded('reviews'));

        return $data;
    }
}
