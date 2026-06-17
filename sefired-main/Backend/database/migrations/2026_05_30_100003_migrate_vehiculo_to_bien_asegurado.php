<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Migra los datos existentes de vehiculo → bien_asegurado.
 *
 * Pasos:
 *  1. Inserta cada vehículo como bien_asegurado tipo='vehiculo' (join con modelo_vehiculo)
 *  2. Migra conductor → bien_persona_rol rol='conductor'
 *  3. Migra tomador   → bien_persona_rol rol='tomador'
 *  4. Agrega bien_asegurado_id + fuente a solicitud
 *  5. Enlaza solicitud.bien_asegurado_id usando la coincidencia de placa
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Vehiculos → bien_asegurado ─────────────────────────────────────
        DB::statement("
            INSERT INTO bien_asegurado
                (persona_id, tipo, atributos, valor_declarado, created_by, created_at, updated_at)
            SELECT
                v.persona_id,
                'vehiculo',
                JSON_OBJECT(
                    'placa',                v.placa,
                    'marca',                COALESCE(mv.marca,  ''),
                    'modelo',               COALESCE(mv.modelo, ''),
                    'anio',                 v.anio,
                    'color',                COALESCE(v.color,   ''),
                    'uso',                  COALESCE(v.uso,     ''),
                    'clase',                COALESCE(v.clase,   ''),
                    'tipo_carroceria',      COALESCE(v.tipo,    ''),
                    'puestos',              v.puestos,
                    'peso',                 v.peso,
                    'serial_carroceria',    COALESCE(v.serial_carroceria, ''),
                    'serial_motor',         COALESCE(v.serial_motor,      ''),
                    'aparcamiento',         COALESCE(v.aparcamiento,      ''),
                    'fecha_adquisicion',    DATE_FORMAT(v.fecha_adquisicion, '%Y-%m-%d'),
                    'certificado_transito', COALESCE(v.certificado_transito, ''),
                    'certificado_origen',   COALESCE(v.certificado_origen,   ''),
                    'titulo',               COALESCE(v.titulo, '')
                ),
                NULL,
                NULL,
                NOW(),
                NOW()
            FROM vehiculo v
            LEFT JOIN modelo_vehiculo mv ON mv.id = v.modelo_vehiculo_id
            WHERE v.deleted_at IS NULL
        ");

        // ── 2. Conductores → bien_persona_rol ─────────────────────────────────
        DB::statement("
            INSERT INTO bien_persona_rol (bien_asegurado_id, persona_id, rol, created_at)
            SELECT b.id, c.persona_id, 'conductor', NOW()
            FROM conductor c
            INNER JOIN vehiculo v       ON v.id        = c.vehiculo_id
            INNER JOIN bien_asegurado b ON b.placa_idx = v.placa
            WHERE v.deleted_at IS NULL
        ");

        // ── 3. Tomadores → bien_persona_rol ───────────────────────────────────
        DB::statement("
            INSERT INTO bien_persona_rol (bien_asegurado_id, persona_id, rol, datos, created_at)
            SELECT
                b.id,
                t.persona_id,
                'tomador',
                CASE WHEN t.copia = 1 THEN JSON_OBJECT('copia', true) ELSE NULL END,
                NOW()
            FROM tomador t
            INNER JOIN vehiculo v       ON v.id        = t.vehiculo_id
            INNER JOIN bien_asegurado b ON b.placa_idx = v.placa
            WHERE v.deleted_at IS NULL
        ");

        // ── 4. bien_asegurado_id + fuente en solicitud ─────────────────────────
        Schema::table('solicitud', function (Blueprint $table) {
            $table->unsignedBigInteger('bien_asegurado_id')
                  ->nullable()
                  ->after('persona_id');

            $table->string('fuente', 20)
                  ->default('interno')
                  ->after('bien_asegurado_id')
                  ->comment('portal | interno');

            $table->index('bien_asegurado_id', 'idx_solicitud_bien');

            $table->foreign('bien_asegurado_id', 'fk_solicitud_bien')
                  ->references('id')->on('bien_asegurado')
                  ->onUpdate('cascade')->onDelete('set null');
        });

        // ── 5. Enlazar solicitud.bien_asegurado_id por placa ──────────────────
        DB::statement("
            UPDATE solicitud s
            INNER JOIN bien_asegurado b ON b.placa_idx = s.placa
            SET s.bien_asegurado_id = b.id
            WHERE s.placa IS NOT NULL AND s.placa != ''
        ");

        // ── 6. Marcar solicitudes del portal (coberturas con fuente=portal) ───
        DB::statement("
            UPDATE solicitud
            SET fuente = 'portal'
            WHERE coberturas IS NOT NULL
              AND JSON_UNQUOTE(JSON_EXTRACT(coberturas, '$[0].fuente')) = 'portal_clientes'
        ");
    }

    public function down(): void
    {
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropForeign('fk_solicitud_bien');
            $table->dropIndex('idx_solicitud_bien');
            $table->dropColumn(['bien_asegurado_id', 'fuente']);
        });

        DB::table('bien_persona_rol')->whereIn('rol', ['conductor', 'tomador'])->delete();
        DB::table('bien_asegurado')->where('tipo', 'vehiculo')->delete();
    }
};
