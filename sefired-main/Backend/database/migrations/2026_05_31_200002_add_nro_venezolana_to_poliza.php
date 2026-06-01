<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            // Número interno asignado por La Venezolana de Seguros al recibir el reporte.
            // Es el que va en el parámetro ?poliza= del QR de verificación.
            $table->string('nro_venezolana', 20)->nullable()->after('nro_contrato');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropColumn('nro_venezolana');
        });
    }
};
