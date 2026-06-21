<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabla puente póliza↔bienes asegurados.
 *
 * Hasta ahora una póliza cubría exactamente un bien (a través de
 * solicitud.bien_asegurado_id). Esta tabla permite asociar bienes
 * ADICIONALES a una póliza ya emitida — ej. una póliza que admite hasta
 * 5 vehículos pero al solicitarla solo se registró 1.
 *
 * El bien original (el de la solicitud que dio origen a la póliza) también
 * se refleja aquí con certificado=NULL, que significa "cubierto bajo el
 * nro_contrato de la propia póliza, sin sub-numeración" — así las pólizas
 * de un solo bien (el caso de hoy, 100% de las existentes) no cambian su
 * identificador visible. Los bienes agregados después reciben un
 * certificado propio (ej. "POL-2026-00042-02") para diferenciarlos.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('poliza_bienes', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('poliza_id');
            $table->unsignedBigInteger('bien_asegurado_id');
            $table->string('certificado', 30)->nullable()->comment('NULL = cubierto bajo el nro_contrato de la póliza');
            $table->decimal('cobertura_dolares', 18, 2)->nullable();
            $table->decimal('cobertura_bs', 18, 2)->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->timestamps();

            $table->unique(['poliza_id', 'bien_asegurado_id'], 'uq_polizabien_poliza_bien');
            $table->index('bien_asegurado_id', 'idx_polizabien_bien');

            $table->foreign('poliza_id', 'fk_polizabien_poliza')
                  ->references('id')->on('poliza')
                  ->onUpdate('cascade')->onDelete('cascade');

            $table->foreign('bien_asegurado_id', 'fk_polizabien_bien')
                  ->references('id')->on('bien_asegurado')
                  ->onUpdate('cascade')->onDelete('restrict');

            $table->foreign('created_by', 'fk_polizabien_created_by')
                  ->references('id')->on('usuarios')
                  ->onUpdate('cascade')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('poliza_bienes');
    }
};
