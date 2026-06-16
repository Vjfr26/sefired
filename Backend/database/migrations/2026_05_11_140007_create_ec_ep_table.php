<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ec_ep', function (Blueprint $table) {
            $table->increments('id');
            $table->string('nombre_producto', 60);
            $table->string('tipo_carro', 50);
            $table->decimal('tasa', 10, 4)->default(0.0000);
            $table->decimal('suma_cobertura', 18, 2)->default(0.00);
            $table->decimal('prima_cobertura', 18, 2)->default(0.00);
            $table->decimal('suma_total', 18, 2)->default(0.00);
            $table->decimal('suma_plata', 18, 2)->default(0.00);
            $table->decimal('prima_plata', 18, 2)->default(0.00);
            $table->decimal('suma_oro', 18, 2)->default(0.00);
            $table->decimal('prima_oro', 18, 2)->default(0.00);

            $table->unique(['nombre_producto', 'tipo_carro'], 'uq_ec_ep');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ec_ep');
    }
};
