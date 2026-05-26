<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the insured-person fields directly to `poliza` so they are
 * available for the policy document without joining solicitud.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->string('asegurado_nombre', 120)->nullable()->after('tipo');
            $table->string('asegurado_ci',     20)->nullable()->after('asegurado_nombre');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropColumn(['asegurado_nombre', 'asegurado_ci']);
        });
    }
};
