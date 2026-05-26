<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 2 — Underwriting y snapshot de póliza.
 *
 *  1. Tabla underwriting_evaluaciones:
 *     Módulo de evaluación de riesgo para cada solicitud/cotización.
 *     Soporta aprobación manual, scoring, observaciones, inspecciones y rechazos técnicos.
 *     Cuando el resultado cambia a 'aprobado' o 'rechazado', el sistema
 *     actualiza automáticamente el status de la solicitud.
 *
 *  2. poliza.snapshot_datos (JSON):
 *     Snapshot inmutable de los datos del asegurado, vehículo y coberturas
 *     tal como existían en el momento de la emisión.
 *     Permite reconstruir fielmente la póliza sin depender de datos actuales.
 *
 *  3. poliza.tarifario_version_id:
 *     FK a la fila exacta del tarifario usada al cotizar.
 *     Garantiza que las pólizas antiguas no se vean afectadas por
 *     revisiones tarifarias posteriores.
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Tabla underwriting_evaluaciones ───────────────────────────────
        Schema::create('underwriting_evaluaciones', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('solicitud_id');
            $table->unsignedBigInteger('evaluador_id')->nullable();  // usuario que evalúa

            $table->enum('tipo', ['manual', 'automatica'])->default('manual');
            $table->enum('resultado', ['pendiente', 'aprobado', 'rechazado', 'observado'])->default('pendiente');

            $table->decimal('score', 5, 2)->nullable();   // 0–100: riesgo calculado
            $table->text('observaciones')->nullable();     // notas del evaluador
            $table->text('motivo_rechazo')->nullable();    // motivo formal de rechazo
            $table->boolean('requiere_inspeccion')->default(false);
            $table->json('reglas_aplicadas')->nullable();  // reglas automáticas que se ejecutaron
            $table->dateTime('fecha_evaluacion')->nullable();

            $table->timestamps();

            // Índices
            $table->index('solicitud_id',  'idx_uw_solicitud');
            $table->index('evaluador_id',  'idx_uw_evaluador');
            $table->index('resultado',     'idx_uw_resultado');
            $table->index('created_at',    'idx_uw_fecha');

            // FKs
            $table->foreign('solicitud_id', 'fk_uw_solicitud')
                ->references('id')->on('solicitud')
                ->onUpdate('CASCADE')
                ->onDelete('CASCADE');

            $table->foreign('evaluador_id', 'fk_uw_evaluador')
                ->references('id')->on('usuarios')
                ->onUpdate('CASCADE')
                ->onDelete('SET NULL');
        });

        // ── 2. poliza: snapshot_datos + tarifario_version_id ─────────────────
        Schema::table('poliza', function (Blueprint $table) {
            // Snapshot inmutable de los datos al momento de emisión
            $table->json('snapshot_datos')->nullable()->after('asegurado_ci');

            // Versión exacta del tarifario usada al cotizar
            $table->unsignedBigInteger('tarifario_version_id')->nullable()->after('snapshot_datos');

            $table->index('tarifario_version_id', 'idx_poliza_tarifario_ver');
            $table->foreign('tarifario_version_id', 'fk_poliza_tarifario_ver')
                ->references('id')->on('tarifario')
                ->onUpdate('CASCADE')
                ->onDelete('SET NULL');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropForeign('fk_poliza_tarifario_ver');
            $table->dropIndex('idx_poliza_tarifario_ver');
            $table->dropColumn(['snapshot_datos', 'tarifario_version_id']);
        });

        Schema::dropIfExists('underwriting_evaluaciones');
    }
};
