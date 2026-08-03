<?php

namespace App\Support;

use App\Models\Poliza;
use App\Models\Tarifario;

/**
 * Cascada de datos del cuadro "Coberturas / Sumas Aseguradas" de una póliza.
 *
 * La comparten el PDF de la póliza y el reporte externo. Antes cada uno leía
 * por su cuenta —el PDF esta cascada y el Excel `cobertura_dolares` a secas—
 * y las sumas del reporte no cuadraban con las del documento.
 *
 * Los montos que devuelve van SIN formato y en la moneda nativa de la póliza:
 * quien los muestre decide la conversión. `de_tarifa` distingue los que salen
 * de una tarifa cargada hoy (se convierten con la tasa del día) de los
 * congelados en la póliza (tasa de emisión).
 */
final class CuadroCoberturas
{
    /**
     * Memo para recorridos masivos (el reporte externo exporta 120k pólizas y
     * la cascada gasta 3 consultas por cada una). Se activa a mano y se apaga
     * al terminar: dejarlo prendido guardaría tarifas obsoletas entre
     * peticiones en workers de larga vida.
     */
    private static bool $memoActivo = false;

    /** @var array<string, ?Tarifario> */
    private static array $memoTarifa = [];

    /** @var array<int, ?array<string, mixed>> snapshot del predecesor por poliza_id */
    private static array $memoPredecesor = [];

    /** Enciende o apaga el memo, vaciándolo siempre. */
    public static function memoriza(bool $activo): void
    {
        self::$memoActivo     = $activo;
        self::$memoTarifa     = [];
        self::$memoPredecesor = [];
    }

    /**
     * Resuelve de golpe qué pólizas tienen predecesora, para no gastar una
     * consulta por póliza en un recorrido masivo. Solo las solicitudes con
     * más de una póliza pueden tenerla, así que se preguntan en bloque.
     *
     * @param  iterable<Poliza>  $polizas
     */
    public static function precargarPredecesores(iterable $polizas): void
    {
        self::$memoActivo = true;
        $porSolicitud = [];

        foreach ($polizas as $p) {
            // Con bien propio en el snapshot no se hereda nada (mismo criterio
            // que snapshot()); sin solicitud no hay dónde buscar.
            if (!$p->solicitud_id || !empty(($p->snapshot_datos ?? [])['bien']['atributos'])) {
                self::$memoPredecesor[$p->id] = null;
                continue;
            }
            $porSolicitud[$p->solicitud_id][] = $p;
        }
        if (!$porSolicitud) return;

        $conVarias = [];
        foreach (array_chunk(array_keys($porSolicitud), 2000) as $chunk) {
            foreach (Poliza::whereIn('solicitud_id', $chunk)->groupBy('solicitud_id')
                        ->havingRaw('COUNT(*) > 1')->pluck('solicitud_id') as $sid) {
                $conVarias[(int) $sid] = true;
            }
        }

        // Sin hermanas no hay predecesora: se dan por resueltas sin consultar.
        foreach ($porSolicitud as $sid => $ps) {
            if (!isset($conVarias[(int) $sid])) {
                foreach ($ps as $p) self::$memoPredecesor[$p->id] = null;
                unset($porSolicitud[$sid]);
            }
        }
        if (!$porSolicitud) return;

        $hermanas = Poliza::whereIn('solicitud_id', array_keys($porSolicitud))
            ->whereNotNull('snapshot_datos')
            ->orderBy('solicitud_id')->orderBy('id')
            ->get(['id', 'solicitud_id', 'snapshot_datos'])
            ->groupBy('solicitud_id');

        foreach ($porSolicitud as $sid => $ps) {
            $candidatas = $hermanas[$sid] ?? collect();
            foreach ($ps as $p) {
                // La más reciente ANTERIOR a esta póliza, igual que snapshot().
                $prev = $candidatas->where('id', '<', $p->id)->sortByDesc('id')->first();
                self::$memoPredecesor[$p->id] = is_array($prev?->snapshot_datos) ? $prev->snapshot_datos : null;
            }
        }
    }

