<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Elimina la tabla `cliente` como capa de indirección innecesaria.
 *
 * La persona ahora es el punto de entrada directo para solicitudes,
 * vehículos y documentos. Los campos activo/deleted_at se mueven a persona.
 *
 * Antes: persona → cliente → solicitud / vehiculo / cliente_documentos
 * Después: persona → solicitud / vehiculo / cliente_documentos
 */
return new class extends Migration
{
    public function up(): void
    {
        // 1. Añadir activo + deleted_at a persona
        Schema::table('persona', function (Blueprint $table) {
            $table->boolean('activo')->default(true)->after('archivo');
            $table->softDeletes();
        });

        // 2. Migrar activo de cliente → persona
        DB::statement('
            UPDATE persona p
            INNER JOIN cliente c ON c.persona_id = p.id
            SET p.activo = c.activo
        ');

        // 3. Añadir persona_id nullable a solicitud, vehiculo, cliente_documentos
        Schema::table('solicitud', function (Blueprint $table) {
            $table->unsignedBigInteger('persona_id')->nullable()->after('cliente_id');
        });
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->unsignedBigInteger('persona_id')->nullable()->after('cliente_id');
        });
        Schema::table('cliente_documentos', function (Blueprint $table) {
            $table->unsignedBigInteger('persona_id')->nullable()->after('cliente_id');
        });

        // 4. Migrar cliente_id → persona_id en las tres tablas
        DB::statement('
            UPDATE solicitud s
            INNER JOIN cliente c ON c.id = s.cliente_id
            SET s.persona_id = c.persona_id
            WHERE s.cliente_id IS NOT NULL
        ');
        DB::statement('
            UPDATE vehiculo v
            INNER JOIN cliente c ON c.id = v.cliente_id
            SET v.persona_id = c.persona_id
        ');
        DB::statement('
            UPDATE cliente_documentos d
            INNER JOIN cliente c ON c.id = d.cliente_id
            SET d.persona_id = c.persona_id
        ');

        // 5. Añadir FK persona_id → persona(id)
        Schema::table('solicitud', function (Blueprint $table) {
            $table->foreign('persona_id', 'fk_solicitud_persona')
                  ->references('id')->on('persona')
                  ->onUpdate('cascade')->onDelete('restrict');
        });
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->foreign('persona_id', 'fk_vehiculo_persona')
                  ->references('id')->on('persona')
                  ->onUpdate('cascade')->onDelete('restrict');
        });
        Schema::table('cliente_documentos', function (Blueprint $table) {
            $table->foreign('persona_id', 'fk_cli_docs_persona')
                  ->references('id')->on('persona')
                  ->onUpdate('cascade')->onDelete('cascade');
        });

        // 6. Quitar FK antiguas que apuntan a cliente
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropForeign('fk_solicitud_cliente');
            $table->dropColumn('cliente_id');
        });
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->dropForeign('fk_vehiculo_cliente');
            $table->dropColumn('cliente_id');
        });
        Schema::table('cliente_documentos', function (Blueprint $table) {
            $table->dropForeign('fk_cli_docs_cliente');
            $table->dropColumn('cliente_id');
        });

        // 7. Eliminar tabla cliente
        Schema::dropIfExists('cliente');
    }

    public function down(): void
    {
        // Recrear cliente
        Schema::create('cliente', function (Blueprint $table) {
            $table->unsignedBigInteger('id')->autoIncrement()->primary();
            $table->unsignedBigInteger('persona_id')->unique();
            $table->boolean('activo')->default(true);
            $table->softDeletes();
            $table->foreign('persona_id')->references('id')->on('persona');
        });

        // Restaurar cliente_id en las tablas
        Schema::table('solicitud', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable()->after('persona_id');
        });
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable()->after('persona_id');
        });
        Schema::table('cliente_documentos', function (Blueprint $table) {
            $table->unsignedBigInteger('cliente_id')->nullable()->after('persona_id');
        });

        // Quitar FK nuevas
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropForeign('fk_solicitud_persona');
            $table->dropColumn('persona_id');
        });
        Schema::table('vehiculo', function (Blueprint $table) {
            $table->dropForeign('fk_vehiculo_persona');
            $table->dropColumn('persona_id');
        });
        Schema::table('cliente_documentos', function (Blueprint $table) {
            $table->dropForeign('fk_cli_docs_persona');
            $table->dropColumn('persona_id');
        });

        // Quitar activo + deleted_at de persona
        Schema::table('persona', function (Blueprint $table) {
            $table->dropColumn(['activo', 'deleted_at']);
        });
    }
};
