<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Agrega documentos_requeridos (JSON) a producto.
 *
 * Estructura del JSON:
 *   [
 *     { "nombre": "Cédula de Identidad",     "obligatorio": true  },
 *     { "nombre": "Certificado de Vehículo", "obligatorio": true  },
 *     { "nombre": "Foto del Vehículo",       "obligatorio": false }
 *   ]
 *
 * El simulador muestra esta lista al vendedor.
 * El sistema cruza contra cliente_documentos para detectar faltantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->json('documentos_requeridos')->nullable()->after('documentos');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('documentos_requeridos');
        });
    }
};
