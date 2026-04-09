<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'category',
        'short_description',
        'full_description',
        'price',
        'price_type',
        'availability',
        'experience_years',
        'service_radius',
        'location',
        'working_hours',
        'cover_photo',
        'verified_provider',
        'is_active',
    ];

    protected $casts = [
        'price'             => 'decimal:2',
        'experience_years'  => 'integer',
        'service_radius'    => 'integer',
        'verified_provider' => 'boolean',
        'is_active'         => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(ServiceReport::class);
    }
}
