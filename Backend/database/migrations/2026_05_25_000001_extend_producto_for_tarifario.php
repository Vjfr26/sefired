<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            // Short code used in the wizard (RCV, APOV, EC, EP, ALPD)
            $table->string('codigo', 20)->nullable()->after('id');

            // General grouping: vehicular, bienes, personas
            $table->string('categoria', 30)->nullable()->after('tipo');

            // Whether the product requires a vehicle plate
            $table->boolean('requiere_vehiculo')->default(true)->after('categoria');

            // Drives the simulator wizard behaviour
            $table->enum('tipo_calculo', ['fijo', 'por_plan', 'por_nivel', 'por_valor'])
                  ->default('fijo')
                  ->after('requiere_vehiculo');

            // Fixed policy fee added on top of the premium (USD)
            $table->decimal('derecho_poliza', 10, 2)->default(0)->after('tipo_calculo');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn(['codigo', 'categoria', 'requiere_vehiculo', 'tipo_calculo', 'derecho_poliza']);
        });
    }
};
