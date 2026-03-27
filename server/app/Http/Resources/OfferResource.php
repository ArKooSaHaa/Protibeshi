<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class OfferResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'short_summary' => $this->short_summary,
            'description' => $this->description,
            'help_types' => $this->helpTypes->pluck('help_type'),
            'availability' => $this->availabilities->pluck('availability'),
            'service_radius' => $this->service_radius,
            'contact_preference' => $this->contact_preference,
            'is_recurring' => (bool) $this->is_recurring,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'user' => [
                'id' => $this->user->id ?? null,
                'name' => $this->user->name ?? null,
            ],
        ];
    }
}