    /** @return ?Tarifario */
    private static function tarifaMemo(string $clave, callable $buscar): ?Tarifario
    {
        if (!self::$memoActivo) return $buscar();
        if (!array_key_exists($clave, self::$memoTarifa)) self::$memoTarifa[$clave] = $buscar();
        return self::$memoTarifa[$clave];
    }

    /**
     * Snapshot con lo que haga falta heredar de la póliza predecesora.
     *
     * RENOVACIONES VIEJAS: antes el snapshot no se heredaba al renovar, así
     * que esas pólizas quedaron sin datos de vehículo/tomador/coberturas en el
     * suyo. Las secciones que falten se completan con el snapshot de la póliza
     * anterior (misma solicitud, id anterior) — la emisión y sus renovaciones
     * deben mostrar los mismos datos. Los campos propios de cada emisión
     * (fechas, tasas, pagos, totales) salen de las columnas de la póliza, no
     * del snapshot, así que no se contaminan.
     *
     * @return array<string, mixed>
     */
    public static function snapshot(Poliza $poliza): array
    {
        $snap = $poliza->snapshot_datos ?? [];

        if (empty($snap['bien']['atributos']) && $poliza->solicitud_id) {
            $prevSnap = array_key_exists($poliza->id, self::$memoPredecesor)
                ? self::$memoPredecesor[$poliza->id]
                : Poliza::where('solicitud_id', $poliza->solicitud_id)
                    ->where('id', '<', $poliza->id)
                    ->whereNotNull('snapshot_datos')
                    ->orderByDesc('id')
                    ->value('snapshot_datos');
            if (is_array($prevSnap)) {
                $heredables = ['bien', 'tomador', 'asegurado', 'producto', 'coberturas', 'tarifario', 'rcv', 'apov', 'tasa_bcv'];
                // Un 'bien' heredado sin atributos no aporta nada — no debe
                // tapar los respaldos en vivo de quien lo consuma.
                if (empty($prevSnap['bien']['atributos'])) unset($prevSnap['bien']);
                unset($snap['bien']);
                $snap += array_intersect_key($prevSnap, array_flip($heredables));
            }
        }

        return $snap;
    }

