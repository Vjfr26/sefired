<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite personalizar qué columnas incluye el Excel de cada programación de
 * reporte externo, igual que en la descarga manual. NULL = todas las columnas
 * (comportamiento previo, para no romper las programaciones ya existentes).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reportes_externos_programaciones', function (Blueprint $table) {
            $table->json('columnas')->nullable()->after('cliente_documento_ids');
        });
    }

    public function down(): void
    {
        Schema::table('reportes_externos_programaciones', function (Blueprint $table) {
            $table->dropColumn('columnas');
        });
    }
};
