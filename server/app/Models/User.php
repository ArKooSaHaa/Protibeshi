<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// JWT
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable, SoftDeletes;

    protected $table = 'users';

    protected $fillable = [
        'first_name',
        'last_name',
        'username',
        'email',
        'phone',
        'city',
        'neighborhood',
        'full_address',
        'profile_picture',
        'is_banned',
        'banned_at',
        'banned_until',
        'banned_reason',
        'banned_by_admin_id',
        'bio',
        'password',
    ];

    protected $casts = [
        'is_banned' => 'boolean',
        'banned_at' => 'datetime',
        'banned_until' => 'datetime',
    ];

    protected $hidden = [
        'password',
    ];

    public function listings()
    {
        return $this->hasMany(Listing::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function rentListings()
    {
        return $this->hasMany(RentListing::class);
    }

    public function complaints()
    {
        return $this->hasMany(Complaint::class);
    }

    public function reliefs()
    {
        return $this->hasMany(Relief::class);
    }

    public function posts()
    {
        return $this->hasMany(Post::class);
    }

    public function restaurants()
    {
        return $this->hasMany(Restaurant::class);
    }

    public function restaurantFavorites()
    {
        return $this->hasMany(RestaurantFavorite::class);
    }

    public function favoriteRestaurants()
    {
        return $this->belongsToMany(Restaurant::class, 'restaurant_favorites')
            ->withTimestamps();
    }

    public function restaurantReviews()
    {
        return $this->hasMany(RestaurantReview::class);
    }

    public function conversations()
    {
        return $this->hasMany(Conversation::class, 'user_one_id')
            ->orWhere('user_two_id', $this->id);
    }

    public function messages()
    {
        return $this->hasMany(Message::class, 'sender_id');
    }

    /**
     * Return JWT identifier
     */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    /**
     * Return custom JWT claims
     */
    public function getJWTCustomClaims()
    {
        return [];
    }
}
