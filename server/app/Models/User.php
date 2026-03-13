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
        'profile_picture',
        'bio',
        'password',
    ];

    protected $hidden = [
        'password',
    ];

    public function listings()
    {
        return $this->hasMany(Listing::class);
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