<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $hasIsBanned = Schema::hasColumn('users', 'is_banned');
        $hasBannedAt = Schema::hasColumn('users', 'banned_at');
        $hasBannedReason = Schema::hasColumn('users', 'banned_reason');
        $hasBannedByAdminId = Schema::hasColumn('users', 'banned_by_admin_id');

        if ($hasIsBanned && $hasBannedAt && $hasBannedReason && $hasBannedByAdminId) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use (
            $hasIsBanned,
            $hasBannedAt,
            $hasBannedReason,
            $hasBannedByAdminId
        ) {
            if (!$hasIsBanned) {
                $table->boolean('is_banned')->default(false)->after('profile_picture');
            }

            if (!$hasBannedAt) {
                $table->timestamp('banned_at')->nullable()->after('is_banned');
            }

            if (!$hasBannedReason) {
                $table->string('banned_reason', 500)->nullable()->after('banned_at');
            }

            if (!$hasBannedByAdminId) {
                $table->unsignedBigInteger('banned_by_admin_id')->nullable()->after('banned_reason');
            }
        });
    }

    public function down(): void
    {
        $hasIsBanned = Schema::hasColumn('users', 'is_banned');
        $hasBannedAt = Schema::hasColumn('users', 'banned_at');
        $hasBannedReason = Schema::hasColumn('users', 'banned_reason');
        $hasBannedByAdminId = Schema::hasColumn('users', 'banned_by_admin_id');

        if (!$hasIsBanned && !$hasBannedAt && !$hasBannedReason && !$hasBannedByAdminId) {
            return;
        }

        Schema::table('users', function (Blueprint $table) use (
            $hasIsBanned,
            $hasBannedAt,
            $hasBannedReason,
            $hasBannedByAdminId
        ) {
            $columnsToDrop = [];

            if ($hasBannedByAdminId) {
                $columnsToDrop[] = 'banned_by_admin_id';
            }

            if ($hasBannedReason) {
                $columnsToDrop[] = 'banned_reason';
            }

            if ($hasBannedAt) {
                $columnsToDrop[] = 'banned_at';
            }

            if ($hasIsBanned) {
                $columnsToDrop[] = 'is_banned';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
