<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla de roles de personas sobre un bien asegurado.
 *
 * Reemplaza conductor y tomador (que eran la misma estructura con distinto nombre)
 * y permite representar cualquier relación persona↔bien sin nuevas tablas:
 *
 *   propietario  → dueño legal del bien
 *   conductor    → persona autorizada a manejar (vehiculo)
 *   tomador      → quien contrata y paga la póliza (puede diferir del propietario)
 *   asegurado    → persona cubierta por el seguro (vida/salud)
 *   beneficiario → quien cobra en caso de siniestro (vida)
 *   otro         → libre para futuros tipos
 *
 * La columna `datos` JSON almacena información adicional por rol:
 *   tomador      → { "copia": true }
 *   beneficiario → { "porcentaje": 60, "parentesco": "cónyuge" }
 *   conductor    → { "licencia": "12345", "categoria": "3ra" }
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bien_persona_rol', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('bien_asegurado_id');
            $table->unsignedBigInteger('persona_id');
            $table->string('rol', 30);
            $table->json('datos')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['bien_asegurado_id', 'rol'], 'idx_bpr_bien_rol');
            $table->index('persona_id', 'idx_bpr_persona');

            $table->foreign('bien_asegurado_id', 'fk_bpr_bien')
                  ->references('id')->on('bien_asegurado')
                  ->onUpdate('cascade')->onDelete('cascade');

            $table->foreign('persona_id', 'fk_bpr_persona')
                  ->references('id')->on('persona')
                  ->onUpdate('cascade')->onDelete('restrict');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bien_persona_rol');
    }
};
