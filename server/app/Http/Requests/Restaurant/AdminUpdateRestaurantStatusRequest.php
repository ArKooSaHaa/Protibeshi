<?php

namespace App\Http\Requests\Restaurant;

use App\Enums\RestaurantStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdminUpdateRestaurantStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', Rule::in(RestaurantStatus::values())],
            'is_verified' => 'nullable|boolean',
            'note' => 'nullable|string|max:500',
        ];
    }
}
