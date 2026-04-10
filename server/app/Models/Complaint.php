<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Complaint extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';
    public const STATUS_UNDER_REVIEW = 'under_review';
    public const STATUS_IN_PROGRESS = 'in_progress';
    public const STATUS_RESOLVED = 'resolved';
    public const STATUS_REJECTED = 'rejected';

    public const VISIBILITY_PUBLIC = 'public';
    public const VISIBILITY_PRIVATE = 'private';

    public const ALLOWED_STATUSES = [
        self::STATUS_PENDING,
        self::STATUS_UNDER_REVIEW,
        self::STATUS_IN_PROGRESS,
        self::STATUS_RESOLVED,
        self::STATUS_REJECTED,
    ];

    public const ALLOWED_VISIBILITIES = [
        self::VISIBILITY_PUBLIC,
        self::VISIBILITY_PRIVATE,
    ];

    public const ALLOWED_PRIORITIES = [
        'low',
        'medium',
        'high',
        'urgent',
    ];

    public const ALLOWED_CATEGORIES = [
        'garbage',
        'water supply',
        'electricity',
        'road damage',
        'noise',
        'safety',
        'illegal activity',
        'other',
    ];

    public const CATEGORY_ALIASES = [
        'infrastructure' => 'road damage',
        'roads' => 'road damage',
        'road issue' => 'road damage',
    ];

    protected $fillable = [
        'user_id',
        'complaint_code',
        'title',
        'category',
        'description',
        'location',
        'priority',
        'visibility',
        'status',
        'photo',
        'distance',
    ];

    protected $casts = [
        'distance' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function moderationLogs()
    {
        return $this->hasMany(ComplaintModerationLog::class)->latest();
    }

    public static function normalizeCategory(string $value): string
    {
        $normalized = strtolower(trim(str_replace('_', ' ', $value)));

        return self::CATEGORY_ALIASES[$normalized] ?? $normalized;
    }

    public static function normalizePriority(string $value): string
    {
        return strtolower(trim($value));
    }

    public static function normalizeVisibility(string $value): string
    {
        $normalized = strtolower(trim(str_replace(' ', '_', $value)));

        if (in_array($normalized, ['private', 'only_admins', 'admins_only'], true)) {
            return self::VISIBILITY_PRIVATE;
        }

        return self::VISIBILITY_PUBLIC;
    }
}