    /**
     * Tarifa que aplica al cuadro. Es la CONGELADA en el snapshot de emisión:
     * la póliza es un documento histórico y se reimprime con las sumas del día
     * en que se emitió. Solo las que no tienen copia congelada (migradas)
     * caen a la versión VIGENTE: se sigue el linaje parent_id desde la
     * referencia guardada; sin referencia, la única vigente del producto o el
     * match por nombre de nivel "tipo / clase" del bien.
     *
     * @param  array<string, mixed>  $snap   snapshot efectivo de la póliza
     * @param  array<string, mixed>  $cobs   $snap['coberturas']
     * @param  array<string, mixed>  $attrs  atributos del bien
     * @return array{datos: array<string, mixed>, viva: ?Tarifario}
     */
    public static function tarifa(Poliza $poliza, array $snap, array $cobs, array $attrs): array
    {
        $viva = null;
        $tarifaSnap = $cobs['tarifa']['datos'] ?? ($snap['tarifario']['datos'] ?? null);
        if (!is_array($tarifaSnap) || count($tarifaSnap) === 0) $tarifaSnap = null;

        $idRef = $poliza->tarifario_version_id
            ?? ($cobs['tarifa']['id'] ?? null)
            ?? ($snap['tarifario']['id'] ?? null);

        if (!$tarifaSnap && $idRef) {
            $viva = self::tarifaMemo("linaje:{$idRef}", function () use ($idRef) {
                $tv   = Tarifario::find($idRef);
                $hops = 0;
                while ($tv && $tv->estado !== 'vigente' && $hops++ < 20) {
                    $tv = Tarifario::where('parent_id', $tv->id)->orderByDesc('version')->first();
                }
                return ($tv && $tv->estado === 'vigente' && is_array($tv->datos)) ? $tv : null;
            });
        }

        // Sin NINGUNA referencia de tarifa (migradas): si el producto tiene UNA
        // SOLA tarifa vigente no hay ambigüedad. Con varias (p.ej. RCV por
        // clase de vehículo) no se adivina.
        if (!$tarifaSnap && !$viva && $poliza->producto_id) {
            $viva = self::tarifaMemo("unica:{$poliza->producto_id}", function () use ($poliza) {
                $vigentes = Tarifario::where('producto_id', $poliza->producto_id)
                    ->where('estado', 'vigente')->where('activo', true)->limit(2)->get();
                return ($vigentes->count() === 1 && is_array($vigentes->first()->datos)) ? $vigentes->first() : null;
            });
        }

        // Migradas con VARIAS tarifas vigentes (RCV por clase): el bien trae
        // tipo ("Hasta 800 Kg de Peso") y clase ("Particular y Rusticos"), y
        // las tarifas por nivel se llaman exactamente "tipo / clase".
        if (!$tarifaSnap && !$viva && $poliza->producto_id && !empty($attrs['tipo']) && !empty($attrs['clase'])) {
            $nivelRef = mb_strtolower(trim($attrs['tipo']) . ' / ' . trim($attrs['clase']));
            $viva = self::tarifaMemo("nombre:{$poliza->producto_id}:{$nivelRef}", function () use ($poliza, $nivelRef) {
                $porNombre = Tarifario::where('producto_id', $poliza->producto_id)
                    ->where('estado', 'vigente')->where('activo', true)
                    ->whereRaw('LOWER(nombre) = ?', [$nivelRef])
                    ->limit(2)->get();
                return ($porNombre->count() === 1 && is_array($porNombre->first()->datos)) ? $porNombre->first() : null;
            });
        }

        return ['datos' => $tarifaSnap ?? $viva?->datos ?? [], 'viva' => $viva];
    }

