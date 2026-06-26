<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Las solicitudes públicas (desde el landing del QR) ahora pueden ser de
 * renovación o de pago de una cuota mensual. `concepto` distingue ambas para
 * que el asesor las procese de forma distinta al autorizar.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitudes_renovacion_qr', function (Blueprint $table) {
            $table->string('concepto', 20)->default('renovacion')->after('nro_contrato'); // renovacion | cuota
        });
    }

    public function down(): void
    {
        Schema::table('solicitudes_renovacion_qr', function (Blueprint $table) {
            $table->dropColumn('concepto');
        });
    }
};
