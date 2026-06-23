<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Registro de retiro de efectivo por oficina/forma de pago dentro de un
 * período de reporte — permite marcar si el efectivo cobrado ya fue
 * retirado físicamente, con notas y el documento de entrega adjunto.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('retiro_efectivo', function (Blueprint $table) {
            $table->id();
            $table->string('sede', 60);
            $table->string('forma_pago', 35);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->boolean('retirado')->default(false);
            $table->text('notas')->nullable();
            $table->string('documento_path')->nullable();
            $table->string('documento_nombre')->nullable();
            $table->unsignedInteger('usuario_id')->nullable();
            $table->timestamp('fecha_marcado')->nullable();
            $table->timestamps();

            $table->unique(['sede', 'forma_pago', 'fecha_inicio', 'fecha_fin'], 'uq_retiro_efectivo');
            $table->foreign('usuario_id', 'fk_retiro_efectivo_usuario')
                  ->references('id')->on('usuarios')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('retiro_efectivo');
    }
};
