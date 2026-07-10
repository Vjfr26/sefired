<?php

namespace App\Support;

/**
 * Código numérico de póliza: oficina(1) + estado(2) + producto(2) +
 * indicador nuevo/renovación(1) + secuencial de la póliza(6) = 12 dígitos.
 * Ejemplo: oficina 1, estado 10, producto 05, renovación, póliza #16
 *       -> "110205000016"
 *
 * El número de recibo es ese mismo código sin el prefijo oficina+estado
 * (producto + indicador + secuencial), para que no repita en qué
 * oficina/estado se emitió — solo qué se vendió y el número de la póliza.
 */
class CodigoPoliza
{
    public const INDICADOR_NUEVO = 1;
    public const INDICADOR_RENOVACION = 2;

    /**
     * Sede -> dígito de oficina. Desde 2026-07-10 la fuente de verdad es la
     * tabla `oficina` (las nuevas sedes se crean desde la app); este mapa
     * queda como respaldo para nombres históricos ('CARACAS') y para cuando
     * la tabla aún no existe (tests/migraciones a medias).
     */
    private const OFICINAS = [
        'CARACAS PRINCIPAL' => 1,
        'CARACAS'           => 1,
        'MARACAIBO'         => 2,
        'VALENCIA'          => 3,
    ];

    /**
     * Las 24 entidades federales de Venezuela, en orden alfabético —
     * asignación propia para este sistema (no corresponde a ningún
     * código oficial externo, ver conversación del 2026-06-23).
     */
    private const ESTADOS = [
        'AMAZONAS' => 1, 'ANZOATEGUI' => 2, 'APURE' => 3, 'ARAGUA' => 4,
        'BARINAS' => 5, 'BOLIVAR' => 6, 'CARABOBO' => 7, 'COJEDES' => 8,
        'DELTA AMACURO' => 9, 'DISTRITO CAPITAL' => 10, 'FALCON' => 11,
        'GUARICO' => 12, 'LA GUAIRA' => 13, 'VARGAS' => 13, 'LARA' => 14,
        'MERIDA' => 15, 'MIRANDA' => 16, 'MONAGAS' => 17, 'NUEVA ESPARTA' => 18,
        'PORTUGUESA' => 19, 'SUCRE' => 20, 'TACHIRA' => 21, 'TRUJILLO' => 22,
        'YARACUY' => 23, 'ZULIA' => 24,
    ];

    /** Quita acentos y normaliza a mayúsculas para que el catálogo no dependa de cómo se escribió el texto libre. */
    public static function normalizar(?string $texto): string
    {
        $t = mb_strtoupper(trim((string) $texto));
        return strtr($t, [
            'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ñ' => 'N',
        ]);
    }

    /** 0 = oficina no reconocida (no debería pasar con datos completos, pero no debe romper la emisión). */
    public static function oficinaCodigo(?string $sede): int
    {
        // Catálogo en BD primero (oficinas creadas desde la app); cache
        // estático por proceso, recargado si aparece una sede que no estaba
        // — en procesos largos (queue worker) el catálogo puede crecer
        // después de la primera consulta.
        $clave = self::normalizar($sede);

        static $catalogo = null;
        if ($catalogo === null || (!isset($catalogo[$clave]) && !isset(self::OFICINAS[$clave]))) {
            try {
                $catalogo = \App\Models\Oficina::query()
                    ->pluck('codigo', 'nombre')
                    ->mapWithKeys(fn ($codigo, $nombre) => [self::normalizar($nombre) => (int) $codigo])
                    ->all();
            } catch (\Throwable) {
                $catalogo = []; // tabla aún no migrada — cae al mapa fijo
            }
        }

        return $catalogo[$clave] ?? self::OFICINAS[$clave] ?? 0;
    }

    /** 0 = estado no reconocido o tomador sin estado registrado. */
    public static function estadoCodigo(?string $estado): int
    {
        return self::ESTADOS[self::normalizar($estado)] ?? 0;
    }

    /**
     * @param string $sede        Poliza::sede_poliza
     * @param string|null $estado Persona::estado del tomador
     * @param int $productoId     Producto::id — ya es secuencial, se usa tal cual (sin catálogo aparte)
     * @param int $indicador      self::INDICADOR_NUEVO o self::INDICADOR_RENOVACION
     * @param int $secuencial     Poliza::id
     */
    public static function generar(string $sede, ?string $estado, int $productoId, int $indicador, int $secuencial): string
    {
        return
            (string) self::oficinaCodigo($sede) .
            str_pad((string) self::estadoCodigo($estado), 2, '0', STR_PAD_LEFT) .
            str_pad((string) $productoId, 2, '0', STR_PAD_LEFT) .
            (string) $indicador .
            str_pad((string) $secuencial, 6, '0', STR_PAD_LEFT);
    }

    /** Número de recibo = código de póliza sin el prefijo oficina(1)+estado(2). */
    public static function codigoRecibo(string $codigoPoliza): string
    {
        return substr($codigoPoliza, 3);
    }
}
