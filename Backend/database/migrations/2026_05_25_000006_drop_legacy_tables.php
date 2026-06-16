<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

/**
 * Drops the legacy per-product tables that have been consolidated into
 * the unified `tarifario` table with JSON datos.
 *
 * Drop order respects FK constraints:
 *   1. poliza_* extension tables (FK → poliza + tarifario_*)
 *   2. solicitud_apov (FK → solicitud)
 *   3. tarifario_* source tables (now replaced by `tarifario`)
 *   4. Other orphaned legacy tables (categorias, otros)
 */
return new class extends Migration
{
    public function up(): void
    {
        // Extension tables must go before the tarifario_* they FK into
        Schema::dropIfExists('poliza_rcv');
        Schema::dropIfExists('poliza_apov');
        Schema::dropIfExists('poliza_ec_ep');
        Schema::dropIfExists('solicitud_apov');

        // Legacy rate tables replaced by unified `tarifario`
        Schema::dropIfExists('tarifario_rcv');
        Schema::dropIfExists('tarifario_apov');
        Schema::dropIfExists('tarifario_ec_ep');

        // Orphaned utility tables no longer used
        Schema::dropIfExists('categorias');
        Schema::dropIfExists('otros');
    }

    public function down(): void
    {
        // Intentionally empty — this consolidation is irreversible.
        // Restore from a backup if needed.
    }
};
