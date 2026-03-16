<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreatePostsTable extends Migration
{
    public function up()
    {
        Schema::create('posts', function (Blueprint $table) {

            $table->id();

            // post owner 
            $table->unsignedBigInteger('user_id');

            // main post content
            $table->string('title');
            $table->text('short_description')->nullable();
            $table->text('content');

            // label/category
            $table->string('label')->nullable();

            // optional image
            $table->string('image')->nullable();

            // post type (future expansion)
            $table->string('post_type')->default('community');
            // example: emergency, announcement, help, event

            // visibility control
            $table->string('visibility')->default('public');
            // public, neighborhood, private

            // engagement counters (performance optimization)
            $table->unsignedInteger('likes_count')->default(0);
            $table->unsignedInteger('comments_count')->default(0);
            $table->unsignedInteger('shares_count')->default(0);

            // moderation
            $table->boolean('is_active')->default(true);
            $table->boolean('is_pinned')->default(false);

            // optional location support (future)
            $table->string('location')->nullable();
            $table->integer('distance')->nullable();

            $table->timestamps();

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

        });
    }

    public function down()
    {
        Schema::dropIfExists('posts');
    }
}