<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasColumn('users', 'banned_until')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('banned_until')->nullable()->after('banned_at');
        });
    }

    public function down(): void
    {
        if (!Schema::hasColumn('users', 'banned_until')) {
            return;
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('banned_until');
        });
    }
};
