<?php

namespace App\Support;

use App\Models\BienAsegurado;
use App\Models\Persona;
use App\Models\Poliza;

/**
 * Lleva una corrección hecha en Vehículos o en Clientes al snapshot de las
 * pólizas VIGENTES de ese bien o cliente.
 *
 * Cada póliza guarda al emitirse una foto de los datos (snapshot_datos) y de
 * ahí leen el PDF y el reporte de carga masiva. Sin esta propagación, arreglar
 * una placa mal tipeada en el vehículo no llegaba a ninguno de los dos: había
 * que repetir la corrección póliza por póliza desde "Editar Póliza".
 *
 * Solo se tocan las ACTIVA. Una póliza vencida o anulada es un documento
 * cerrado y debe seguir diciendo lo que decía el día que se emitió; además, un
 * cambio puede no ser una corrección (un vehículo que cambió de placa de
 * verdad) y entonces reescribir el historial sería falsearlo.
 *
 * El estado se compara en mayúsculas a propósito: la cartera migrada lo tiene
 * como "Activa" y el resto del sistema lo escribe "ACTIVA".
 */
final class CorreccionDatos
{
    /**
     * Atributos del vehículo que viajan al snapshot: los mismos que ofrece
     * "Editar Póliza", para que ambas pantallas corrijan lo mismo. Fuera
     * quedan `tipo` y `clase` a propósito — con ellos se ubica la tarifa de
     * las pólizas migradas y cambiarlos movería las sumas del documento.
     */
    private const ATRIBUTOS_BIEN = [
        'marca', 'modelo', 'anio', 'placa', 'color',
        'version', 'puestos', 'uso', 'serial_carroceria', 'serial_motor',
    ];

    /** Campos del cliente que los documentos muestran como datos del tomador. */
    private const CAMPOS_PERSONA = ['nombre', 'cedula', 'direccion', 'celular', 'telefono'];

    /**
     * @param  array<string, mixed>  $atributosAntes  atributos del bien antes de guardar
     * @return int  pólizas actualizadas
     */
    public static function deBien(BienAsegurado $bien, array $atributosAntes): int
    {
        $ahora   = is_array($bien->atributos) ? $bien->atributos : [];
        $cambios = [];
        foreach (self::ATRIBUTOS_BIEN as $clave) {
            $nuevo = $ahora[$clave] ?? null;
            if ($nuevo === null || trim((string) $nuevo) === '') continue;
            if ((string) ($atributosAntes[$clave] ?? '') === (string) $nuevo) continue;
            $cambios[$clave] = $nuevo;
        }
        if (!$cambios) return 0;

        return self::aplicar(
            Poliza::whereRaw('UPPER(status) = ?', ['ACTIVA'])
                ->whereHas('solicitud', fn ($q) => $q->where('bien_asegurado_id', $bien->id))
                ->get(),
            function (array $snap) use ($cambios) {
                foreach ($cambios as $clave => $valor) {
                    $snap['bien']['atributos'][$clave] = $valor;
                }
                return $snap;
            }
        );
    }

    /**
     * @param  array<string, mixed>  $antes  atributos de la persona antes de guardar
     * @return int  pólizas actualizadas
     */
    public static function dePersona(Persona $persona, array $antes): int
    {
        $cambios = [];
        foreach (self::CAMPOS_PERSONA as $campo) {
            $nuevo = $persona->getAttribute($campo);
            if ($nuevo === null || trim((string) $nuevo) === '') continue;
            if ((string) ($antes[$campo] ?? '') === (string) $nuevo) continue;
            $cambios[$campo] = $nuevo;
        }
        if (!$cambios) return 0;

        $cedulaAntes = (string) ($antes['cedula'] ?? '');

        return self::aplicar(
            Poliza::whereRaw('UPPER(status) = ?', ['ACTIVA'])
                ->whereHas('solicitud', fn ($q) => $q->where('persona_id', $persona->id))
                ->get(),
            function (array $snap) use ($cambios, $persona, $cedulaAntes) {
                $mapa = [
                    'nombre'    => 'nombre',
                    'cedula'    => 'ci',
                    'direccion' => 'direccion',
                    'celular'   => 'telefono',
                    'telefono'  => 'telefono',
                ];
                // El celular manda sobre el teléfono fijo: es el que muestran
                // los documentos cuando existe.
                if (isset($cambios['celular'])) unset($cambios['telefono']);

                // El asegurado suele ser el mismo tomador: si comparten
                // cédula, la corrección va también a su bloque, para que el
                // documento no muestre dos grafías de la misma persona.
                $ciAseg  = Documento::normalizarCedula((string) ($snap['asegurado']['ci'] ?? ''));
                $mismo   = $ciAseg !== '' && in_array($ciAseg, [
                    Documento::normalizarCedula($cedulaAntes),
                    Documento::normalizarCedula((string) $persona->cedula),
                ], true);

                foreach ($cambios as $campo => $valor) {
                    $clave = $mapa[$campo];
                    $snap['tomador'][$clave] = $valor;
                    if ($mismo && in_array($clave, ['nombre', 'ci', 'direccion', 'telefono'], true)) {
                        $snap['asegurado'][$clave] = $valor;
                    }
                }
                return $snap;
            }
        );
    }

    /**
     * @param  \Illuminate\Support\Collection<int, Poliza>  $polizas
     */
    private static function aplicar($polizas, callable $corregir): int
    {
        $n = 0;
        foreach ($polizas as $poliza) {
            $snap  = is_array($poliza->snapshot_datos) ? $poliza->snapshot_datos : [];
            $nuevo = $corregir($snap);
            if ($nuevo === $snap) continue;
            $poliza->snapshot_datos = $nuevo;
            $poliza->save();
            $n++;
        }

        return $n;
    }
}
