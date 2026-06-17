<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Documentos del cliente (cédula, RIF, carnet de circulación, etc.).
 * Se suben una vez y se reutilizan en cualquier solicitud futura.
 * El sistema cruza estos docs contra producto.documentos_requeridos para detectar faltantes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cliente_documentos', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('cliente_id');
            $table->foreign('cliente_id')
                  ->references('id')->on('cliente')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Nombre descriptivo del documento (ej: "Cédula de Identidad")
            $table->string('nombre', 100);

            // Path relativo en storage/app/public
            $table->string('path', 500);

            // Tamaño en bytes y tipo MIME para validación en frontend
            $table->unsignedBigInteger('size')->nullable();
            $table->string('mime', 80)->nullable();

            $table->timestamps();

            $table->index('cliente_id', 'idx_cli_docs_cliente');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cliente_documentos');
    }
};
