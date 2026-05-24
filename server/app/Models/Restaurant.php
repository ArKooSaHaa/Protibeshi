<?php

namespace App\Models;

use App\Enums\RestaurantStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class Restaurant extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'name',
        'slug',
        'owner_name',
        'category',
        'address',
        'location',
        'phone',
        'website',
        'opening_time',
        'closing_time',
        'description',
        'price_range',
        'delivery_available',
        'image',
        'cover_image',
        'rating',
        'total_reviews',
        'is_verified',
        'status',
        'latitude',
        'longitude',
        'views_count',
    ];

    protected $casts = [
        'delivery_available' => 'boolean',
        'is_verified' => 'boolean',
        'rating' => 'decimal:2',
        'total_reviews' => 'integer',
        'views_count' => 'integer',
    ];

    protected $appends = [
        'image_url',
        'cover_image_url',
    ];

    protected static function booted(): void
    {
        static::creating(function (Restaurant $restaurant) {
            if (!$restaurant->slug) {
                $restaurant->slug = static::generateUniqueSlug($restaurant->name);
            }
        });

        static::updating(function (Restaurant $restaurant) {
            if ($restaurant->isDirty('name')) {
                $restaurant->slug = static::generateUniqueSlug($restaurant->name, $restaurant->id);
            }
        });
    }

    public static function generateUniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $baseSlug = Str::slug($name);
        $slug = $baseSlug;
        $suffix = 1;

        while (static::query()
            ->when($ignoreId, fn ($query) => $query->where('id', '!=', $ignoreId))
            ->where('slug', $slug)
            ->exists()) {
            $slug = $baseSlug . '-' . $suffix;
            $suffix++;
        }

        return $slug;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(RestaurantImage::class)->latest();
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(RestaurantReview::class)->latest();
    }

    public function favorites(): HasMany
    {
        return $this->hasMany(RestaurantFavorite::class);
    }

    public function favoritedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'restaurant_favorites')
            ->withTimestamps();
    }

    public function scopeApproved($query)
    {
        return $query->where('status', RestaurantStatus::Approved->value);
    }

    public function scopePending($query)
    {
        return $query->where('status', RestaurantStatus::Pending->value);
    }

    public function scopeRejected($query)
    {
        return $query->where('status', RestaurantStatus::Rejected->value);
    }

    public function scopeVerified($query)
    {
        return $query->where('is_verified', true);
    }

    public function scopeDeliveryAvailable($query)
    {
        return $query->where('delivery_available', true);
    }

    public function scopeTopRated($query)
    {
        return $query->orderByDesc('rating')->orderByDesc('total_reviews');
    }

    public function scopeNewest($query)
    {
        return $query->latest();
    }

    public function scopeSearch($query, string $term)
    {
        $like = '%' . trim($term) . '%';

        return $query->where(function ($searchQuery) use ($like) {
            $searchQuery->where('name', 'like', $like)
                ->orWhere('owner_name', 'like', $like)
                ->orWhere('description', 'like', $like)
                ->orWhere('address', 'like', $like)
                ->orWhere('location', 'like', $like);
        });
    }

    public function getImageUrlAttribute(): ?string
    {
        return $this->image ? url(Storage::url($this->image)) : null;
    }

    public function getCoverImageUrlAttribute(): ?string
    {
        return $this->cover_image ? url(Storage::url($this->cover_image)) : null;
    }
}
