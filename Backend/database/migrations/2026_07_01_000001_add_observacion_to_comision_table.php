<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Observación opcional que se captura al marcar una comisión como pagada
 * (ej. referencia del pago, motivo, quién autorizó). Se muestra en el reporte
 * junto al botón de revertir. Se limpia al revertir a pendiente.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('comision', function (Blueprint $table) {
            $table->string('observacion', 500)->nullable()->after('pagado_por');
        });
    }

    public function down(): void
    {
        Schema::table('comision', function (Blueprint $table) {
            $table->dropColumn('observacion');
        });
    }
};
