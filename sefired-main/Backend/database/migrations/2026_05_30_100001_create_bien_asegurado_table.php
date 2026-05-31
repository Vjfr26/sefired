<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Crea la tabla genérica bien_asegurado.
 *
 * Reemplaza vehiculo (y futuras tablas específicas por tipo) con una sola
 * tabla flexible. El tipo de bien se discrimina con la columna `tipo` y
 * todos los atributos específicos van en el JSON `atributos`.
 *
 * Tipos previstos:
 *   vehiculo  → placa, marca, modelo, anio, color, uso, clase, seriales…
 *   inmueble  → subtipo, dirección, estado, ciudad, metros2, uso…
 *   vida      → condición médica, actividad de riesgo…
 *   bien      → descripción, marca, serial, ubicación…
 *   otro      → libre
 *
 * Para los campos de vehiculo que se consultan con frecuencia (placa,
 * serial_carroceria) se crean columnas STORED generadas sobre el JSON
 * con índices únicos que MySQL respeta con NULL (NULL ≠ NULL en UNIQUE).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bien_asegurado', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('persona_id')->nullable()->comment('Titular/dueño del bien');
            $table->string('tipo', 30)->comment('vehiculo|inmueble|vida|bien|otro');
            $table->json('atributos')->nullable()->comment('Datos específicos según tipo');
            $table->decimal('valor_declarado', 18, 2)->nullable();
            $table->string('descripcion', 200)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('tipo',       'idx_bien_tipo');
            $table->index('persona_id', 'idx_bien_persona');

            $table->foreign('persona_id', 'fk_bien_persona')
                  ->references('id')->on('persona')
                  ->onUpdate('cascade')->onDelete('restrict');

            $table->foreign('created_by', 'fk_bien_created_by')
                  ->references('id')->on('usuarios')
                  ->onUpdate('cascade')->onDelete('set null');
        });

        // Columnas generadas (STORED) para campos de vehiculo que necesitan índice único.
        // Se usan DB::statement porque Blueprint no expone storedAs() con funciones JSON
        // de forma portable entre MySQL y MariaDB.
        DB::statement("
            ALTER TABLE bien_asegurado
            ADD COLUMN placa_idx VARCHAR(20)
                GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.placa'))) STORED
                COMMENT 'Índice buscable de placa (solo tipo=vehiculo)'
        ");
        DB::statement("
            ALTER TABLE bien_asegurado
            ADD UNIQUE INDEX idx_bien_placa (placa_idx)
        ");

        DB::statement("
            ALTER TABLE bien_asegurado
            ADD COLUMN serial_carroceria_idx VARCHAR(40)
                GENERATED ALWAYS AS (JSON_UNQUOTE(JSON_EXTRACT(atributos, '$.serial_carroceria'))) STORED
                COMMENT 'Índice buscable de serial (solo tipo=vehiculo)'
        ");
        DB::statement("
            ALTER TABLE bien_asegurado
            ADD UNIQUE INDEX idx_bien_serial (serial_carroceria_idx)
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('bien_asegurado');
    }
};
