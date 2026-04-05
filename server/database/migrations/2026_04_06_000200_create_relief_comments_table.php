<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('relief_comments')) {
            return;
        }

        Schema::create('relief_comments', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('relief_id');
            $table->unsignedBigInteger('user_id');
            $table->text('comment');
            $table->timestamps();

            $table->foreign('relief_id')
                ->references('id')
                ->on('reliefs')
                ->onDelete('cascade');

            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->index(['relief_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('relief_comments');
    }
};
