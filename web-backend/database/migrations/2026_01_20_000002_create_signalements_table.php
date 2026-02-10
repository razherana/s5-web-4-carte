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
        Schema::create('signalements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onUpdate('no action')->onDelete('no action');
            $table->string('firebase_uid')->unique();
            $table->decimal('lat', 10, 8);
            $table->decimal('lng', 11, 8);
            $table->string('date_signalement');
            $table->decimal('surface', 15, 2);
            $table->decimal('budget', 15, 2);
            $table->foreignId('entreprise_id')->constrained('entreprises')->onUpdate('no action')->onDelete('no action');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('signalements');
    }
};
