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
        Schema::create('reliefs', function (Blueprint $table) {

            $table->id();

            // owner
            $table->unsignedBigInteger('user_id');

            // basic info
            $table->string('title');
            $table->string('type'); // food, medical, etc
            $table->text('description');

            // urgency
            $table->string('urgency'); // normal, important, urgent, critical

            // timing
            $table->string('time_sensitivity')->nullable();

            // visibility
            $table->string('visibility')->default('public');

            // contact
            $table->string('contact_preference')->default('in_app');

            // location
            $table->string('location');

            // status
            $table->string('status')->default('open');
            // open, assigned, completed

            // helpers count (optional)
            $table->unsignedInteger('helpers_count')->default(0);

            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reliefs');
    }
};