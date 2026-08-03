<?php

use App\Models\ReporteExternoProgramacion;
use Illuminate\Database\Migrations\Migration;

/**
 * El reporte externo pasó de 35 a 48 columnas (se agregó el bloque del
 * asegurado). Las programaciones guardadas con "todas" seleccionadas
 * tienen las 35 claves viejas, que ahora son un SUBCONJUNTO: seguirían
 * generando el formato personalizado, sin los datos del asegurado.
 *
 * Se normalizan a NULL (= todas las columnas, formato oficial). Solo se
 * tocan las que tienen exactamente el set viejo completo: si el usuario
 * eligió columnas a mano, su selección se respeta. Repetible.
 */
return new class extends Migration
{
    /** Las 35 columnas que existían antes del bloque del asegurado. */
    private const COLUMNAS_VIEJAS = [
        'nacionalidad_tomador', 'cedula_tomador', 'primer_nombre', 'segundo_nombre',
        'primer_apellido', 'segundo_apellido', 'fecha_nacimiento', 'sexo', 'direccion',
        'ciudad', 'estado', 'telefono', 'correo', 'marca', 'modelo', 'anio', 'placa',
        'color', 'traccion', 'serial_carroceria', 'serial_motor', 'tipo_vehiculo', 'uso',
        'puestos', 'numero_poliza', 'inicio_vigencia', 'fin_vigencia', 'suma_cosas',
        'suma_personas', 'prima_anual', 'moneda', 'nac_referidor', 'rif_referidor',
        'codigo_intermediario', 'recibo',
    ];

    public function up(): void
    {
        $viejas = self::COLUMNAS_VIEJAS;
        sort($viejas);

        ReporteExternoProgramacion::whereNotNull('columnas')->get()->each(function ($prog) use ($viejas) {
            $actuales = is_array($prog->columnas) ? array_values(array_unique($prog->columnas)) : [];
            sort($actuales);
            if ($actuales === $viejas) {
                $prog->update(['columnas' => null]);
            }
        });
    }

    public function down(): void
    {
        // No se revierte: no hay forma de distinguir las programaciones que
        // ya estaban en NULL de las normalizadas por esta migración.
    }
};
