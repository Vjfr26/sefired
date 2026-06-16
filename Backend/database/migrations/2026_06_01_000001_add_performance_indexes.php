<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // poliza — columnas de filtrado frecuente
        Schema::table('poliza', function (Blueprint $table) {
            if (!$this->hasIndex('poliza', 'idx_poliza_solicitud'))
                $table->index('solicitud_id', 'idx_poliza_solicitud');
            if (!$this->hasIndex('poliza', 'idx_poliza_producto'))
                $table->index('producto_id', 'idx_poliza_producto');
            if (!$this->hasIndex('poliza', 'idx_poliza_vendedor'))
                $table->index('vendedor_id', 'idx_poliza_vendedor');
        });

        // solicitud — status y persona son los filtros más comunes
        Schema::table('solicitud', function (Blueprint $table) {
            if (!$this->hasIndex('solicitud', 'idx_solicitud_status'))
                $table->index('status', 'idx_solicitud_status');
            if (!$this->hasIndex('solicitud', 'idx_solicitud_persona'))
                $table->index('persona_id', 'idx_solicitud_persona');
            if (!$this->hasIndex('solicitud', 'idx_solicitud_bien'))
                $table->index('bien_asegurado_id', 'idx_solicitud_bien');
            if (!$this->hasIndex('solicitud', 'idx_solicitud_producto'))
                $table->index('producto_id', 'idx_solicitud_producto');
        });

        // bien_asegurado — búsquedas por titular y tipo
        Schema::table('bien_asegurado', function (Blueprint $table) {
            if (!$this->hasIndex('bien_asegurado', 'idx_bien_persona'))
                $table->index('persona_id', 'idx_bien_persona');
            if (!$this->hasIndex('bien_asegurado', 'idx_bien_tipo'))
                $table->index('tipo', 'idx_bien_tipo');
        });

        // factura — búsquedas por póliza
        Schema::table('factura', function (Blueprint $table) {
            if (!$this->hasIndex('factura', 'idx_factura_poliza'))
                $table->index('poliza_id', 'idx_factura_poliza');
            if (!$this->hasIndex('factura', 'idx_factura_fecha'))
                $table->index('fecha_factura', 'idx_factura_fecha');
        });

        // persona — búsqueda por cédula y correo
        Schema::table('persona', function (Blueprint $table) {
            if (!$this->hasIndex('persona', 'idx_persona_activo'))
                $table->index('activo', 'idx_persona_activo');
        });

        // indicador_economico — consultas frecuentes por tipo y fecha
        Schema::table('indicador_economico', function (Blueprint $table) {
            if (!$this->hasIndex('indicador_economico', 'idx_indicador_tipo_fecha'))
                $table->index(['tipo', 'fecha'], 'idx_indicador_tipo_fecha');
        });
    }

    public function down(): void
    {
        Schema::table('poliza', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_poliza_solicitud');
            $table->dropIndexIfExists('idx_poliza_producto');
            $table->dropIndexIfExists('idx_poliza_vendedor');
        });
        Schema::table('solicitud', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_solicitud_status');
            $table->dropIndexIfExists('idx_solicitud_persona');
            $table->dropIndexIfExists('idx_solicitud_bien');
            $table->dropIndexIfExists('idx_solicitud_producto');
        });
        Schema::table('bien_asegurado', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_bien_persona');
            $table->dropIndexIfExists('idx_bien_tipo');
        });
        Schema::table('factura', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_factura_poliza');
            $table->dropIndexIfExists('idx_factura_fecha');
        });
        Schema::table('persona', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_persona_activo');
        });
        Schema::table('indicador_economico', function (Blueprint $table) {
            $table->dropIndexIfExists('idx_indicador_tipo_fecha');
        });
    }

    private function hasIndex(string $table, string $index): bool
    {
        return collect(\DB::select("SHOW INDEX FROM `{$table}`"))
            ->pluck('Key_name')
            ->contains($index);
    }
};
