<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Versionado del tarifario.
 *
 * Cada cambio de tasas/datos genera una nueva fila (nueva versión) en lugar
 * de sobreescribir la anterior, preservando el historial histórico.
 * Las pólizas emitidas siguen apuntando a la versión exacta usada al cotizar.
 *
 * Nuevas columnas:
 *   version        — número de versión dentro del producto (1, 2, 3…)
 *   vigencia_desde — fecha a partir de la cual aplica esta versión
 *   vigencia_hasta — fecha en que fue archivada (null = sigue vigente)
 *   parent_id      — versión anterior de la que se derivó (FK a sí misma)
 *   estado         — borrador | vigente | archivado
 *   creado_por     — usuario que creó la versión
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tarifario', function (Blueprint $table) {
            $table->unsignedSmallInteger('version')->default(1)->after('activo');
            $table->date('vigencia_desde')->nullable()->after('version');
            $table->date('vigencia_hasta')->nullable()->after('vigencia_desde');
            $table->unsignedBigInteger('parent_id')->nullable()->after('vigencia_hasta');
            $table->enum('estado', ['borrador', 'vigente', 'archivado'])->default('vigente')->after('parent_id');
            $table->unsignedBigInteger('creado_por')->nullable()->after('estado');

            $table->index(['producto_id', 'estado'], 'idx_tar_producto_estado');
            $table->index('vigencia_desde', 'idx_tar_vigencia');
        });

        // Inicializar registros existentes: versión 1, vigente desde hoy, sin parent
        DB::statement("UPDATE tarifario SET version=1, estado='vigente', vigencia_desde=COALESCE(DATE(created_at), CURDATE()) WHERE version IS NULL OR version = 1");

        Schema::table('tarifario', function (Blueprint $table) {
            $table->foreign('parent_id', 'fk_tar_parent')
                ->references('id')->on('tarifario')
                ->onUpdate('CASCADE')
                ->onDelete('SET NULL');
            $table->foreign('creado_por', 'fk_tar_creado_por')
                ->references('id')->on('usuarios')
                ->onUpdate('CASCADE')
                ->onDelete('SET NULL');
        });
    }

    public function down(): void
    {
        Schema::table('tarifario', function (Blueprint $table) {
            $table->dropForeign('fk_tar_parent');
            $table->dropForeign('fk_tar_creado_por');
            $table->dropIndex('idx_tar_producto_estado');
            $table->dropIndex('idx_tar_vigencia');
            $table->dropColumn(['version', 'vigencia_desde', 'vigencia_hasta', 'parent_id', 'estado', 'creado_por']);
        });
    }
};
