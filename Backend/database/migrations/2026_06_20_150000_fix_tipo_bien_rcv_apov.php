<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Corrige producto.tipo_bien para RCV y APOV (productos vehiculares).
 *
 * La migración 2026_05_30_100004_extend_producto_tipo_bien backfillió
 * tipo_bien a partir de requiere_vehiculo, pero ese campo ya estaba en 0
 * para estos dos productos, así que heredaron 'ninguno' en vez de
 * 'vehiculo'. Esto hacía que PortalController::cotizar() (línea ~267) no
 * creara el bien_asegurado con los datos del vehículo del formulario
 * público — el lead quedaba guardado sin placa/marca/modelo, perdiéndolos
 * en silencio. Confirmado sin pérdida de datos real aún (no hay leads con
 * fuente='portal' para estos productos todavía).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::table('producto')->whereIn('tipo', ['rcv', 'apov'])->update(['tipo_bien' => 'vehiculo']);
    }

    public function down(): void
    {
        // Corrección de dato incorrecto — no se revierte a un estado que sabemos roto.
    }
};
