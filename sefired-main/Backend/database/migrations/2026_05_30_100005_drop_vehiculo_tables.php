<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Elimina las tablas específicas de vehículos ahora que los datos
 * viven en bien_asegurado y bien_persona_rol.
 *
 * Orden: primero las tablas con FK salientes, luego las referenciadas.
 *   conductor        → FK a vehiculo + persona
 *   tomador          → FK a vehiculo + persona
 *   solicitud.placa  → columna con join por string (no FK real)
 *   vehiculo         → FK a persona + modelo_vehiculo
 *   modelo_vehiculo  → tabla de catálogo, datos ya migrados a bien_asegurado.atributos
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Tablas con FK a vehiculo
        Schema::dropIfExists('conductor');
        Schema::dropIfExists('tomador');

        // 2. Eliminar columna placa de solicitud
        // (bien_asegurado_id ya la reemplaza con FK real)
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropIndex('idx_solicitud_placa');
            $table->dropColumn('placa');
        });

        // 3. Tabla vehiculo (FK a persona + modelo_vehiculo)
        Schema::dropIfExists('vehiculo');

        // 4. Catálogo de modelos (datos absorbidos por bien_asegurado.atributos)
        Schema::dropIfExists('modelo_vehiculo');
    }

    public function down(): void
    {
        // Recrear modelo_vehiculo
        Schema::create('modelo_vehiculo', function (Blueprint $table) {
            $table->increments('id');
            $table->string('marca', 80);
            $table->string('modelo', 80);
            $table->unique(['marca', 'modelo'], 'uq_marca_modelo');
            $table->index('marca', 'idx_marca');
        });

        // Recrear vehiculo
        Schema::create('vehiculo', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('persona_id')->nullable();
            $table->string('placa', 20)->unique('uq_vehiculo_placa');
            $table->unsignedBigInteger('modelo_vehiculo_id')->nullable();
            $table->enum('tipo', ['sedan','coupe','hatchback','suv','pickup','furgoneta','moto','otro'])->default('sedan');
            $table->enum('uso',  ['particular','carga','transporte_publico','rustico','otro'])->default('particular');
            $table->date('fecha_adquisicion')->nullable();
            $table->string('certificado_transito', 20)->nullable();
            $table->string('certificado_origen',   20)->nullable();
            $table->string('clase', 80)->nullable();
            $table->smallInteger('anio')->unsigned()->nullable();
            $table->string('color', 30)->nullable();
            $table->unsignedInteger('peso')->nullable();
            $table->tinyInteger('puestos')->unsigned()->nullable();
            $table->string('aparcamiento', 30)->nullable();
            $table->string('serial_carroceria', 40)->nullable()->unique('uq_vehiculo_serial');
            $table->string('serial_motor', 40)->nullable();
            $table->string('titulo', 180)->nullable();
            $table->softDeletes();

            $table->index('persona_id', 'idx_vehiculo_persona');
            $table->foreign('persona_id', 'fk_vehiculo_persona')
                  ->references('id')->on('persona')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign('modelo_vehiculo_id', 'fk_veh_modelo')
                  ->references('id')->on('modelo_vehiculo')->onUpdate('cascade')->onDelete('set null');
        });

        // Restaurar placa en solicitud
        Schema::table('solicitud', function (Blueprint $table) {
            $table->string('placa', 20)->nullable()->after('persona_id');
            $table->index('placa', 'idx_solicitud_placa');
        });

        // Recrear conductor
        Schema::create('conductor', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('persona_id');
            $table->unsignedBigInteger('vehiculo_id');
            $table->foreign('persona_id', 'fk_conductor_persona')->references('id')->on('persona');
            $table->foreign('vehiculo_id', 'fk_conductor_vehiculo')->references('id')->on('vehiculo');
        });

        // Recrear tomador
        Schema::create('tomador', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('persona_id');
            $table->unsignedBigInteger('vehiculo_id');
            $table->boolean('copia')->default(false);
            $table->foreign('persona_id', 'fk_tomador_persona')->references('id')->on('persona');
            $table->foreign('vehiculo_id', 'fk_tomador_vehiculo')->references('id')->on('vehiculo');
        });
    }
};
