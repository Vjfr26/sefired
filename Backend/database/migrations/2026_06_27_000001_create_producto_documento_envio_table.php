<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Control de envío de documentos de un producto (tipo de póliza) a cada cliente.
 * Cada documento del producto se envía por correo una sola vez por persona; esta
 * tabla registra qué documento (por su ruta) ya recibió cada cliente, para no
 * duplicar y para enviar solo los faltantes a clientes nuevos o existentes.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('producto_documento_envio', function (Blueprint $table) {
            $table->id();
            $table->foreignId('producto_id')->constrained('producto')->cascadeOnDelete();
            $table->string('doc_path', 255);        // identifica el documento del producto
            $table->foreignId('persona_id')->constrained('persona')->cascadeOnDelete();
            $table->unsignedBigInteger('poliza_id')->nullable();
            $table->timestamp('enviado_en')->useCurrent();

            // Un mismo documento de un producto se envía una sola vez por persona
            $table->unique(['producto_id', 'doc_path', 'persona_id'], 'pde_unico');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('producto_documento_envio');
    }
};
