<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * El cuadro póliza necesita dirección y teléfono propios del asegurado
 * cuando es distinto del tomador (ej. un hijo o cónyuge asegurado bajo la
 * póliza de otra persona). Antes solo se guardaba nombre/cédula y el PDF
 * heredaba siempre los datos del tomador, aunque el asegurado real viviera
 * en otra dirección.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->string('asegurado_telefono', 30)->nullable()->after('asegurado_ci');
            $table->string('asegurado_direccion', 255)->nullable()->after('asegurado_telefono');
        });
    }

    public function down(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropColumn(['asegurado_telefono', 'asegurado_direccion']);
        });
    }
};
