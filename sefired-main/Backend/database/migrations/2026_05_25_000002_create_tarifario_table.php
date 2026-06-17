<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Unified rate table replacing tarifario_rcv, tarifario_apov, tarifario_ec_ep.
 *
 * The `datos` JSON column is structured per producto.tipo_calculo:
 *
 *  fijo (RCV):
 *    { "categoria": "Particular", "dependencia": "Privado",
 *      "suma_persona": 15000, "prima_persona": 120,
 *      "suma_cosa": 5000,   "prima_cosa": 80, "prima_anual": 200 }
 *
 *  por_plan (APOV) — one row per plan (bronze/plata/oro/platino):
 *    { "plan": "oro",
 *      "muerte_accidental": { "suma": 10000, "prima": 50 },
 *      "invalidez":         { "suma": 10000, "prima": 40 },
 *      "medicos":           { "suma": 3000,  "prima": 30 },
 *      "funerarios":        { "suma": 2000,  "prima": 20 } }
 *
 *  por_nivel (EC / EP) — one row per level (base/plata/oro/diamante):
 *    { "nivel": "oro", "suma": 20000, "prima": 350 }
 *
 *  por_valor (custom/life):
 *    { "tasa_pct": 1.5 }   ← premium = valor_declarado × tasa_pct / 100
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tarifario', function (Blueprint $table) {
            $table->id();
            $table->unsignedInteger('producto_id');
            $table->foreign('producto_id')
                  ->references('id')->on('producto')
                  ->onDelete('cascade')
                  ->onUpdate('cascade');

            // Human-readable label shown in the wizard selector
            $table->string('nombre', 100);

            // Machine key used as selector value (e.g. 'particular', 'bronze', 'base')
            $table->string('subtipo', 50)->nullable();

            // Rate data — structure depends on producto.tipo_calculo
            $table->json('datos');

            $table->boolean('activo')->default(true);
            $table->timestamps();

            $table->index('producto_id', 'idx_tarifario_producto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tarifario');
    }
};
