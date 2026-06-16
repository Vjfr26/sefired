<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Correcciones estructurales derivadas de auditoría de base de datos (2026-05-25):
 *
 *  1. Unique constraint uq_poliza: reemplaza compuesto (4 campos) por simple (nro_contrato)
 *  2. Elimina índices duplicados: idx_factura_fecha, idx_indicador_tipo_fecha, idx_marca
 *  3. Añade FK + índice en solicitud.vendedor_id → usuarios.id
 *  4. Corrige tipo de ip_bloqueada.usuario_id (bigint → int unsigned) y añade FK
 *  5. Amplía enum producto.tipo para cubrir productos no vehiculares
 *  6. Corrige producto.tipo de los productos no vehiculares insertados
 *  7. Convierte campos longtext de JSON a tipo JSON con validación CHECK
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Fix uq_poliza ─────────────────────────────────────────────────────
        // El constraint compuesto (nro_contrato, solicitud_id, producto_id, fecha_emision)
        // permite nro_contrato duplicado si alguno de los otros campos difiere.
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropUnique('uq_poliza');
        });
        Schema::table('poliza', function (Blueprint $table) {
            $table->unique('nro_contrato', 'uq_poliza_nro');
        });

        // ── 2. Eliminar índices duplicados ───────────────────────────────────────
        // factura.fecha_factura: cubierta por uq_factura (sede, fecha_factura, numero)
        Schema::table('factura', function (Blueprint $table) {
            $table->dropIndex('idx_factura_fecha');
        });
        // indicador_economico.tipo: cubierto por uq_indicador_tipo_moneda_fecha
        Schema::table('indicador_economico', function (Blueprint $table) {
            $table->dropIndex('idx_indicador_tipo_fecha');
        });
        // modelo_vehiculo.marca: cubierto por uq_marca_modelo (marca, modelo)
        Schema::table('modelo_vehiculo', function (Blueprint $table) {
            $table->dropIndex('idx_marca');
        });

        // ── 3. FK + índice en solicitud.vendedor_id ──────────────────────────────
        Schema::table('solicitud', function (Blueprint $table) {
            $table->index('vendedor_id', 'idx_solicitud_vendedor');
            $table->foreign('vendedor_id', 'fk_solicitud_vendedor')
                ->references('id')->on('usuarios')
                ->onUpdate('CASCADE')
                ->onDelete('SET NULL');
        });

        // ── 4. ip_bloqueada.usuario_id: bigint → int unsigned + FK ──────────────
        // Quitar el índice antes de modificar el tipo
        Schema::table('ip_bloqueada', function (Blueprint $table) {
            $table->dropIndex('ip_bloqueada_usuario_id_index');
        });
        DB::statement('ALTER TABLE ip_bloqueada MODIFY usuario_id INT UNSIGNED NULL');
        Schema::table('ip_bloqueada', function (Blueprint $table) {
            $table->index('usuario_id', 'ip_bloqueada_usuario_id_index');
            $table->foreign('usuario_id', 'fk_ip_bloqueada_usuario')
                ->references('id')->on('usuarios')
                ->onUpdate('CASCADE')
                ->onDelete('SET NULL');
        });

        // ── 5. Ampliar producto.tipo ─────────────────────────────────────────────
        DB::statement("
            ALTER TABLE producto
            MODIFY tipo ENUM('rcv','apov','alpd','ec','ep','vida','salud','hogar','accidentes','funeraria','otro')
            NOT NULL DEFAULT 'otro'
        ");

        // ── 6. Corregir tipo de los productos no vehiculares ─────────────────────
        DB::statement("UPDATE producto SET tipo='vida'       WHERE id=5");
        DB::statement("UPDATE producto SET tipo='salud'      WHERE id=6");
        DB::statement("UPDATE producto SET tipo='hogar'      WHERE id=7");
        DB::statement("UPDATE producto SET tipo='accidentes' WHERE id=8");
        DB::statement("UPDATE producto SET tipo='funeraria'  WHERE id=9");

        // ── 7. longtext → JSON con constraint de validación ──────────────────────
        // En MariaDB JSON es un alias de LONGTEXT; el CHECK añade validación real.
        DB::statement('ALTER TABLE solicitud  MODIFY coberturas LONGTEXT NULL          CHECK (coberturas IS NULL OR JSON_VALID(coberturas))');
        DB::statement('ALTER TABLE tarifario  MODIFY datos      LONGTEXT NOT NULL      CHECK (JSON_VALID(datos))');
        DB::statement('ALTER TABLE usuarios   MODIFY permisos   LONGTEXT NULL          CHECK (permisos IS NULL OR JSON_VALID(permisos))');
        DB::statement('ALTER TABLE producto   MODIFY documentos LONGTEXT NULL          CHECK (documentos IS NULL OR JSON_VALID(documentos))');
        DB::statement('ALTER TABLE producto   MODIFY documentos_requeridos LONGTEXT NULL CHECK (documentos_requeridos IS NULL OR JSON_VALID(documentos_requeridos))');
        DB::statement('ALTER TABLE producto   MODIFY tasas      LONGTEXT NULL          CHECK (tasas IS NULL OR JSON_VALID(tasas))');
    }

    public function down(): void
    {
        // ── Revertir CHECK constraints ───────────────────────────────────────────
        DB::statement('ALTER TABLE solicitud MODIFY coberturas          LONGTEXT NULL');
        DB::statement('ALTER TABLE tarifario MODIFY datos               LONGTEXT NOT NULL');
        DB::statement('ALTER TABLE usuarios  MODIFY permisos            LONGTEXT NULL');
        DB::statement('ALTER TABLE producto  MODIFY documentos          LONGTEXT NULL');
        DB::statement('ALTER TABLE producto  MODIFY documentos_requeridos LONGTEXT NULL');
        DB::statement('ALTER TABLE producto  MODIFY tasas               LONGTEXT NULL');

        // ── Revertir tipo de productos no vehiculares ────────────────────────────
        DB::statement("UPDATE producto SET tipo='alpd' WHERE id IN (5,6,9)");
        DB::statement("UPDATE producto SET tipo='ec'   WHERE id=7");
        DB::statement("UPDATE producto SET tipo='apov' WHERE id=8");

        // ── Revertir producto.tipo enum ──────────────────────────────────────────
        DB::statement("
            ALTER TABLE producto
            MODIFY tipo ENUM('rcv','apov','alpd','ec','ep')
            NOT NULL DEFAULT 'alpd'
        ");

        // ── Revertir ip_bloqueada ────────────────────────────────────────────────
        Schema::table('ip_bloqueada', function (Blueprint $table) {
            $table->dropForeign('fk_ip_bloqueada_usuario');
            $table->dropIndex('ip_bloqueada_usuario_id_index');
        });
        DB::statement('ALTER TABLE ip_bloqueada MODIFY usuario_id BIGINT UNSIGNED NULL');
        Schema::table('ip_bloqueada', function (Blueprint $table) {
            $table->index('usuario_id', 'ip_bloqueada_usuario_id_index');
        });

        // ── Revertir FK solicitud.vendedor_id ────────────────────────────────────
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropForeign('fk_solicitud_vendedor');
            $table->dropIndex('idx_solicitud_vendedor');
        });

        // ── Restaurar índices eliminados ─────────────────────────────────────────
        Schema::table('modelo_vehiculo', function (Blueprint $table) {
            $table->index('marca', 'idx_marca');
        });
        Schema::table('indicador_economico', function (Blueprint $table) {
            $table->index(['tipo', 'fecha_registro'], 'idx_indicador_tipo_fecha');
        });
        Schema::table('factura', function (Blueprint $table) {
            $table->index('fecha_factura', 'idx_factura_fecha');
        });

        // ── Restaurar uq_poliza compuesto ────────────────────────────────────────
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropUnique('uq_poliza_nro');
            $table->unique(['nro_contrato', 'solicitud_id', 'producto_id', 'fecha_emision'], 'uq_poliza');
        });
    }
};
