<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('opc_vehiculos_uso', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('id_empresa')->nullable();
            $table->timestamp('fecha_registro')->useCurrent();
            $table->string('uso', 100);
            $table->enum('activo', ['SI', 'NO'])->default('SI');
            $table->enum('eliminado', ['SI', 'NO'])->default('NO');

            $table->unique('uso', 'uq_uso');
            $table->index(['activo', 'eliminado'], 'idx_uso_activo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('opc_vehiculos_uso');
    }
};
