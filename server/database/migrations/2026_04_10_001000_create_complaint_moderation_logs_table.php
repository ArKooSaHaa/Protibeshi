<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateComplaintModerationLogsTable extends Migration
{
    public function up()
    {
        Schema::create('complaint_moderation_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('complaint_id')->constrained('complaints')->onDelete('cascade');
            $table->foreignId('admin_id')->nullable()->constrained('admins')->nullOnDelete();
            $table->string('action')->default('status_update');
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['complaint_id', 'created_at']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('complaint_moderation_logs');
    }
}
