<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('indicador_economico', function (Blueprint $table) {
            $table->increments('id');
            $table->enum('tipo', ['tasa_cambio', 'unidad_tributaria']);
            $table->decimal('valor', 18, 4);
            $table->dateTime('fecha_registro')->useCurrent();

            $table->index(['tipo', 'fecha_registro'], 'idx_indicador_tipo_fecha');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('indicador_economico');
    }
};
