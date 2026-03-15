<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateComplaintsTable extends Migration
{
    public function up()
    {
        Schema::create('complaints', function (Blueprint $table) {

            $table->id();

            // who reported the complaint
            $table->unsignedBigInteger('user_id');

            // complaint info
            $table->string('title');
            $table->string('category');

            $table->text('description');

            // location
            $table->string('location');

            // priority
            $table->string('priority');

            // visibility
            $table->string('visibility')->default('public');

            // complaint status
            $table->string('status')->default('pending');

            // optional photo
            $table->string('photo')->nullable();

            // distance (for UI display)
            $table->integer('distance')->nullable();

            // complaint reference id (CMP-2026-0001 style)
            $table->string('complaint_code')->unique();

            $table->timestamps();

            // relationship
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

        });
    }

    public function down()
    {
        Schema::dropIfExists('complaints');
    }
}