<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 1 — Integridad de base de datos
 *
 *  1.  usuarios.email: nueva columna nullable con UNIQUE
 *  2.  Soft deletes (deleted_at): solicitud, poliza, factura, cliente, producto, vehiculo
 *  3.  Auditoría (created_by / updated_by BIGINT nullable): solicitud, poliza, factura, producto
 *  4.  Índice en solicitud.status
 *  5.  Nueva tabla audit_log para trazabilidad de cambios
 *  6.  Normalización de IDs: todos los PKs y FKs a BIGINT UNSIGNED
 *        – Se descartan todas las FKs, se alteran columnas, se recrean FKs con nombres estándar
 *  7.  UNIQUE simple en factura.numero
 *  8.  UNIQUE en vehiculo.serial_carroceria (NULL permitido por MySQL)
 */
return new class extends Migration
{
    // ── up ────────────────────────────────────────────────────────────────────

    public function up(): void
    {
        // ── 1. usuarios.email ─────────────────────────────────────────────────
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('email', 150)->nullable()->unique('uq_usuarios_email')->after('nombre');
        });

        // ── 2. Soft deletes ───────────────────────────────────────────────────
        foreach (['solicitud', 'poliza', 'factura', 'cliente', 'producto', 'vehiculo'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->softDeletes();
            });
        }

        // ── 3. Auditoría: created_by / updated_by ─────────────────────────────
        // Ya como BIGINT UNSIGNED para coincidir con el tipo post-normalización.
        foreach (['solicitud', 'poliza', 'factura', 'producto'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->unsignedBigInteger('created_by')->nullable();
                $table->unsignedBigInteger('updated_by')->nullable();
            });
        }

        // ── 4. Índice en solicitud.status ─────────────────────────────────────
        Schema::table('solicitud', function (Blueprint $table) {
            $table->index('status', 'idx_solicitud_status');
        });

        // ── 5. Tabla audit_log ────────────────────────────────────────────────
        Schema::create('audit_log', function (Blueprint $table) {
            $table->id();                                        // BIGINT UNSIGNED PK
            $table->string('modelo', 80);                        // ej. 'Poliza', 'Solicitud'
            $table->unsignedBigInteger('modelo_id')->nullable(); // id del registro afectado
            $table->string('accion', 30);                        // created | updated | deleted | status_changed
            $table->json('cambios')->nullable();                  // {campo: [valor_viejo, valor_nuevo]}
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('ip', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['modelo', 'modelo_id'], 'idx_audit_modelo');
            $table->index('usuario_id',            'idx_audit_usuario');
            $table->index('created_at',            'idx_audit_fecha');
        });

        // ── 6. Normalización de IDs ───────────────────────────────────────────
        // Antes de caer FKs, eliminar logs huérfanos cuyo usuario_id
        // no exista en usuarios (datos de prueba sin integridad previa).
        DB::statement('UPDATE logs SET usuario_id = NULL WHERE usuario_id IS NOT NULL AND usuario_id NOT IN (SELECT id FROM usuarios)');

        // Primero caer todas las FKs del sistema, luego alterar tipos,
        // luego recrear FKs con nombres estandarizados.
        $this->dropAllForeignKeys();
        $this->normalizePrimaryKeys();
        $this->normalizeForeignKeyColumns();
        $this->recreateForeignKeys();

        // ── 7. UNIQUE simple en factura.numero ────────────────────────────────
        Schema::table('factura', function (Blueprint $table) {
            $table->unique('numero', 'uq_factura_numero');
        });

        // ── 8. UNIQUE en vehiculo.serial_carroceria ───────────────────────────
        // En MySQL, múltiples valores NULL no violan un UNIQUE (NULL ≠ NULL).
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->unique('serial_carroceria', 'uq_vehiculo_serial');
        });
    }

    // ── down ──────────────────────────────────────────────────────────────────

    public function down(): void
    {
        // Nuevas UNIQUEs
        Schema::table('vehiculo', fn (Blueprint $t) => $t->dropUnique('uq_vehiculo_serial'));
        Schema::table('factura',  fn (Blueprint $t) => $t->dropUnique('uq_factura_numero'));

        // Índice de status
        Schema::table('solicitud', fn (Blueprint $t) => $t->dropIndex('idx_solicitud_status'));

        // Auditoría y soft deletes
        foreach (['solicitud', 'poliza', 'factura', 'producto'] as $t) {
            Schema::table($t, function (Blueprint $table) {
                $table->dropColumn(['created_by', 'updated_by']);
            });
        }
        foreach (['solicitud', 'poliza', 'factura', 'cliente', 'producto', 'vehiculo'] as $t) {
            Schema::table($t, fn (Blueprint $table) => $table->dropSoftDeletes());
        }

        // audit_log
        Schema::dropIfExists('audit_log');

        // email en usuarios
        Schema::table('usuarios', fn (Blueprint $t) => $t->dropColumn('email'));

        // Nota: la normalización INT → BIGINT no se revierte aquí.
        // BIGINT es un superconjunto de INT y no causa pérdida de datos.
    }

    // ── Helpers privados ──────────────────────────────────────────────────────

    /**
     * Elimina todas las FK constraints del esquema actual.
     * Se obtienen dinámicamente desde information_schema para no depender de nombres hardcodeados.
     */
    private function dropAllForeignKeys(): void
    {
        $fks = DB::select("
            SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME
            FROM information_schema.TABLE_CONSTRAINTS tc
            WHERE tc.TABLE_SCHEMA = DATABASE()
              AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
        ");

        foreach ($fks as $fk) {
            DB::statement("ALTER TABLE `{$fk->TABLE_NAME}` DROP FOREIGN KEY `{$fk->CONSTRAINT_NAME}`");
        }
    }

    /**
     * Cambia los PKs de las tablas principales de INT UNSIGNED a BIGINT UNSIGNED.
     * logs y tarifario ya son BIGINT, se omiten.
     */
    private function normalizePrimaryKeys(): void
    {
        $tables = [
            'persona', 'usuarios', 'cliente', 'vehiculo', 'modelo_vehiculo',
            'solicitud', 'poliza', 'factura', 'conductor', 'tomador',
            'producto', 'beneficios', 'beneficiarios', 'ip_bloqueada',
            'cliente_documentos', 'venta',
        ];

        foreach ($tables as $t) {
            DB::statement("ALTER TABLE `{$t}` MODIFY `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT");
        }

        // nro_sede pasaba como INT (con signo) — normalizamos a UNSIGNED
        DB::statement('ALTER TABLE `usuarios` MODIFY `nro_sede` INT UNSIGNED NOT NULL');
    }

    /**
     * Cambia todas las columnas FK que referenciaban INT UNSIGNED a BIGINT UNSIGNED.
     */
    private function normalizeForeignKeyColumns(): void
    {
        $alterations = [
            // tabla                  columna               tipo
            ['cliente',            'persona_id',          'BIGINT UNSIGNED NOT NULL'],
            ['conductor',          'persona_id',          'BIGINT UNSIGNED NOT NULL'],
            ['conductor',          'vehiculo_id',         'BIGINT UNSIGNED NOT NULL'],
            ['tomador',            'persona_id',          'BIGINT UNSIGNED NOT NULL'],
            ['tomador',            'vehiculo_id',         'BIGINT UNSIGNED NOT NULL'],
            ['vehiculo',           'cliente_id',          'BIGINT UNSIGNED NOT NULL'],
            ['vehiculo',           'modelo_vehiculo_id',  'BIGINT UNSIGNED NULL'],
            ['solicitud',          'cliente_id',          'BIGINT UNSIGNED NOT NULL'],
            ['solicitud',          'producto_id',         'BIGINT UNSIGNED NULL'],
            ['solicitud',          'tarifario_id',        'BIGINT UNSIGNED NULL'],
            ['solicitud',          'vendedor_id',         'BIGINT UNSIGNED NULL'],
            ['poliza',             'solicitud_id',        'BIGINT UNSIGNED NOT NULL'],
            ['poliza',             'producto_id',         'BIGINT UNSIGNED NULL'],
            ['poliza',             'vendedor_id',         'BIGINT UNSIGNED NULL'],
            ['factura',            'poliza_id',           'BIGINT UNSIGNED NOT NULL'],
            ['factura',            'usuario_id',          'BIGINT UNSIGNED NOT NULL'],
            ['beneficiarios',      'poliza_id',           'BIGINT UNSIGNED NOT NULL'],
            ['beneficios',         'producto_id',         'BIGINT UNSIGNED NOT NULL'],
            ['ip_bloqueada',       'usuario_id',          'BIGINT UNSIGNED NULL'],
            ['logs',               'usuario_id',          'BIGINT UNSIGNED NULL'],
            ['cliente_documentos', 'cliente_id',          'BIGINT UNSIGNED NOT NULL'],
            ['venta',              'producto_id',         'BIGINT UNSIGNED NOT NULL'],
            ['venta',              'usuario_id',          'BIGINT UNSIGNED NOT NULL'],
            ['tarifario',          'producto_id',         'BIGINT UNSIGNED NOT NULL'],
            ['audit_log',          'usuario_id',          'BIGINT UNSIGNED NULL'],
        ];

        foreach ($alterations as [$table, $col, $def]) {
            DB::statement("ALTER TABLE `{$table}` MODIFY `{$col}` {$def}");
        }
    }

    /**
     * Recrea todas las FK constraints con nombres estandarizados (fk_tabla_columna).
     * Incluye las nuevas: logs.usuario_id y audit_log.usuario_id.
     */
    private function recreateForeignKeys(): void
    {
        // [tabla, constraint, columna, tabla_ref, col_ref, ON DELETE, ON UPDATE]
        $fks = [
            ['cliente',            'fk_cliente_persona',       'persona_id',         'persona',         'id', 'CASCADE',  'CASCADE'],
            ['conductor',          'fk_conductor_persona',     'persona_id',         'persona',         'id', 'CASCADE',  'CASCADE'],
            ['conductor',          'fk_conductor_vehiculo',    'vehiculo_id',        'vehiculo',        'id', 'CASCADE',  'CASCADE'],
            ['tomador',            'fk_tomador_persona',       'persona_id',         'persona',         'id', 'CASCADE',  'CASCADE'],
            ['tomador',            'fk_tomador_vehiculo',      'vehiculo_id',        'vehiculo',        'id', 'CASCADE',  'CASCADE'],
            ['vehiculo',           'fk_vehiculo_cliente',      'cliente_id',         'cliente',         'id', 'RESTRICT', 'CASCADE'],
            ['vehiculo',           'fk_vehiculo_modelo',       'modelo_vehiculo_id', 'modelo_vehiculo', 'id', 'SET NULL', 'CASCADE'],
            ['solicitud',          'fk_solicitud_cliente',     'cliente_id',         'cliente',         'id', 'RESTRICT', 'CASCADE'],
            ['solicitud',          'fk_solicitud_producto',    'producto_id',        'producto',        'id', 'SET NULL', 'CASCADE'],
            ['solicitud',          'fk_solicitud_tarifario',   'tarifario_id',       'tarifario',       'id', 'SET NULL', 'CASCADE'],
            ['solicitud',          'fk_solicitud_vendedor',    'vendedor_id',        'usuarios',        'id', 'SET NULL', 'CASCADE'],
            ['poliza',             'fk_poliza_solicitud',      'solicitud_id',       'solicitud',       'id', 'RESTRICT', 'CASCADE'],
            ['poliza',             'fk_poliza_producto',       'producto_id',        'producto',        'id', 'RESTRICT', 'CASCADE'],
            ['poliza',             'fk_poliza_vendedor',       'vendedor_id',        'usuarios',        'id', 'RESTRICT', 'CASCADE'],
            ['factura',            'fk_factura_poliza',        'poliza_id',          'poliza',          'id', 'RESTRICT', 'CASCADE'],
            ['factura',            'fk_factura_usuario',       'usuario_id',         'usuarios',        'id', 'RESTRICT', 'CASCADE'],
            ['beneficiarios',      'fk_beneficiarios_poliza',  'poliza_id',          'poliza',          'id', 'CASCADE',  'CASCADE'],
            ['beneficios',         'fk_beneficios_producto',   'producto_id',        'producto',        'id', 'CASCADE',  'CASCADE'],
            ['ip_bloqueada',       'fk_ip_bloqueada_usuario',  'usuario_id',         'usuarios',        'id', 'SET NULL', 'CASCADE'],
            ['logs',               'fk_logs_usuario',          'usuario_id',         'usuarios',        'id', 'SET NULL', 'CASCADE'],
            ['cliente_documentos', 'fk_cli_docs_cliente',      'cliente_id',         'cliente',         'id', 'CASCADE',  'CASCADE'],
            ['venta',              'fk_venta_producto',        'producto_id',        'producto',        'id', 'RESTRICT', 'CASCADE'],
            ['venta',              'fk_venta_usuario',         'usuario_id',         'usuarios',        'id', 'RESTRICT', 'CASCADE'],
            ['tarifario',          'fk_tarifario_producto',    'producto_id',        'producto',        'id', 'CASCADE',  'CASCADE'],
            ['audit_log',          'fk_audit_log_usuario',     'usuario_id',         'usuarios',        'id', 'SET NULL', 'CASCADE'],
        ];

        foreach ($fks as [$table, $name, $col, $refTable, $refCol, $onDelete, $onUpdate]) {
            DB::statement(
                "ALTER TABLE `{$table}` ADD CONSTRAINT `{$name}` FOREIGN KEY (`{$col}`)
                 REFERENCES `{$refTable}` (`{$refCol}`)
                 ON DELETE {$onDelete} ON UPDATE {$onUpdate}"
            );
        }
    }
};
