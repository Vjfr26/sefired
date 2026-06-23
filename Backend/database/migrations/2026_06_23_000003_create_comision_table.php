<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Comisión generada por cada póliza emitida/renovada, con estado
 * Pendiente/Pagada persistente (antes se recalculaba al vuelo en cada
 * reporte, sin forma de marcar qué ya se pagó).
 *
 * Sin backfill aquí a propósito — las pólizas existentes se respaldan con
 * el comando `comisiones:backfill`, repetible, para poder correrse después
 * de importar datos reales sin depender del momento en que corra esta migración.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('comision', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('poliza_id');
            $table->unsignedBigInteger('vendedor_id')->nullable();
            $table->decimal('base_usd', 18, 2);
            $table->decimal('tasa_pct', 5, 2);
            $table->decimal('monto', 18, 2);
            $table->string('status', 15)->default('PENDIENTE');
            $table->date('fecha_generada');
            $table->date('fecha_pago')->nullable();
            $table->unsignedBigInteger('pagado_por')->nullable();

            $table->unique('poliza_id', 'uq_comision_poliza');
            $table->index('vendedor_id', 'idx_comision_vendedor');
            $table->index('status', 'idx_comision_status');

            $table->foreign('poliza_id', 'fk_comision_poliza')
                  ->references('id')->on('poliza')->onDelete('cascade');
            $table->foreign('vendedor_id', 'fk_comision_vendedor')
                  ->references('id')->on('usuarios')->onDelete('set null');
            $table->foreign('pagado_por', 'fk_comision_pagado_por')
                  ->references('id')->on('usuarios')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('comision');
    }
};
