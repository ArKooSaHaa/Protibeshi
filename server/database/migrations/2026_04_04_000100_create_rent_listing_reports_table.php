<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('rent_listing_reports')) {
            return;
        }

        Schema::create('rent_listing_reports', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('rent_listing_id');
            $table->unsignedBigInteger('user_id');
            $table->string('reason', 500)->nullable();
            $table->timestamps();

            $table->foreign('rent_listing_id')
                ->references('id')
                ->on('rent_listings')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['rent_listing_id', 'created_at']);
            $table->unique(['rent_listing_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rent_listing_reports');
    }
};
