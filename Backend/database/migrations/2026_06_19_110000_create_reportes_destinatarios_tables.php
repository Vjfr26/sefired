<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Cada destinatario tiene su PROPIA frecuencia de envío — la misma
        // programación puede mandarle el reporte a un correo todos los días
        // y a otro solo una vez al mes.
        Schema::create('reportes_externos_destinatarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('programacion_id')
                  ->constrained('reportes_externos_programaciones')
                  ->cascadeOnDelete();
            $table->string('email', 150);
            $table->string('frecuencia', 20)->default('diario');
            $table->boolean('activo')->default(true);
            $table->dateTime('ultimo_envio')->nullable();
            $table->timestamps();
        });

        Schema::create('reportes_internos_destinatarios', function (Blueprint $table) {
            $table->id();
            $table->foreignId('programacion_id')
                  ->constrained('reportes_internos_programaciones')
                  ->cascadeOnDelete();
            $table->string('email', 150);
            $table->string('frecuencia', 20)->default('diario');
            $table->boolean('activo')->default(true);
            $table->dateTime('ultimo_envio')->nullable();
            $table->timestamps();
        });

        // La frecuencia y el último envío ahora viven por destinatario, no
        // por programación (un mismo reporte puede enviarse a distintos
        // correos con distinta frecuencia cada uno).
        Schema::table('reportes_externos_programaciones', function (Blueprint $table) {
            $table->dropColumn(['frecuencia', 'ultimo_envio']);
        });
        Schema::table('reportes_internos_programaciones', function (Blueprint $table) {
            $table->dropColumn(['frecuencia', 'ultimo_envio']);
        });
    }

    public function down(): void
    {
        Schema::table('reportes_externos_programaciones', function (Blueprint $table) {
            $table->string('frecuencia', 20)->default('diario');
            $table->dateTime('ultimo_envio')->nullable();
        });
        Schema::table('reportes_internos_programaciones', function (Blueprint $table) {
            $table->string('frecuencia', 50)->default('diario');
            $table->dateTime('ultimo_envio')->nullable();
        });

        Schema::dropIfExists('reportes_internos_destinatarios');
        Schema::dropIfExists('reportes_externos_destinatarios');
    }
};
