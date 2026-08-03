<?php

namespace App\Support;

use App\Models\BienAsegurado;
use App\Models\Poliza;
use Illuminate\Support\Facades\DB;

/**
 * Lectura de los datos del vehículo/bien de una póliza para los documentos.
 *
 * Existe por una herencia de la migración: al importar la cartera, cada
 * renovación creó una FILA NUEVA de bien para el mismo vehículo, con la placa
 * ensuciada (".AB123CD", "AB123CD..") para esquivar el índice único de placa,
 * y SIN serial de carrocería — porque ese índice también es único y no admitía
 * repetirlo. Resultado: 5.961 grupos de bienes duplicados donde el original
 * tiene el serial y los demás no.
 *
 * Por eso el serial no se puede arreglar copiándolo en la BD (el índice único
 * lo rechaza): hay que resolverlo al leer, tomándolo del bien gemelo.
 */
final class BienPoliza
{
    /** @var array<int, ?string> serial del gemelo por bien_asegurado_id */
    private static array $memoSerial = [];

    /**
     * Datos del bien para los documentos (tipo, atributos y observaciones).
     *
     * La corrección guardada en el snapshot manda CAMPO POR CAMPO y el bien
     * vivo rellena el resto. Antes era todo o nada: corregir solo la placa
     * desde "Editar Póliza" dejaba el snapshot en `{placa: X}` y con eso el
     * PDF imprimía el vehículo sin marca, modelo ni seriales, y el reporte
     * externo ni se enteraba de la corrección porque leía solo el bien vivo.
     *
     * @param  array<string, mixed>  $snap  snapshot efectivo de la póliza
     * @param  mixed  $bienScope  PolizaBien al que se acota el documento
     * @return array{tipo: ?string, atributos: array<string, mixed>, observaciones: ?string}
     */
    public static function datos(Poliza $poliza, array $snap, $bienScope = null): array
    {
        // Documento acotado a un bien adicional: sus datos salen del propio
        // bien, porque el snapshot solo guarda el original de la solicitud.
        if ($bienScope && $bienScope->certificado !== null && $bienScope->bien) {
            return self::desdeBien($bienScope->bien);
        }

        $base = self::desdeBien($poliza->solicitud?->bien);

        // Último respaldo: el bien enlazado en poliza_bienes (renovaciones
        // cuyo origen no tiene bien en la solicitud). Solo si la relación ya
        // viene cargada — en un recorrido masivo, tocarla sería una consulta
        // por póliza.
        if (!$base['atributos'] && $poliza->relationLoaded('bienes')) {
            $principal = $poliza->bienes->firstWhere('certificado', null) ?? $poliza->bienes->first();
            if ($principal?->bien) $base = self::desdeBien($principal->bien);
        }

        $delSnap = $snap['bien']['atributos'] ?? [];
        if (!is_array($delSnap)) $delSnap = [];
        // Los campos vacíos del snapshot no tapan al bien vivo.
        $correcciones = array_filter($delSnap, fn ($v) => $v !== null && trim((string) $v) !== '');

        return [
            'tipo'          => $snap['bien']['tipo'] ?? $base['tipo'],
            'atributos'     => array_merge($base['atributos'], $correcciones),
            'observaciones' => self::primeroNoVacio($snap['bien']['observaciones'] ?? null, $base['observaciones']),
        ];
    }

    /** @return array{tipo: ?string, atributos: array<string, mixed>, observaciones: ?string} */
    private static function desdeBien(?BienAsegurado $bien): array
    {
        return [
            'tipo'          => $bien?->tipo,
            'atributos'     => is_array($bien?->atributos) ? $bien->atributos : [],
            'observaciones' => $bien?->observaciones,
        ];
    }

    private static function primeroNoVacio(?string ...$valores): ?string
    {
        foreach ($valores as $v) {
            if ($v !== null && trim($v) !== '') return $v;
        }

        return null;
    }

    /** Placa comparable: sin los puntos, espacios ni guiones de la migración. */
    public static function placaNormalizada(?string $placa): string
    {
        return mb_strtoupper(str_replace(['.', ' ', '-'], '', trim((string) $placa)));
    }

