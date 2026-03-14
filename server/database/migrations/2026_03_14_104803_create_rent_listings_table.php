<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateRentListingsTable extends Migration
{
    public function up()
    {
        Schema::create('rent_listings', function (Blueprint $table) {

            $table->id();

            $table->unsignedBigInteger('user_id');

            $table->string('title');
            $table->string('location');

            $table->decimal('price', 10, 2);
            $table->decimal('deposit', 10, 2)->nullable();

            $table->integer('distance')->nullable();
            $table->integer('size_sqft')->nullable();

            $table->integer('beds')->nullable();
            $table->integer('baths')->nullable();

            $table->string('type')->nullable();
            $table->string('furnishing')->nullable();
            $table->string('availability')->nullable();
            $table->string('badge')->nullable();

            $table->boolean('verified_landlord')->default(false);

            $table->string('photo')->nullable();

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
        Schema::dropIfExists('rent_listings');
    }
}