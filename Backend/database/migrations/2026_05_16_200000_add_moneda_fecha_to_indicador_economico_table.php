<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('indicador_economico', function (Blueprint $table) {
            // moneda distingue USD / EUR en registros de tasa_cambio; null para unidad_tributaria
            $table->string('moneda', 5)->nullable()->after('tipo');

            // fecha es la fecha de publicación BCV (negocio), distinta de fecha_registro (sistema)
            $table->date('fecha')->nullable()->after('moneda');

            // Evita duplicar la tasa de una misma moneda en el mismo día
            $table->unique(['tipo', 'moneda', 'fecha'], 'uq_indicador_tipo_moneda_fecha');
        });

        // Migra el registro de tasa_cambio existente asignándole moneda USD y la fecha de hoy
        DB::table('indicador_economico')
            ->where('tipo', 'tasa_cambio')
            ->whereNull('moneda')
            ->update([
                'moneda' => 'USD',
                'fecha'  => now()->toDateString(),
            ]);
    }

    public function down(): void
    {
        Schema::table('indicador_economico', function (Blueprint $table) {
            $table->dropUnique('uq_indicador_tipo_moneda_fecha');
            $table->dropColumn(['moneda', 'fecha']);
        });
    }
};
