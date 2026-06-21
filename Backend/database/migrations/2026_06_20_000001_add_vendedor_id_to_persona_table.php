<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('persona', function (Blueprint $table) {
            // Vendedor que registró al cliente. Nullable: clientes que vienen
            // del portal público o de antes de este campo no tienen uno
            // asignado, y eso no debe ocultarlos de nadie (ver índice abajo).
            $table->unsignedBigInteger('vendedor_id')->nullable()->after('id');
            $table->foreign('vendedor_id')->references('id')->on('usuarios')->nullOnDelete();
        });

        // Backfill: a los clientes que ya existen se les asigna el vendedor
        // de su solicitud más antigua (la que probablemente los trajo),
        // para que un vendedor no pierda de vista a sus clientes actuales
        // en cuanto se empiece a filtrar el listado por vendedor_id.
        $rows = DB::table('solicitud')
            ->whereNotNull('vendedor_id')
            ->whereNotNull('persona_id')
            ->orderBy('fecha_solicitud')
            ->orderBy('id')
            ->get(['persona_id', 'vendedor_id']);

        $asignado = [];
        foreach ($rows as $r) {
            if (!isset($asignado[$r->persona_id])) {
                $asignado[$r->persona_id] = $r->vendedor_id;
            }
        }
        foreach ($asignado as $personaId => $vendedorId) {
            DB::table('persona')->where('id', $personaId)->update(['vendedor_id' => $vendedorId]);
        }
    }

    public function down(): void
    {
        Schema::table('persona', function (Blueprint $table) {
            $table->dropForeign(['vendedor_id']);
            $table->dropColumn('vendedor_id');
        });
    }
};
