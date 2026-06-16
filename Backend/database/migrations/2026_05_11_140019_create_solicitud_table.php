<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitud', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('cliente_id');
            $table->string('placa', 20);
            $table->unsignedInteger('producto_id');
            $table->decimal('total', 18, 2)->default(0.00);
            $table->decimal('total_bs', 18, 2)->default(0.00);
            $table->decimal('suma_cobertura_bs', 18, 2)->default(0.00);
            $table->decimal('suma_prima_bs', 18, 2)->default(0.00);
            $table->date('fecha_solicitud');

            $table->unique(['cliente_id', 'placa', 'producto_id', 'fecha_solicitud'], 'uq_solicitud');
            $table->index('cliente_id', 'idx_solicitud_cliente');
            $table->index('placa', 'idx_solicitud_placa');
            $table->index('fecha_solicitud', 'idx_solicitud_fecha');
            $table->foreign('cliente_id', 'fk_solicitud_cliente')
                  ->references('id')->on('cliente')->onUpdate('cascade');
            $table->foreign('producto_id', 'fk_solicitud_producto')
                  ->references('id')->on('producto')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitud');
    }
};
