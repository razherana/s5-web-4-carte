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
        Schema::table('signalements', function (Blueprint $table) {
            $table->unsignedTinyInteger('niveau')->default(1)->after('surface');
            $table->decimal('prix_par_m2', 15, 2)->default(0)->after('niveau');
        });

        // Remove the old budget column (it will be computed)
        Schema::table('signalements', function (Blueprint $table) {
            $table->dropColumn('budget');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('signalements', function (Blueprint $table) {
            $table->decimal('budget', 15, 2)->after('prix_par_m2');
        });

        Schema::table('signalements', function (Blueprint $table) {
            $table->dropColumn(['niveau', 'prix_par_m2']);
        });
    }
};
