<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Nuevo flujo: el pago lo registra el vendedor ANTES de la evaluación de
 * underwriting (que hace administración/oficina). Aquí se guarda ese pago
 * pendiente hasta que la oficina apruebe y se genere la póliza.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            if (!Schema::hasColumn('solicitud', 'pago_datos')) {
                $table->json('pago_datos')->nullable()->after('coberturas');
            }
        });
    }

    public function down(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            if (Schema::hasColumn('solicitud', 'pago_datos')) {
                $table->dropColumn('pago_datos');
            }
        });
    }
};
