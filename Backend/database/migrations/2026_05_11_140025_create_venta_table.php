<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('venta', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('usuario_id');
            $table->unsignedInteger('producto_id');
            $table->date('fecha_venta');

            $table->index('usuario_id', 'idx_venta_usuario');
            $table->index('fecha_venta', 'idx_venta_fecha');
            $table->foreign('usuario_id', 'fk_venta_usuario')
                  ->references('id')->on('usuarios')->onUpdate('cascade');
            $table->foreign('producto_id', 'fk_venta_producto')
                  ->references('id')->on('producto')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('venta');
    }
};
