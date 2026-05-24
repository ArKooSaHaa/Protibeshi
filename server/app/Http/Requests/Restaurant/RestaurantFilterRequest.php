<?php

namespace App\Http\Requests\Restaurant;

use Illuminate\Foundation\Http\FormRequest;

class RestaurantFilterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'q' => 'nullable|string|max:100',
            'category' => 'nullable|string|max:100',
            'location' => 'nullable|string|max:255',
            'price_range' => 'nullable|string|max:50',
            'delivery_available' => 'nullable|in:0,1,true,false',
            'verified_only' => 'nullable|in:0,1,true,false',
            'top_rated' => 'nullable|in:0,1,true,false',
            'newest' => 'nullable|in:0,1,true,false',
            'min_rating' => 'nullable|numeric|between:0,5',
            'per_page' => 'nullable|integer|min:1|max:50',
        ];
    }
}
