<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('otros', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre_producto', 30);
            $table->string('tipo_carro', 50);
            $table->decimal('tasa', 10, 4)->default(0.0000);
            $table->decimal('tasa_cobertura', 10, 4)->default(0.0000);
            $table->decimal('suma_cobertura', 18, 2)->default(0.00);
            $table->decimal('suma_diamante', 18, 2)->default(0.00);
            $table->decimal('prima_diamante', 18, 2)->default(0.00);
            $table->decimal('suma_total', 18, 2)->default(0.00);
            $table->decimal('prima', 18, 2)->default(0.00);

            $table->unique(['nombre_producto', 'tipo_carro'], 'uq_otros');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('otros');
    }
};
