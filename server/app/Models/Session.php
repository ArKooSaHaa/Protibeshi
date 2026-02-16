<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Session extends Model
{
    use HasFactory;

    // Define table name if it's different from the default plural form
    protected $table = 'sessions';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    // Define fillable fields
    protected $fillable = ['name', 'duration'];

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }
}
