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
        // 1. Eliminar tablas antiguas de APOV
        Schema::dropIfExists('apov_cobertura');
        Schema::dropIfExists('apov');
        Schema::dropIfExists('poliza_apov');
        Schema::dropIfExists('solicitud_apov');

        // 2. Crear nuevo catálogo unificado (Tarifario APOV)
        Schema::create('tarifario_apov', function (Blueprint $table) {
            $table->increments('id');
            $table->string('tipo_carro', 30);
            $table->enum('cobertura', ['muerte_accidental', 'invalidez', 'medicos', 'funerarios']);
            $table->enum('plan', ['bronze', 'plata', 'oro', 'platino']);
            $table->decimal('suma_asegurada', 18, 2)->default(0.00);
            $table->decimal('prima', 18, 2)->default(0.00);
            $table->timestamps();

            // Un tarifario debe ser único por combinación de tipo_carro, cobertura y plan
            $table->unique(['tipo_carro', 'cobertura', 'plan'], 'uq_tarifario_apov');
        });

        // 3. Recrear solicitud_apov aplicando herencia de tabla (1 a 1 con solicitud)
        Schema::create('solicitud_apov', function (Blueprint $table) {
            $table->unsignedInteger('solicitud_id');
            $table->string('plan_elegido', 30)->default('oro');
            
            $table->primary('solicitud_id');
            $table->foreign('solicitud_id', 'fk_sol_apov_solicitud')
                  ->references('id')->on('solicitud')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });

        // 4. Recrear poliza_apov aplicando herencia de tabla (1 a 1 con poliza)
        Schema::create('poliza_apov', function (Blueprint $table) {
            $table->unsignedInteger('poliza_id');
            $table->decimal('suma_muerte_accidental', 18, 2)->default(0.00);
            $table->decimal('suma_invalidez', 18, 2)->default(0.00);
            $table->decimal('suma_medicos', 18, 2)->default(0.00);
            $table->decimal('suma_funerarios', 18, 2)->default(0.00);
            
            $table->primary('poliza_id');
            $table->foreign('poliza_id', 'fk_pol_apov_poliza')
                  ->references('id')->on('poliza')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('poliza_apov');
        Schema::dropIfExists('solicitud_apov');
        Schema::dropIfExists('tarifario_apov');
    }
};
