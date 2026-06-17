<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vehiculo', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('cliente_id');
            $table->string('placa', 10)->unique('uq_vehiculo_placa');
            $table->date('fecha_adquisicion')->nullable();
            $table->string('certificado_transito', 20)->nullable();
            $table->string('certificado_origen', 20)->nullable();
            $table->string('marca', 100)->nullable();
            $table->string('modelo', 100)->nullable();
            $table->string('clase', 80)->nullable();
            $table->string('tipo', 80)->nullable();
            $table->smallInteger('anio')->unsigned()->nullable();
            $table->string('uso', 40)->nullable();
            $table->string('color', 30)->nullable();
            $table->unsignedInteger('peso')->nullable();
            $table->tinyInteger('puestos')->unsigned()->nullable();
            $table->string('aparcamiento', 30)->nullable();
            $table->string('serial_carroceria', 40)->nullable();
            $table->string('serial_motor', 40)->nullable();
            $table->string('titulo', 180)->nullable();

            $table->index('cliente_id', 'idx_vehiculo_cliente');
            $table->foreign('cliente_id', 'fk_vehiculo_cliente')
                  ->references('id')->on('cliente')
                  ->onUpdate('cascade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vehiculo');
    }
};