    /**
     * Renglones del cuadro, en el mismo orden y con la misma prioridad de
     * fuentes que imprime el PDF.
     *
     * @param  array<string, mixed>  $snap         snapshot efectivo
     * @param  array<string, mixed>  $cobs         $snap['coberturas']
     * @param  array<string, mixed>  $tarifaDatos  datos de la tarifa resuelta
     * @param  ?string               $tipoBien     tipo del bien asegurado
     * @return list<array{clave: string, label: string, monto: float, de_tarifa: bool}>
     */
    public static function renglones(Poliza $poliza, array $snap, array $cobs, array $tarifaDatos, string $tipoCal, ?string $tipoBien): array
    {
        $items = [];
        $item = fn (string $clave, string $label, $monto, bool $deTarifa) => [
            'clave' => $clave, 'label' => $label, 'monto' => (float) $monto, 'de_tarifa' => $deTarifa,
        ];

        // Renglones definidos por el usuario en el producto (nombres) con el
        // monto de la tarifa (datos.coberturas_pdf = {slug: {label, suma}}).
        // Si existen, son LA fuente del cuadro. Se buscan primero en la tarifa
        // resuelta, luego en las copias de la cotización/snapshot y por último
        // en los renglones del producto.
        $cobsPdf = $tarifaDatos['coberturas_pdf']
            ?? ($cobs['tarifa']['datos']['coberturas_pdf'] ?? null)
            ?? ($snap['tarifario']['datos']['coberturas_pdf'] ?? null)
            ?? $poliza->producto?->coberturas_pdf
            ?? [];

        if (is_array($cobsPdf) && count($cobsPdf) > 0) {
            $renglones  = [];
            $algunMonto = false;
            foreach ($cobsPdf as $key => $val) {
                if (!is_array($val)) continue;

                if (isset($val['key']) && isset($val['label'])) {
                    // Renglón del PRODUCTO (solo define el nombre): su monto hay
                    // que buscarlo en los datos de la tarifa — por clave exacta,
                    // con el prefijo suma_ (key="persona" → suma_persona), o el
                    // que el propio renglón traiga. En por_nivel NO se mira la
                    // raíz: suma_persona/suma_cosa ahí son residuos del seeding
                    // legacy que el formulario de por_nivel no edita.
                    $k     = $val['key'];
                    $label = $val['label'];
                    $suma  = 0;
                    if ($tipoCal !== 'por_nivel' && isset($tarifaDatos[$k]) && is_array($tarifaDatos[$k]) && isset($tarifaDatos[$k]['suma'])) {
                        $suma = $tarifaDatos[$k]['suma'];
                    } elseif ($tipoCal !== 'por_nivel' && isset($tarifaDatos[$k]) && is_numeric($tarifaDatos[$k])) {
                        $suma = $tarifaDatos[$k];
                    } elseif ($tipoCal !== 'por_nivel' && isset($tarifaDatos['suma_'.$k]) && is_numeric($tarifaDatos['suma_'.$k])) {
                        $suma = $tarifaDatos['suma_'.$k];
                    } elseif (isset($val['suma']) && is_numeric($val['suma'])) {
                        $suma = $val['suma'];
                    }
                } else {
                    // Renglón de la TARIFA ({slug: {label, suma}}): el monto es
                    // el asignado en "editar coberturas" del tarifario.
                    $k     = (string) $key;
                    $label = $val['label'] ?? ucwords(str_replace('_', ' ', (string) $key));
                    $suma  = $val['suma'] ?? 0;
                }
                if ((float) $suma > 0) $algunMonto = true;
                $renglones[] = $item((string) $k, $label, $suma, true);
            }
            // Renglones sin NINGÚN monto (nombres del producto sin una tarifa
            // que los cotice, o tarifa con todo en 0): no pintan un cuadro en
            // 0,00 tapando los datos reales — se cae a los derivados de abajo.
            if ($algunMonto) $items = $renglones;
        }

        // Sin renglones con monto: el cuadro se deriva de los datos de la
        // tarifa según el tipo de cálculo del producto.
        if (!$items) {
            if ($tipoCal === 'por_valor') {
                // "por_valor" no es exclusivo de vehículos (ej. Póliza Muebles
                // también lo usa).
                $label = $tipoBien === 'vehiculo' ? 'Responsabilidad Civil Obligatoria' : 'Suma Asegurada';
                $items[] = $item('cobertura_dolares', $label, $poliza->cobertura_dolares, false);
            } elseif ($tipoCal === 'por_plan') {
                // Las coberturas de un plan son un mapa de claves nombradas.
                foreach ($tarifaDatos as $key => $val) {
                    if ($key === 'coberturas_pdf') continue; // renglones, no coberturas del plan
                    if (is_array($val) && isset($val['suma'])) {
                        $items[] = $item((string) $key, $val['label'] ?? ucwords(str_replace('_', ' ', (string) $key)), $val['suma'], true);
                    }
                }
            } elseif ($tipoCal === 'fijo') {
                // Las sumas se extraen dinámicamente con las claves del tarifario.
                foreach ($tarifaDatos as $key => $val) {
                    if (is_numeric($val) && (str_starts_with($key, 'suma_') || in_array($key, ['exceso_limite', 'muerte_invalidez', 'defensa_penal', 'gastos_medicos', 'asistencia_vial', 'gastos_funerarios']))) {
                        $items[] = $item((string) $key, ucwords(str_replace('_', ' ', str_replace('suma_', 'suma ', $key))), $val, true);
                    }
                }
            } elseif ($tipoCal === 'por_nivel') {
                if (!empty($tarifaDatos['suma'])) {
                    $items[] = $item('suma', $tarifaDatos['nivel'] ?? 'Suma Asegurada', $tarifaDatos['suma'], true);
                }
            }
        }

        // Pólizas MIGRADAS: la cobertura real quedó en el snapshot bajo
        // 'rcv'/'apov' (no en la tarifa). Se muestran esas sumas reales ANTES
        // de caer al genérico cobertura_dolares — una migrada suele tener
        // ambos, y los renglones por cobertura son el dato bueno.
        if (!$items) {
            $rcv = $snap['rcv'] ?? [];
            if (!empty($rcv['suma_persona'])) $items[] = $item('suma_persona', 'Daños a Personas', $rcv['suma_persona'], false);
            if (!empty($rcv['suma_cosa']))    $items[] = $item('suma_cosa',    'Daños a Cosas',    $rcv['suma_cosa'], false);
            $apov = $snap['apov'] ?? [];
            if (!empty($apov['suma_muerte_accidental'])) $items[] = $item('suma_muerte_accidental', 'Muerte Accidental', $apov['suma_muerte_accidental'], false);
            if (!empty($apov['suma_invalidez']))         $items[] = $item('suma_invalidez',         'Invalidez',         $apov['suma_invalidez'], false);
            if (!empty($apov['suma_medicos']))           $items[] = $item('suma_medicos',           'Gastos Médicos',    $apov['suma_medicos'], false);
            if (!empty($apov['suma_funerarios']))        $items[] = $item('suma_funerarios',        'Gastos Funerarios', $apov['suma_funerarios'], false);
        }

        // Sin tarifario enlazado ni sumas migradas: la suma asegurada guardada
        // en la propia póliza, sin depender del snapshot.
        if (!$items && (float) $poliza->cobertura_dolares > 0) {
            $items[] = $item('cobertura_dolares', 'Suma Asegurada', $poliza->cobertura_dolares, false);
        }
        // Último respaldo: la suma asegurada en Bs de la propia póliza.
        if (!$items && (float) $poliza->cobertura_bs > 0) {
            $items[] = $item('cobertura_bs', 'Suma Asegurada', $poliza->cobertura_bs, false);
        }

        return $items;
    }

