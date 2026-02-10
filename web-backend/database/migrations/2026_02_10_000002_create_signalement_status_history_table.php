<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('signalement_status_history', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('signalement_id');
            $table->string('status'); // pending, in_progress, resolved, rejected
            $table->timestamp('changed_at')->useCurrent();
            $table->text('notes')->nullable();

            $table->foreign('signalement_id')
                ->references('id')
                ->on('signalements')
                ->onDelete('cascade');

            $table->index(['signalement_id', 'changed_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('signalement_status_history');
    }
};
