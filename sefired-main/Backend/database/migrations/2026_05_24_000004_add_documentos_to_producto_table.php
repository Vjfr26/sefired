<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->json('documentos')->nullable()->after('documento_path');
        });

        // Migrar valores existentes de documento_path al nuevo array documentos
        DB::table('producto')
            ->whereNotNull('documento_path')
            ->orderBy('id')
            ->each(function ($p) {
                DB::table('producto')
                    ->where('id', $p->id)
                    ->update([
                        'documentos' => json_encode([
                            ['nombre' => 'Documento', 'path' => $p->documento_path],
                        ]),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('producto', function (Blueprint $table) {
            $table->dropColumn('documentos');
        });
    }
};