    /**
     * Las dos sumas que pide la carga masiva, sacadas de los mismos renglones
     * que imprime el PDF. Sin un renglón por daño (productos que no separan
     * cosas de personas) ambas columnas llevan la suma asegurada única, que es
     * también el único número que muestra el documento.
     *
     * @param  list<array{clave: string, label: string, monto: float, de_tarifa: bool}>  $renglones
     * @return array{cosas: float, personas: float, de_tarifa: bool}
     */
    public static function sumasCosasPersonas(array $renglones): array
    {
        $cosas = $personas = null;
        $deTarifa = false;

        foreach ($renglones as $r) {
            $texto = mb_strtolower($r['clave'] . ' ' . $r['label']);
            if ($cosas === null && str_contains($texto, 'cosa')) {
                $cosas = $r['monto'];
                $deTarifa = $deTarifa || $r['de_tarifa'];
            } elseif ($personas === null && str_contains($texto, 'persona')) {
                $personas = $r['monto'];
                $deTarifa = $deTarifa || $r['de_tarifa'];
            }
        }

        // Ningún renglón separa daños: se usa el mayor de los renglones como
        // suma asegurada única (en RCV el cuadro trae un solo nivel; en los
        // planes, la cobertura principal).
        if ($cosas === null && $personas === null && $renglones) {
            $principal = $renglones[0];
            foreach ($renglones as $r) {
                if ($r['monto'] > $principal['monto']) $principal = $r;
            }
            $cosas = $personas = $principal['monto'];
            $deTarifa = $principal['de_tarifa'];
        }

        return [
            'cosas'     => (float) ($cosas ?? $personas ?? 0),
            'personas'  => (float) ($personas ?? $cosas ?? 0),
            'de_tarifa' => $deTarifa,
        ];
    }
}
