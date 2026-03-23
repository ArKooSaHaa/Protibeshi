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
        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            // participants
            $table->unsignedBigInteger('user_one_id');
            $table->unsignedBigInteger('user_two_id');

            // optional: related listing (marketplace)
            $table->unsignedBigInteger('listing_id')->nullable();

            // last message preview
            $table->text('last_message')->nullable();

            // timestamps
            $table->timestamps();

            // indexes (important for performance)
            $table->index(['user_one_id', 'user_two_id']);
            $table->index('listing_id');

            // prevent duplicate conversations between same users
            $table->unique(['user_one_id', 'user_two_id']);

            // foreign keys
            $table->foreign('user_one_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            $table->foreign('user_two_id')
                  ->references('id')
                  ->on('users')
                  ->onDelete('cascade');

            // optional: if listings table exists
            $table->foreign('listing_id')
                  ->references('id')
                  ->on('listings')
                  ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};