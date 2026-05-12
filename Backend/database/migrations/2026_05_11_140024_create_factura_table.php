<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('factura', function (Blueprint $table) {
            $table->increments('id');
            $table->string('numero', 30);
            $table->string('sede', 20);
            $table->date('fecha_factura');
            $table->unsignedInteger('poliza_id');
            $table->decimal('valor', 18, 2)->default(0.00);
            $table->decimal('valor_bs', 18, 2)->default(0.00);
            $table->string('forma_pago', 35);
            $table->string('referencia', 50)->nullable();
            $table->unsignedInteger('usuario_id');

            $table->unique(['numero', 'sede', 'fecha_factura'], 'uq_factura');
            $table->index('fecha_factura', 'idx_factura_fecha');
            $table->foreign('poliza_id', 'fk_factura_poliza')
                  ->references('id')->on('poliza')->onUpdate('cascade');
            $table->foreign('usuario_id', 'fk_factura_usuario')
                  ->references('id')->on('usuarios')->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('factura');
    }
};
