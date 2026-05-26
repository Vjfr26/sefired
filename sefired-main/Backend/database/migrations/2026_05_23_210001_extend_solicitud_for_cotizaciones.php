<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            // Status del workflow de cotización → póliza
            $table->string('status', 30)->default('En Revisión')->after('fecha_solicitud');
            // Agente que creó la cotización
            $table->unsignedInteger('vendedor_id')->nullable()->after('status');
            // JSON con coberturas seleccionadas, tasa BCV y desgloses
            $table->json('coberturas')->nullable()->after('vendedor_id');
            // Datos del tomador (puede no estar registrado aún como cliente)
            $table->string('nombre_tomador', 120)->nullable()->after('coberturas');
            $table->string('ci_tomador', 20)->nullable()->after('nombre_tomador');

            // Hacer producto_id opcional: la cotización puede no tener un producto exacto aún
            $table->dropForeign('fk_solicitud_producto');
            $table->unsignedInteger('producto_id')->nullable()->change();
            $table->foreign('producto_id', 'fk_solicitud_producto')
                  ->references('id')->on('producto')->onUpdate('cascade')->nullOnDelete();

            // Relajar la restricción única para permitir múltiples cotizaciones mismo día
            $table->dropUnique('uq_solicitud');
        });
    }

    public function down(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropColumn(['status', 'vendedor_id', 'coberturas', 'nombre_tomador', 'ci_tomador']);

            $table->dropForeign('fk_solicitud_producto');
            $table->unsignedInteger('producto_id')->nullable(false)->change();
            $table->foreign('producto_id', 'fk_solicitud_producto')
                  ->references('id')->on('producto')->onUpdate('cascade');

            $table->unique(['cliente_id', 'placa', 'producto_id', 'fecha_solicitud'], 'uq_solicitud');
        });
    }
};
