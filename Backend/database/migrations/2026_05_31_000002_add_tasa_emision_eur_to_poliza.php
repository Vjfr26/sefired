<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->decimal('tasa_emision_eur', 18, 4)->default(0)->after('tasa_emision');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropColumn('tasa_emision_eur');
        });
    }
};
