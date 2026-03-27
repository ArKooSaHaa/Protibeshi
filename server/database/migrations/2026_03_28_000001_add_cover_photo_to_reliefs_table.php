<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('reliefs', 'cover_photo')) {
            Schema::table('reliefs', function (Blueprint $table) {
                $table->string('cover_photo')->nullable()->after('location');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('reliefs', 'cover_photo')) {
            Schema::table('reliefs', function (Blueprint $table) {
                $table->dropColumn('cover_photo');
            });
        }
    }
};
