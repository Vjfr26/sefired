<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('solicitudes_renovacion_qr', function (Blueprint $table) {
            $table->id();
            $table->foreignId('poliza_id')->constrained('poliza')->cascadeOnDelete();
            $table->string('nro_contrato', 30);

            // Datos del solicitante
            $table->string('nombre', 100);
            $table->string('telefono', 30);
            $table->string('correo', 100)->nullable();

            // Datos del pago reportado
            $table->string('metodo_pago', 50);
            $table->string('banco', 80)->nullable();
            $table->string('referencia', 100);
            $table->decimal('monto', 18, 2);
            $table->string('moneda', 5); // USD, EUR, Bs.

            // Gestión interna
            $table->enum('status', ['PENDIENTE', 'AUTORIZADA', 'RECHAZADA'])->default('PENDIENTE');
            $table->text('nota_agente')->nullable();
            $table->foreignId('procesado_por')->nullable()->constrained('usuarios')->nullOnDelete();

            $table->timestamps();

            $table->index(['status', 'created_at']);
            $table->index('poliza_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('solicitudes_renovacion_qr');
    }
};
