<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Renglones de "Coberturas / Sumas Aseguradas" del cuadro póliza (PDF),
 * definidos por producto: [{key, label}, …]. Los MONTOS de cada renglón
 * viven en cada fila de tarifario (datos.coberturas_pdf) — el producto solo
 * define QUÉ renglones existen y con qué nombre salen impresos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->json('coberturas_pdf')->nullable()->after('documentos_requeridos');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('coberturas_pdf');
        });
    }
};