    /**
     * Primer valor no vacío entre varias claves. Los atributos vienen de
     * distintas épocas del sistema y conviven en snake_case y camelCase.
     *
     * @param  array<string, mixed>  $attrs
     */
    public static function valor(array $attrs, string ...$claves): string
    {
        foreach ($claves as $clave) {
            $v = $attrs[$clave] ?? null;
            if ($v !== null && trim((string) $v) !== '') return trim((string) $v);
        }

        return '';
    }

    /**
     * Serial de carrocería del bien; si su fila no lo tiene (duplicado de
     * renovación), el del bien GEMELO: mismo dueño y misma placa normalizada.
     * Con varios gemelos de serial distinto no se adivina — queda vacío.
     *
     * @param  array<string, mixed>  $attrs
     */
    public static function serialCarroceria(array $attrs, ?BienAsegurado $bien): string
    {
        $propio = self::valor($attrs, 'serial_carroceria', 'serialCarroceria');
        if ($propio !== '' || !$bien) return $propio;

        if (!array_key_exists($bien->id, self::$memoSerial)) {
            self::$memoSerial[$bien->id] = self::buscarGemelos([$bien->id])[$bien->id] ?? null;
        }

        return self::$memoSerial[$bien->id] ?? '';
    }

    /**
     * Resuelve de una sola consulta los seriales de los gemelos para todo un
     * lote de pólizas — sin esto el reporte externo haría una consulta por
     * fila sobre 120k pólizas.
     *
     * @param  iterable<Poliza>  $polizas
     */
    public static function precargarSeriales(iterable $polizas): void
    {
        $ids = [];
        foreach ($polizas as $p) {
            $bien = $p->solicitud?->bien;
            if (!$bien || !$bien->persona_id) continue;
            if (self::valor($bien->atributos ?? [], 'serial_carroceria', 'serialCarroceria') !== '') continue;
            $ids[$bien->id] = true;
        }
        if (!$ids) return;

        foreach (array_chunk(array_keys($ids), 2000) as $chunk) {
            $encontrados = self::buscarGemelos($chunk);
            foreach ($chunk as $id) {
                self::$memoSerial[$id] = $encontrados[$id] ?? null;
            }
        }
    }

    /** Vacía el memo (se llama al terminar un recorrido masivo). */
    public static function olvidar(): void
    {
        self::$memoSerial = [];
    }

    /**
     * @param  list<int>  $bienIds
     * @return array<int, string> bien_id => serial del gemelo
     */
    private static function buscarGemelos(array $bienIds): array
    {
        if (!$bienIds) return [];

        // La placa normalizada se calcula en SQL sobre placa_idx (columna
        // generada desde atributos->placa). Solo cuentan los gemelos del
        // MISMO dueño: hay placas parecidas de personas distintas que son
        // vehículos distintos, y copiarles el serial sería declarar el
        // vehículo de otro.
        $norm = fn (string $t) => "UPPER(REPLACE(REPLACE(REPLACE({$t}.placa_idx, '.', ''), ' ', ''), '-', ''))";

        $filas = DB::table('bien_asegurado as b')
            ->join('bien_asegurado as g', function ($j) use ($norm) {
                $j->on('g.persona_id', '=', 'b.persona_id')
                  ->on('g.id', '!=', 'b.id')
                  ->whereRaw("{$norm('g')} = {$norm('b')}")
                  ->whereNull('g.deleted_at')
                  ->whereNotNull('g.serial_carroceria_idx')
                  ->where('g.serial_carroceria_idx', '!=', '');
            })
            ->whereIn('b.id', $bienIds)
            ->whereNull('b.deleted_at')
            ->groupBy('b.id')
            ->havingRaw('COUNT(DISTINCT g.serial_carroceria_idx) = 1')
            ->select('b.id', DB::raw('MIN(g.serial_carroceria_idx) as serial'))
            ->get();

        $out = [];
        foreach ($filas as $f) $out[(int) $f->id] = (string) $f->serial;

        return $out;
    }
}
