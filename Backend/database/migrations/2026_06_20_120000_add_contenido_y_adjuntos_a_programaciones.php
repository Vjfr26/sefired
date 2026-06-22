<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Permite elegir QUÉ se reporta en una programación interna (ventas,
 * oficinas o personal — antes siempre era ventas) y adjuntar al correo
 * tanto archivos sueltos como documentos ya existentes de un cliente.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('reportes_internos_programaciones', function (Blueprint $table) {
            $table->string('tipo', 20)->default('ventas')->after('hora');
            $table->json('documentos_adicionales')->nullable()->after('activo');
            $table->json('cliente_documento_ids')->nullable()->after('documentos_adicionales');
        });

        Schema::table('reportes_externos_programaciones', function (Blueprint $table) {
            $table->json('documentos_adicionales')->nullable()->after('activo');
            $table->json('cliente_documento_ids')->nullable()->after('documentos_adicionales');
        });
    }

    public function down(): void
    {
        Schema::table('reportes_internos_programaciones', function (Blueprint $table) {
            $table->dropColumn(['tipo', 'documentos_adicionales', 'cliente_documento_ids']);
        });

        Schema::table('reportes_externos_programaciones', function (Blueprint $table) {
            $table->dropColumn(['documentos_adicionales', 'cliente_documento_ids']);
        });
    }
};
