<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Porcentaje de comisión por usuario. Antes la tasa dependía solo del cargo
 * (10% agente / 5% resto) vía Comision::tasaParaCargo(). Ahora cada usuario
 * puede tener su propio %; si queda NULL, se usa el default por cargo (no
 * rompe a los usuarios existentes).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->decimal('comision_pct', 5, 2)->nullable()->after('cargo');
        });
    }

    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->dropColumn('comision_pct');
        });
    }
};
