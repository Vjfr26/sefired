<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Backfill: las pólizas emitidas ANTES de crearse poliza_bienes no tienen
 * ninguna fila ahí — sin esto, "Bienes Cubiertos" se vería vacío para toda
 * póliza ya existente, aunque sí tengan su bien original vía
 * solicitud.bien_asegurado_id. Se registran con certificado=NULL, igual
 * que las nuevas (bien original = cubierto bajo el propio nro_contrato).
 */
return new class extends Migration
{
    public function up(): void
    {
        $polizas = DB::table('poliza')
            ->join('solicitud', 'solicitud.id', '=', 'poliza.solicitud_id')
            ->whereNotNull('solicitud.bien_asegurado_id')
            ->select('poliza.id as poliza_id', 'poliza.cobertura_dolares', 'poliza.cobertura_bs', 'solicitud.bien_asegurado_id')
            ->get();

        foreach ($polizas as $p) {
            $existe = DB::table('poliza_bienes')
                ->where('poliza_id', $p->poliza_id)
                ->where('bien_asegurado_id', $p->bien_asegurado_id)
                ->exists();

            if (!$existe) {
                DB::table('poliza_bienes')->insert([
                    'poliza_id'         => $p->poliza_id,
                    'bien_asegurado_id' => $p->bien_asegurado_id,
                    'certificado'       => null,
                    'cobertura_dolares' => $p->cobertura_dolares,
                    'cobertura_bs'      => $p->cobertura_bs,
                    'created_at'        => now(),
                    'updated_at'        => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        // Backfill — no se revierte (no hay forma de distinguir backfilled de creado por la app).
    }
};
