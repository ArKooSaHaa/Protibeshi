<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateServicesTable extends Migration
{
    public function up()
    {
        Schema::create('services', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('user_id');

            $table->string('title');
            $table->string('category');

            $table->string('short_description');

            $table->text('full_description');

            $table->decimal('price', 10, 2);
            $table->string('price_type');

            $table->string('availability')->nullable();

            $table->integer('experience_years')->nullable();

            $table->integer('service_radius')->default(0);

            $table->string('location');

            $table->string('working_hours')->nullable();

            $table->string('cover_photo')->nullable();

            $table->boolean('verified_provider')->default(false);

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

        });
    }

    public function down()
    {
        Schema::dropIfExists('services');
    }
}