<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

// JWT
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

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