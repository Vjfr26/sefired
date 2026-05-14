<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poliza', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nro_contrato', 30);
            $table->unsignedInteger('solicitud_id');
            $table->unsignedInteger('producto_id');
            $table->decimal('total', 18, 2)->default(0.00);
            $table->decimal('total_bs', 18, 2)->default(0.00);
            $table->decimal('cobertura_dolares', 18, 2)->default(0.00);
            $table->decimal('cobertura_bs', 18, 2)->default(0.00);
            $table->string('pago', 30);
            $table->string('tipo', 20);
            $table->date('fecha_emision');
            $table->date('fecha_vencimiento');
            $table->string('papeleria', 80)->nullable();
            $table->unsignedInteger('vendedor_id')->nullable();
            $table->string('sede_poliza', 10)->nullable();
            $table->string('status', 15)->default('ACTIVA');

            $table->unique(['nro_contrato', 'solicitud_id', 'producto_id', 'fecha_emision'], 'uq_poliza');
            $table->index('fecha_emision', 'idx_poliza_fecha_emision');
            $table->index('fecha_vencimiento', 'idx_poliza_vencimiento');
            $table->index('status', 'idx_poliza_status');
            $table->foreign('solicitud_id', 'fk_poliza_solicitud')
                  ->references('id')->on('solicitud')->onUpdate('cascade');
            $table->foreign('producto_id', 'fk_poliza_producto')
                  ->references('id')->on('producto')->onUpdate('cascade');
            $table->foreign('vendedor_id', 'fk_poliza_vendedor')
                  ->references('id')->on('usuarios')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poliza');
    }
};
