<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ComplaintModerationLog extends Model
{
    use HasFactory;

    public const ACTION_STATUS_UPDATE = 'status_update';

    protected $fillable = [
        'complaint_id',
        'admin_id',
        'action',
        'from_status',
        'to_status',
        'note',
    ];

    public function complaint()
    {
        return $this->belongsTo(Complaint::class);
    }

    public function admin()
    {
        return $this->belongsTo(Admin::class);
    }
}
