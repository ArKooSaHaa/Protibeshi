<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->string('moderation_status', 40)->default('verified')->after('is_pinned');
            $table->unsignedBigInteger('moderated_by_admin_id')->nullable()->after('moderation_status');
            $table->timestamp('moderated_at')->nullable()->after('moderated_by_admin_id');
            $table->text('moderation_note')->nullable()->after('moderated_at');

            $table->foreign('moderated_by_admin_id')
                ->references('id')
                ->on('admins')
                ->onDelete('set null');

            $table->index('moderation_status');
        });
    }

    public function down(): void
    {
        Schema::table('posts', function (Blueprint $table) {
            $table->dropForeign(['moderated_by_admin_id']);
            $table->dropIndex(['moderation_status']);
            $table->dropColumn([
                'moderation_status',
                'moderated_by_admin_id',
                'moderated_at',
                'moderation_note',
            ]);
        });
    }
};
