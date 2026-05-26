<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Eliminar tablas innecesarias (Camino A)
        Schema::dropIfExists('tipos_carros');
        Schema::dropIfExists('opc_vehiculos_uso');

        // 2. Modificar la tabla vehiculo
        Schema::table('vehiculo', function (Blueprint $table) {
            // Eliminar columnas de texto
            $table->dropColumn(['marca', 'modelo', 'tipo', 'uso']);

            // Añadir la clave foránea para el catálogo de modelos
            $table->unsignedInteger('modelo_vehiculo_id')->nullable()->after('placa');
            $table->foreign('modelo_vehiculo_id', 'fk_veh_modelo')->references('id')->on('modelo_vehiculo')->onDelete('set null')->onUpdate('cascade');

            // Añadir ENUMS fijos para velocidad y simplicidad
            $table->enum('tipo', ['sedan', 'coupe', 'hatchback', 'suv', 'pickup', 'furgoneta', 'moto', 'otro'])->default('sedan')->after('modelo_vehiculo_id');
            $table->enum('uso', ['particular', 'carga', 'transporte_publico', 'rustico', 'otro'])->default('particular')->after('tipo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->dropForeign('fk_veh_modelo');
            $table->dropColumn(['modelo_vehiculo_id', 'tipo', 'uso']);
            
            $table->string('marca', 100)->nullable();
            $table->string('modelo', 100)->nullable();
            $table->string('tipo', 80)->nullable();
            $table->string('uso', 40)->nullable();
        });

        Schema::create('tipos_carros', function (Blueprint $table) {
            $table->increments('id');
            $table->string('tipo_carro', 50);
            $table->string('grupo', 50);
            $table->enum('contexto', ['general', 'ecep'])->default('general');
            $table->unique(['tipo_carro', 'grupo', 'contexto'], 'uq_tipo_grupo_ctx');
        });

        Schema::create('opc_vehiculos_uso', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('id_empresa')->nullable();
            $table->timestamp('fecha_registro')->useCurrent();
            $table->string('uso', 100)->unique('uq_uso');
            $table->enum('activo', ['SI', 'NO'])->default('SI');
            $table->enum('eliminado', ['SI', 'NO'])->default('NO');
            $table->index(['activo', 'eliminado'], 'idx_uso_activo');
        });
    }
};
