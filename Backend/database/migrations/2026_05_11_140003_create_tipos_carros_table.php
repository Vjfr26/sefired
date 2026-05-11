<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tipos_carros', function (Blueprint $table) {
            $table->increments('id');
            $table->string('tipo_carro', 50);
            $table->string('grupo', 50);
            $table->enum('contexto', ['general', 'ecep'])->default('general');

            $table->unique(['tipo_carro', 'grupo', 'contexto'], 'uq_tipo_grupo_ctx');
            $table->index('tipo_carro', 'idx_tipo_carro');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tipos_carros');
    }
};
