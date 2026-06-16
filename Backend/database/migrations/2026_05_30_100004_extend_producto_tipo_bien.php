<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Reemplaza producto.requiere_vehiculo (boolean) por producto.tipo_bien (string).
 *
 * tipo_bien le dice al frontend qué formulario mostrar al cotizar:
 *   vehiculo  → form de placa, marca, modelo, año, seriales…
 *   inmueble  → form de dirección, metros², tipo construcción…
 *   vida      → form de condición médica, beneficiarios…
 *   bien      → form libre: descripción, marca, serial, valor…
 *   ninguno   → solo datos personales del tomador (accidentes personales, funeraria…)
 *
 * También elimina producto.tasas que fue reemplazado por el sistema tarifario.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->string('tipo_bien', 30)
                  ->default('ninguno')
                  ->after('requiere_vehiculo')
                  ->comment('vehiculo|inmueble|vida|bien|ninguno');
        });

        // Migrar requiere_vehiculo → tipo_bien
        DB::statement("
            UPDATE producto
            SET tipo_bien = CASE
                WHEN requiere_vehiculo = 1 THEN 'vehiculo'
                ELSE 'ninguno'
            END
        ");

        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('requiere_vehiculo');
            // tasas fue reemplazado por el sistema tarifario
            $table->dropColumn('tasas');
        });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->boolean('requiere_vehiculo')->default(false)->after('tipo_bien');
            $table->json('tasas')->nullable();
        });

        DB::statement("
            UPDATE producto
            SET requiere_vehiculo = CASE
                WHEN tipo_bien = 'vehiculo' THEN 1
                ELSE 0
            END
        ");

        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('tipo_bien');
        });
    }
};
