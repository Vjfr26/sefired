<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Producción tiene ~15 sedes reales (CP, PO, MA, CCCT, EX, …) y el código de
 * póliza solo reserva 1 dígito de oficina — no alcanzan para todas. Decisión
 * (Victor, 2026-07-13): el catálogo debe quedar tal cual está producción, así
 * que el dígito pasa a ser OPCIONAL: una oficina sin dígito emite con 0,
 * exactamente como ya emite producción hoy. El catálogo entonces organiza los
 * selects y el reporte; el dígito solo lo conservan las sedes históricas del
 * mapa fijo (Caracas Principal=1, Maracaibo=2, Valencia=3).
 */
return new class extends Migration
{
    public function up(): void
    {
        DB::statement('ALTER TABLE `oficina` MODIFY `codigo` TINYINT UNSIGNED NULL');

        // Sedes reales según los usuarios existentes — repetible (el unique de
        // nombre + insertOrIgnore saltan las que ya estén). 'N/D' es el
        // placeholder del usuario de sistema __SIN_VENDEDOR__, no una sede.
        $sedes = DB::table('usuarios')
            ->whereNotNull('sede')
            ->where('sede', '<>', '')
            ->where('sede', '<>', 'N/D')
            ->distinct()
            ->pluck('sede');

        foreach ($sedes as $sede) {
            DB::table('oficina')->insertOrIgnore([
                'nombre'     => $sede,
                'codigo'     => null,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Las filas sin dígito son las sembradas/creadas bajo este esquema;
        // se quitan para poder devolver la columna a NOT NULL (codigo es
        // UNIQUE — no se puede poner 0 a varias).
        DB::statement('DELETE FROM `oficina` WHERE `codigo` IS NULL');
        DB::statement('ALTER TABLE `oficina` MODIFY `codigo` TINYINT UNSIGNED NOT NULL');
    }
};
