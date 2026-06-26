<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cuotas mensuales de una póliza con frecuencia_pago='Mensual'.
 *
 * Al emitir/renovar en mensual se generan 12 cuotas (financiamiento: el total
 * mensual = prima * (1 + recargo%), repartido en 12). Cada cobro se asigna a
 * las cuotas pendientes en orden y emite un recibo (factura). El excedente
 * adelanta cuotas siguientes (saldo a favor implícito).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cuota', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poliza_id')->constrained('poliza')->cascadeOnDelete();
            $table->unsignedTinyInteger('numero');                 // 1..12
            $table->decimal('monto', 12, 2);                       // monto de la cuota (moneda nativa del producto)
            $table->decimal('monto_pagado', 12, 2)->default(0);
            $table->date('fecha_vencimiento');
            $table->string('status', 12)->default('PENDIENTE');    // PENDIENTE / PARCIAL / PAGADA / VENCIDA
            $table->foreignId('factura_id')->nullable()->constrained('factura')->nullOnDelete();
            $table->date('fecha_pago')->nullable();
            $table->timestamps();

            $table->unique(['poliza_id', 'numero'], 'uq_cuota_poliza_numero');
            $table->index(['status', 'fecha_vencimiento'], 'idx_cuota_status_venc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cuota');
    }
};
