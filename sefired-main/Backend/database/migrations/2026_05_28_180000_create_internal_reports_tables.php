<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('reportes_internos_programaciones', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100);
            $table->string('frecuencia', 50)->default('diario');
            $table->string('hora', 10)->default('08:00');
            $table->boolean('activo')->default(true);
            $table->dateTime('ultimo_envio')->nullable();
            $table->timestamps();
        });

        Schema::create('reportes_internos_historial', function (Blueprint $table) {
            $table->id();
            $table->string('nombre_reporte', 150);
            $table->dateTime('fecha_generacion');
            $table->string('archivo_path', 255);
            $table->integer('size')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reportes_internos_historial');
        Schema::dropIfExists('reportes_internos_programaciones');
    }
};
