<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Póliza {{ $poliza->nro_contrato }}</title>
</head>

@php
    // Si el documento está acotado a un bien (vista de Bienes), ese bien es el
    // principal; si no, se usa el bien original de la solicitud.
    $bienScope = $bienScope ?? null;

    // El bien original de la póliza siempre tiene certificado=NULL (los
    // certificados numerados son solo para bienes ADICIONALES agregados
    // después) — "0" es la representación estándar de ese bien base.
    $bienPrincipal        = $bienScope ?? ($poliza->bienes->firstWhere('certificado', null) ?? $poliza->bienes->first());
    $certificadoPrincipal = $bienPrincipal?->certificado ?? '0';

    // Lista de bienes para los carnets/certificados:
    //  - acotado (vista de Bienes): solo el bien del scope
    //  - completo (vista de Clientes): TODOS los bienes de la póliza
    //  - póliza sin bienes físicos (vida/accidentes): un único carnet
    $carnetList = $bienScope
        ? collect([$bienScope])
        : ($poliza->bienes->isNotEmpty() ? $poliza->bienes : collect([null]));

    $snap        = $poliza->snapshot_datos ?? [];

    // RENOVACIONES VIEJAS: antes el snapshot no se heredaba al renovar, así
    // que esas pólizas quedaron sin datos de vehículo/tomador/coberturas en
    // su propio snapshot. Las secciones que falten se completan con el
    // snapshot de la póliza predecesora (misma solicitud, id anterior) — la
    // emisión y sus renovaciones deben mostrar los mismos datos. Los campos
    // propios de esta emisión (fechas, tasas, pagos, totales) salen de las
    // columnas de la póliza, no del snapshot, así que no se contaminan.
    if (empty($snap['bien']['atributos']) && $poliza->solicitud_id) {
        $prevSnap = \App\Models\Poliza::where('solicitud_id', $poliza->solicitud_id)
            ->where('id', '<', $poliza->id)
            ->whereNotNull('snapshot_datos')
            ->orderByDesc('id')
            ->value('snapshot_datos');
        if (is_array($prevSnap)) {
            $heredables = ['bien', 'tomador', 'asegurado', 'producto', 'coberturas', 'tarifario', 'rcv', 'apov', 'tasa_bcv'];
            // Un 'bien' heredado sin atributos no aporta nada — no debe tapar
            // los respaldos en vivo de más abajo.
            if (empty($prevSnap['bien']['atributos'])) unset($prevSnap['bien']);
            unset($snap['bien']);
            $snap += array_intersect_key($prevSnap, array_flip($heredables));
        }
    }

    $tomador     = $snap['tomador']    ?? [];
    $asegurado   = $snap['asegurado']  ?? [];
    // Pólizas anteriores al snapshot enriquecido no tienen 'bien'/'producto'
    // dentro de snapshot_datos — se cae a las relaciones en vivo para que no
    // se vean vacíos los datos del vehículo ni el tipo de cálculo.
    $prodSnap    = $snap['producto']   ?? ($poliza->producto ? [
        'nombre'       => $poliza->producto->nombre,
        'tipo'         => $poliza->producto->tipo,
        'tipo_calculo' => $poliza->producto->tipo_calculo,
        'cobertura'    => $poliza->producto->cobertura,
    ] : []);
    // Certificado = pólizas colectivas; las individuales muestran el número
    // de recibo en su lugar. `producto.lleva_certificado` solo dice si el
    // PRODUCTO admite certificados (RCV/APOV se venden individual o en
    // flota) — la póliza es colectiva de verdad cuando además tiene más de
    // un bien asociado (el bien original + adicionales con certificado).
    // Colectiva (muestra certificado) cuando hay más de un bien; o, si el
    // documento está acotado, cuando ese bien tiene certificado propio.
    $llevaCertificado = (bool) ($poliza->producto?->lleva_certificado ?? false)
        && ($bienScope ? $bienScope->certificado !== null : $poliza->bienes->count() > 1);
    // El bien del snapshot solo vale si trae ATRIBUTOS: en migradas el
    // vehículo se completó DESPUÉS en vivo (Editar Póliza) y el snapshot
    // quedó con un 'bien' cascarón (tipo/atributos vacíos) que no debe tapar
    // la data viva — mismo criterio que la landing del QR.
    $bien = $snap['bien'] ?? [];
    if (empty($bien['atributos']) && $poliza->solicitud?->bien) {
        $bien = [
            'tipo'          => $poliza->solicitud->bien->tipo,
            'atributos'     => $poliza->solicitud->bien->atributos ?? [],
            'observaciones' => $poliza->solicitud->bien->observaciones,
        ];
    }
    // Último respaldo del bien principal: el bien enlazado en poliza_bienes
    // (renovaciones cuyo origen no tiene ni snapshot ni bien en la solicitud).
    if (empty($bien['atributos']) && $bienPrincipal?->bien) {
        $bien = [
            'tipo'          => $bienPrincipal->bien->tipo,
            'atributos'     => $bienPrincipal->bien->atributos ?? [],
            'observaciones' => $bienPrincipal->bien->observaciones,
        ];
    }
    // Documento acotado a un bien adicional: sus datos vienen del propio bien
    // (el snapshot solo guarda el bien original de la solicitud).
    if ($bienScope && $bienScope->certificado !== null && $bienScope->bien) {
        $bien = [
            'tipo'          => $bienScope->bien->tipo,
            'atributos'     => $bienScope->bien->atributos ?? [],
            'observaciones' => $bienScope->bien->observaciones,
        ];
    }
    $attrs            = $bien['atributos'] ?? [];
    $bienObservaciones = $bien['observaciones'] ?? $poliza->solicitud?->bien?->observaciones ?? '—';
    // Antes el encabezado decía "Automóvil" siempre, sin importar el tipo de
    // bien real (inmueble, vida, mascota…) — se deriva del bien asegurado,
    // y si la póliza no asegura un bien físico (vida, accidentes…) del ramo.
    $ramoLabel = match ($bien['tipo'] ?? null) {
        'vehiculo'           => 'Automóvil',
        'inmueble'           => 'Inmueble',
        'bicicleta'          => 'Bicicleta',
        'mascota'            => 'Mascota',
        'embarcacion'        => 'Embarcación',
        'equipo_electronico' => 'Equipo Electrónico',
        'joya'               => 'Joyas',
        'vida'               => 'Vida',
        default              => match ($prodSnap['tipo'] ?? null) {
            'vida'       => 'Vida',
            'salud'      => 'Salud',
            'hogar'      => 'Hogar',
            'accidentes' => 'Accidentes Personales',
            'funeraria'  => 'Asistencia Funeraria',
            default      => $prodSnap['nombre'] ?? 'Póliza',
        },
    };
    // El documento no debe usar la palabra genérica "Certificado": debe
    // reflejar el tipo de póliza real (RCV, APOV, EC...) según el producto.
    $tipoPolizaLabel = match ($prodSnap['tipo'] ?? null) {
        'rcv'        => 'RCV',
        'apov'       => 'APOV',
        'alpd'       => 'ALPD',
        'ec'         => 'EC',
        'ep'         => 'EP',
        'vida'       => 'Vida',
        'salud'      => 'Salud',
        'hogar'      => 'Hogar',
        'accidentes' => 'Accidentes',
        'funeraria'  => 'Funeraria',
        default      => $prodSnap['nombre'] ?? 'Póliza',
    };

    $cobs        = $snap['coberturas'] ?? [];
    $tipoCal     = $prodSnap['tipo_calculo'] ?? $poliza->producto?->tipo_calculo ?? 'fijo';

    // El cuadro "Coberturas / Sumas Aseguradas" refleja la versión VIGENTE de
    // la tarifa de la póliza (las coberturas cargadas hoy — p.ej. montos RCV
    // LEY actualizados), no la copia congelada en el snapshot: al actualizar
    // el tarifario, las pólizas ya emitidas deben mostrar las sumas nuevas.
    // El snapshot sigue mandando en primas/totales/recibo; aquí solo se
    // refresca la presentación de las sumas. Si la tarifa fue re-versionada
    // (editar datos archiva y crea hija), se sigue el linaje parent_id hasta
    // la versión vigente actual; si el linaje ya no existe, se cae al snapshot.
    $tarifaViva  = null;
    $tarifaIdRef = $poliza->tarifario_version_id
        ?? ($cobs['tarifa']['id'] ?? null)
        ?? ($snap['tarifario']['id'] ?? null);
    if ($tarifaIdRef) {
        $tv   = \App\Models\Tarifario::find($tarifaIdRef);
        $hops = 0;
        while ($tv && $tv->estado !== 'vigente' && $hops++ < 20) {
            $tv = \App\Models\Tarifario::where('parent_id', $tv->id)->orderByDesc('version')->first();
        }
        if ($tv && $tv->estado === 'vigente' && is_array($tv->datos)) $tarifaViva = $tv;
    }
    // Póliza sin NINGUNA referencia de tarifa (migradas): si el producto tiene
    // UNA SOLA tarifa vigente no hay ambigüedad — se usa esa. Con varias (p.ej.
    // RCV por clase de vehículo) no se adivina: habría que enlazarle su tarifa.
    if (!$tarifaViva && $poliza->producto_id) {
        $vigentes = \App\Models\Tarifario::where('producto_id', $poliza->producto_id)
            ->where('estado', 'vigente')->where('activo', true)->limit(2)->get();
        if ($vigentes->count() === 1 && is_array($vigentes->first()->datos)) {
            $tarifaViva = $vigentes->first();
        }
    }
    // Migradas con VARIAS tarifas vigentes (RCV por clase): el bien asegurado
    // trae tipo ("Hasta 800 Kg de Peso") y clase ("Particular y Rusticos"), y
    // las tarifas por nivel se llaman exactamente "tipo / clase" — si hay UNA
    // vigente con ese nombre, es la de esta póliza. Sin match no se adivina.
    if (!$tarifaViva && $poliza->producto_id && !empty($attrs['tipo']) && !empty($attrs['clase'])) {
        $nivelRef  = mb_strtolower(trim($attrs['tipo']) . ' / ' . trim($attrs['clase']));
        $porNombre = \App\Models\Tarifario::where('producto_id', $poliza->producto_id)
            ->where('estado', 'vigente')->where('activo', true)
            ->whereRaw('LOWER(nombre) = ?', [$nivelRef])
            ->limit(2)->get();
        if ($porNombre->count() === 1 && is_array($porNombre->first()->datos)) {
            $tarifaViva = $porNombre->first();
        }
    }
    $tarifaDatos = $tarifaViva?->datos ?? ($cobs['tarifa']['datos'] ?? ($snap['tarifario']['datos'] ?? []));
    // La estructura de los datos de la tarifa viva la define el tipo de
    // cálculo ACTUAL del producto (pudo cambiar desde la emisión).
    if ($tarifaViva) $tipoCal = $poliza->producto?->tipo_calculo ?? $tipoCal;

    // Todos los montos del documento (prima, sumas aseguradas, IVA, total a
    // cobrar) van en UNA sola moneda — nunca mezclada con otra. Por defecto
    // es la moneda nativa de la póliza; al imprimir se puede elegir otra
    // (?moneda=USD|BS|EUR) y TODOS los montos se convierten con la tasa BCV
    // de emisión de la póliza (la que congeló sus montos) o, si la póliza no
    // la tiene registrada, la tasa del día.
    $monedaProducto = $poliza->monedaNativa();
    $monedaDoc      = \App\Support\Moneda::normalizar($monedaSalida ?? $monedaProducto);
    $convFactor     = 1.0;
    if ($monedaDoc !== $monedaProducto) {
        // tasa_emision quedó con default 1.0 en pólizas viejas = "sin tasa".
        $tasaU = (float) $poliza->tasa_emision;
        $tasaE = (float) $poliza->tasa_emision_eur;
        if ($tasaU <= 1) $tasaU = (float) (\App\Models\IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        if ($tasaE <= 1) $tasaE = (float) (\App\Models\IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $convFactor = \App\Support\Moneda::convertir(1.0, $monedaProducto, $monedaDoc, $tasaU, $tasaE);
        if ($convFactor <= 0) { $monedaDoc = $monedaProducto; $convFactor = 1.0; } // sin tasa: quedarse en la nativa
    }
    $fmtM = fn($v) => number_format(((float) $v) * $convFactor, 2);
    $monedaSimbolo = \App\Support\Moneda::simbolo($monedaDoc);

    // Los montos de la tarifa VIVA están cargados HOY en la moneda del
    // producto: al verlos en otra moneda se convierten con la TASA DEL DÍA —
    // la tasa de emisión congelada solo aplica a los montos congelados de la
    // póliza (prima, total, recibo). En la moneda base no hay conversión.
    $convFactorTarifa = $convFactor;
    if ($tarifaViva && $monedaDoc !== $monedaProducto) {
        $tasaDiaU = (float) (\App\Models\IndicadorEconomico::usd()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $tasaDiaE = (float) (\App\Models\IndicadorEconomico::eur()->orderByDesc('fecha')->orderByDesc('fecha_registro')->value('valor') ?? 0);
        $f = \App\Support\Moneda::convertir(1.0, $monedaProducto, $monedaDoc, $tasaDiaU, $tasaDiaE);
        if ($f > 0) $convFactorTarifa = $f; // sin tasa del día: se queda con la de la póliza
    }
    $fmtT = fn($v) => number_format(((float) $v) * $convFactorTarifa, 2);
    // Formateador del cuadro de coberturas: tasa del día si los montos salen
    // de la tarifa viva; tasa de la póliza si salen de copias congeladas.
    $fmtC = $tarifaViva ? $fmtT : $fmtM;

    // Todos los datos de personas del documento van en MAYÚSCULAS sin importar
    // cómo estén guardados en la BD (mb_ para que Á/É/Ñ también suban).
    $U = fn($v) => $v === null || $v === '' ? '—' : mb_strtoupper(trim((string) $v));

    $tomadorNombre = $U($tomador['nombre']   ?? ($poliza->asegurado_nombre ?? null));
    $tomadorCi     = $U($tomador['ci']       ?? ($poliza->asegurado_ci     ?? null));
    $asegNombre    = $U($asegurado['nombre'] ?? ($poliza->asegurado_nombre ?? $tomadorNombre));
    $asegCi        = $U($asegurado['ci']     ?? ($poliza->asegurado_ci     ?? $tomadorCi));
    $asegPartes    = \App\Support\NombreSplitter::partes($asegNombre);

    // Teléfono y dirección: del snapshot (pólizas futuras con esos campos) o
    // de la relación persona en vivo.
    $persona         = $poliza->solicitud?->persona;
    $tomadorTel      = $U($tomador['telefono']  ?? ($persona?->celular ?? ($persona?->telefono ?? null)));
    $tomadorDireccion = $U($tomador['direccion'] ?? ($persona?->direccion ?? null));
    // El asegurado no siempre tiene su propio registro de Persona (puede ser
    // un familiar indicado solo por nombre/CI al cotizar) — si no hay datos
    // propios, se asume la misma dirección/teléfono del tomador.
    $asegDireccion   = $U($asegurado['direccion'] ?? $tomadorDireccion);
    $asegTel         = $U($asegurado['telefono']  ?? $tomadorTel);

    // Vendedor / intermediario desde la relación cargada
    $vendedorNombre = mb_strtoupper($poliza->vendedor?->nombre ?? '—');
    $vendedorCodigo = $poliza->vendedor?->nro_sede ?? '—';
    // Canal de venta: "Vendedor Calle" vende como intermediario externo;
    // "Oficina"/"Admin" gestionan la venta directa desde la cooperativa.
    $canalVenta     = $poliza->vendedor?->cargo === 'Vendedor Calle' ? 'INTERMEDIARIO' : 'DIRECTO';

    $marca   = mb_strtoupper($attrs['marca']  ?? '—');
    $modelo  = mb_strtoupper($attrs['modelo'] ?? '—');
    $anio    = $attrs['anio']              ?? '—';
    $placa   = mb_strtoupper($attrs['placa']  ?? '—');
    $color   = mb_strtoupper($attrs['color']  ?? '—');
    $uso     = mb_strtoupper($attrs['uso']    ?? '—');
    $serCar  = mb_strtoupper($attrs['serial_carroceria'] ?? ($attrs['serialCarroceria'] ?? '—'));
    $serMot  = mb_strtoupper($attrs['serial_motor']      ?? ($attrs['serialMotor']      ?? '—'));
    $puestos = $attrs['puestos'] ?? '—';
    $clase   = mb_strtoupper($attrs['clase']  ?? ($attrs['tipo'] ?? '—'));
    $version = mb_strtoupper($attrs['version'] ?? 'A INDICAR');

    // Datos de presentación de un bien (principal o adicional) para las secciones
    // que se repiten por vehículo. El principal usa el snapshot ya calculado; los
    // adicionales, su propio BienAsegurado. No muta variables globales.
    $datosBien = function ($cb) use ($bien, $attrs, $poliza) {
        if ($cb && $cb->certificado !== null && $cb->bien) {
            $a = $cb->bien->atributos ?? [];
            $t = $cb->bien->tipo;
            $obs = $cb->bien->observaciones ?? '—';
        } else {
            $a = $attrs;
            $t = $bien['tipo'] ?? null;
            $obs = $bien['observaciones'] ?? '—';
        }
        return [
            'cert'    => ($cb?->certificado) ?: $poliza->nro_contrato,
            'tipo'    => $t,
            'attrs'   => $a,
            'obs'     => $obs ? mb_strtoupper(trim((string) $obs)) : '—',
            'marca'   => mb_strtoupper($a['marca']  ?? '—'),
            'modelo'  => mb_strtoupper($a['modelo'] ?? '—'),
            'anio'    => $a['anio']              ?? '—',
            'placa'   => mb_strtoupper($a['placa']  ?? '—'),
            'color'   => mb_strtoupper($a['color']  ?? '—'),
            'uso'     => mb_strtoupper($a['uso']    ?? '—'),
            'serCar'  => mb_strtoupper($a['serial_carroceria'] ?? ($a['serialCarroceria'] ?? '—')),
            'serMot'  => mb_strtoupper($a['serial_motor']      ?? ($a['serialMotor']      ?? '—')),
            'puestos' => $a['puestos'] ?? '—',
            'clase'   => mb_strtoupper($a['clase'] ?? ($a['tipo'] ?? '—')),
            'version' => mb_strtoupper($a['version'] ?? 'A INDICAR'),
        ];
    };

    $cobertura_items = [];
    // Renglones definidos por el usuario en el producto (nombres) con el
    // monto de la tarifa (datos.coberturas_pdf = {slug: {label, suma}}).
    // Si existen, son LA fuente del cuadro "Coberturas / Sumas Aseguradas" y
    // sustituyen tanto la cuadrícula fija de vehículo como los derivados.
    // Si la tarifa viva no los define, se buscan en las copias de la
    // cotización y del snapshot de emisión (pólizas emitidas con renglones
    // que la versión vigente actual perdió).
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
                // legacy que el formulario de por_nivel no edita (mostrarían
                // montos viejos); sus montos por cobertura viven únicamente
                // en coberturas_pdf de la tarifa.
                $k = $val['key'];
                $label = $val['label'];
                $suma = 0;
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
                // Renglón de la TARIFA ({slug: {label, suma}}): el monto es el
                // asignado en "editar coberturas" del tarifario — la fuente
                // buena del cuadro.
                $label = $val['label'] ?? ucwords(str_replace('_', ' ', (string) $key));
                $suma  = $val['suma'] ?? 0;
            }
            if ((float) $suma > 0) $algunMonto = true;
            $renglones[] = [$label, $suma];
        }
        // Renglones sin NINGÚN monto (nombres del producto sin una tarifa que
        // los cotice, o tarifa con todo en 0 porque nunca se le asignaron los
        // montos): no pintan un cuadro en 0,00 tapando los datos reales — se
        // cae a los derivados por tipo de cálculo / snapshot de abajo.
        if ($algunMonto) {
            foreach ($renglones as [$label, $suma]) $cobertura_items[] = [$label, $fmtC($suma)];
        }
    }
    // Sin renglones con monto: el cuadro se deriva de los datos de la tarifa
    // según el tipo de cálculo del producto.
    if (empty($cobertura_items)) {
        if ($tipoCal === 'por_valor') {
            // "por_valor" no es exclusivo de vehículos (ej. Póliza Muebles también
            // lo usa) — antes decía "Responsabilidad Civil Obligatoria" siempre,
            // aunque el bien fuera un inmueble o cualquier otro bien de valor.
            $labelPorValor = ($bien['tipo'] ?? null) === 'vehiculo' ? 'Responsabilidad Civil Obligatoria' : 'Suma Asegurada';
            $cobertura_items[] = [$labelPorValor, $fmtM($poliza->cobertura_dolares)];
        } elseif ($tipoCal === 'por_plan' && is_array($tarifaDatos)) {
            // Las coberturas de un plan son un mapa de claves nombradas (ver
            // TarifarioController) — antes solo se reconocían 4 claves fijas que
            // no coincidían con los datos reales (p.ej. "invalidez_total" vs
            // "invalidez"), así que la mayoría de las coberturas no aparecían.
            foreach ($tarifaDatos as $key => $val) {
                if ($key === 'coberturas_pdf') continue; // renglones, no coberturas del plan
                if (is_array($val) && isset($val['suma'])) {
                    $label = $val['label'] ?? ucwords(str_replace('_', ' ', (string) $key));
                    $cobertura_items[] = [$label, $fmtC($val['suma'])];
                }
            }
        } elseif ($tipoCal === 'fijo' && is_array($tarifaDatos)) {
            // Extraer las sumas dinámicamente usando las claves del tarifario
            foreach ($tarifaDatos as $key => $val) {
                if (is_numeric($val) && (str_starts_with($key, 'suma_') || in_array($key, ['exceso_limite', 'muerte_invalidez', 'defensa_penal', 'gastos_medicos', 'asistencia_vial', 'gastos_funerarios']))) {
                    $label = ucwords(str_replace('_', ' ', str_replace('suma_', 'suma ', $key)));
                    $cobertura_items[] = [$label, $fmtC($val)];
                }
            }
        } elseif ($tipoCal === 'por_nivel' && is_array($tarifaDatos)) {
            if (!empty($tarifaDatos['suma'])) $cobertura_items[] = [$tarifaDatos['nivel'] ?? 'Suma Asegurada', $fmtC($tarifaDatos['suma'])];
        }
    }
    // Pólizas MIGRADAS: la cobertura real quedó en el snapshot bajo 'rcv'/'apov'
    // (no en la tarifa). Se muestran esas sumas reales ANTES de caer al
    // genérico cobertura_dolares — una migrada suele tener ambos, y los
    // renglones por cobertura son el dato bueno; NO se inventa nada.
    if (empty($cobertura_items)) {
        $rcvSnap = $snap['rcv'] ?? [];
        if (!empty($rcvSnap['suma_persona'])) $cobertura_items[] = ['Daños a Personas', $fmtM($rcvSnap['suma_persona'])];
        if (!empty($rcvSnap['suma_cosa']))    $cobertura_items[] = ['Daños a Cosas',    $fmtM($rcvSnap['suma_cosa'])];
        $apovSnap = $snap['apov'] ?? [];
        if (!empty($apovSnap['suma_muerte_accidental'])) $cobertura_items[] = ['Muerte Accidental',  $fmtM($apovSnap['suma_muerte_accidental'])];
        if (!empty($apovSnap['suma_invalidez']))         $cobertura_items[] = ['Invalidez',           $fmtM($apovSnap['suma_invalidez'])];
        if (!empty($apovSnap['suma_medicos']))           $cobertura_items[] = ['Gastos Médicos',      $fmtM($apovSnap['suma_medicos'])];
        if (!empty($apovSnap['suma_funerarios']))        $cobertura_items[] = ['Gastos Funerarios',   $fmtM($apovSnap['suma_funerarios'])];
    }
    // Pólizas sin tarifario enlazado ni sumas migradas: la suma asegurada
    // guardada directamente en la póliza, sin depender del snapshot.
    if (empty($cobertura_items) && (float) $poliza->cobertura_dolares > 0) {
        $cobertura_items[] = ['Suma Asegurada', $fmtM($poliza->cobertura_dolares)];
    }
    // Último respaldo: la suma asegurada en Bs guardada en la propia póliza.
    if (empty($cobertura_items) && (float) $poliza->cobertura_bs > 0) {
        $cobertura_items[] = ['Suma Asegurada', $fmtM($poliza->cobertura_bs)];
    }

    // Para vehículos el cuadro póliza se armará usando una cuadrícula de 3 columnas
    // para conservar el diseño, pero usando los nombres y montos dinámicos extraídos arriba.
    $coberturaGrid = null;
    if (($bien['tipo'] ?? null) === 'vehiculo' && count($cobertura_items) > 1) {
        $chunks = array_chunk($cobertura_items, 3);
        $coberturaGrid = [];
        foreach ($chunks as $chunk) {
            $fila = [];
            for ($i = 0; $i < 3; $i++) {
                if (isset($chunk[$i])) {
                    $fila[] = $chunk[$i][0];
                    $fila[] = $chunk[$i][1];
                } else {
                    $fila[] = null;
                    $fila[] = null;
                }
            }
            $coberturaGrid[] = $fila;
        }
    }

    // La póliza se queda en su moneda nativa de principio a fin — sin tasa
    // BCV ni equivalente en bolívares en el cuadro (no se mezcla con Bs.).
    $monedaPago     = $poliza->moneda ?? $snap['moneda'] ?? 'USD';
    $monedaLabel    = \App\Support\Moneda::etiqueta($monedaDoc);
    $frecuenciaPago = mb_strtoupper($poliza->frecuencia_pago ?? 'Anual');

    $imgLogon  = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logon.jpg')));
    $imgIcono  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/icono.png')));
    $imgCarnet = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logocarnet.jpg')));
    $imgFirma  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/firma.png')));
    $imgSello  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/sello-venezolanadeseguros.png')));
@endphp

<style>
    @page { margin: 0cm 0cm; font-family: Arial, sans-serif; font-size: 10px; }
    body  { margin-top: 1cm; margin-bottom: 0cm; margin-left: 1cm; margin-right: 1.2cm; }

    /* Cabeceras de sección */
    .linea {
        text-align: center;
        border: 1px solid #0a6070;
        background: #127481;
        padding: 3px 0;
        text-transform: uppercase;
        color: white;
        font-size: 10.5px;
        letter-spacing: 0.4px;
    }

    /* Fila etiqueta */
    .titu td {
        font-size: 9px;
        border: 1px solid #888;
        border-bottom: none;
        padding: 2px 4px;
        background: #eef6f7;
        color: #444;
    }

    /* Fila valor */
    .titu2 th {
        border: 1px solid #888;
        border-top: none;
        text-align: left;
        padding: 2px 4px;
        font-size: 9.5px;
    }

    /* Cuadro número de póliza */
    .cuadro table { border: 1px solid #127481; border-collapse: collapse; width: 100%; }
    .cuadro td    { border: 1px solid #127481; text-align: center; text-transform: uppercase; padding: 2px 4px; font-size: 9px; }
    .cuadro td:first-child { text-align: left; background: #eef6f7; color: #444; }

    /* Línea de firma */
    .lineaf { border-top: 1px solid #333; max-width: 200px; padding: 0; margin: 2px auto 1px auto; }
</style>

<body>

<!-- ══════════════════════════════════════════════════ ENCABEZADO -->
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:2px;">
    <tr>
        <td style="width:3.5cm; vertical-align:middle;">
            <img src="{{ $imgLogon }}" style="width:3.5cm; height:2.2cm;" alt="logo"/>
        </td>
        <td style="text-align:center; vertical-align:middle; padding:0 12px;">
            <strong style="font-size:17px; color:#127481;">Cuadro Póliza — Recibo de Prima</strong><br/>
            {{-- tipo "N/D" viene de pólizas migradas — cae a Individual --}}
            <span style="font-size:12px; color:#444;">{{ $ramoLabel }} · {{ in_array($poliza->tipo, [null, '', 'N/D'], true) ? 'Individual' : $poliza->tipo }}</span>
        </td>
        <td style="width:280px; vertical-align:top;">
            <table width="100%" cellspacing="0" cellpadding="0">
                <tr>
                    @if($qrCode)
                    <td style="width:90px; vertical-align:middle; padding-right:6px;">
                        <img src="{{ $qrCode }}" style="width:86px; height:86px;" alt="QR"/>
                    </td>
                    @endif
                    <td style="vertical-align:middle;">
                        <div class="cuadro">
                            <table>
                                <tr><td>Póliza:</td>       <td><strong>{{ $poliza->nro_contrato }}</strong></td></tr>
                                @if($llevaCertificado)
                                <tr><td>{{ $tipoPolizaLabel }}:</td>   <td><strong>{{ $certificadoPrincipal }}</strong></td></tr>
                                @else
                                <tr><td>Recibo:</td>       <td><strong>{{ $numeroRecibo }}</strong></td></tr>
                                @endif
                                <tr><td>Fecha:</td>         <td><strong>{{ $poliza->fecha_emision?->format('d-m-Y') }}</strong></td></tr>
                                <tr><td>Páginas:</td>       <td><strong>1</strong></td></tr>
                                <tr><td>Inicio Póliza:</td> <td><strong>{{ $poliza->fecha_emision?->format('Y') }}</strong></td></tr>
                            </table>
                        </div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

<!-- ══════════════════════════════════════ TOMADOR Y ASEGURADO -->
<table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
    <tr><th colspan="2" class="linea">Datos del Tomador y Asegurado</th></tr>
    <tr class="titu">
        <td style="width:70%;">Tomador:</td><td style="width:30%;">C.I. / RIF</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $tomadorNombre }}</th>
        <th style="width:30%; text-align:left;">{{ $tomadorCi }}</th>
    </tr>
    <tr class="titu">
        <td>Dirección Tomador:</td><td>Teléfonos</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $tomadorDireccion }}</th>
        <th style="width:30%; text-align:left;">{{ $tomadorTel }}</th>
    </tr>
    <tr class="titu">
        <td>Asegurado:</td><td>C.I. / RIF</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $asegNombre }}</th>
        <th style="width:30%; text-align:left;">{{ $asegCi }}</th>
    </tr>
    <tr class="titu">
        <td>Dirección Asegurado:</td><td>Teléfonos</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $asegDireccion }}</th>
        <th style="width:30%; text-align:left;">{{ $asegTel }}</th>
    </tr>
</table>

<!-- ═══════════════════════════════════════════════ DATOS PÓLIZA -->
<table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
    <tr><th colspan="3" class="linea">Datos de la Póliza</th></tr>
    <tr class="titu"><td colspan="2">Vigencia:</td><td>Moneda</td></tr>
    <tr class="titu2">
        <th colspan="2">
            Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hasta: {{ $poliza->fecha_vencimiento?->format('d-m-Y') }}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hora: {{ now()->format('H:i') }}
        </th>
        <th>{{ $monedaLabel }}</th>
    </tr>
    <tr class="titu">
        <td>Sucursal de Cobro:</td>
        <td>Canal de Venta</td>
        <td>Frecuencia de Pago</td>
    </tr>
    <tr class="titu2">
        <th>{{ $poliza->sede_poliza }}</th>
        <th>{{ $canalVenta }}</th>
        <th>{{ $frecuenciaPago }}</th>
    </tr>
    <tr class="titu"><td>Código del Intermediario</td><td>Intermediario</td><td>Participación</td></tr>
    <tr class="titu2">
        <th>{{ $vendedorCodigo }}</th>
        <th style="text-transform:uppercase;">{{ $vendedorNombre }}</th>
        <th>100%</th>
    </tr>
</table>

<!-- ════════════════════════════════════════════════ DATOS RECIBO -->
<table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
    <tr><th colspan="4" class="linea">Datos del Recibo</th></tr>
    <tr class="titu"><td>Número de Recibo:</td><td colspan="2">Vigencia:</td><td>Tipo de Movimiento</td></tr>
    <tr class="titu2">
        <th>{{ $numeroRecibo }}</th>
        <th colspan="2">
            Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hasta: {{ $poliza->fecha_vencimiento?->format('d-m-Y') }}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hora: {{ now()->format('H:i') }}
        </th>
        <th>{{ $esRenovacion ? 'RENOVACIÓN' : 'EMISIÓN / ALTA' }}</th>
    </tr>
    <tr class="titu">
        <td>Sucursal de Oficina:</td>
        <td>Canal de Venta</td>
        <td>Frecuencia de Pago</td>
        <td>Total a Cobrar</td>
    </tr>
    <tr class="titu2">
        <th>{{ $poliza->sede_poliza }}</th>
        <th>{{ $canalVenta }}</th>
        <th>{{ $frecuenciaPago }}</th>
        <th>{{ $monedaSimbolo }}{{ $fmtM($poliza->total) }}</th>
    </tr>
    {{-- Sin tasa BCV ni total en bolívares acá a propósito: la póliza se
         emite en una sola moneda (la del producto) y se queda en esa
         moneda de principio a fin — no se mezcla con un equivalente en Bs. --}}
    <tr class="titu">
        <td colspan="4">Forma de Pago / Moneda</td>
    </tr>
    <tr class="titu2">
        <th colspan="4">{{ $poliza->pago }} / {{ $monedaPago }}</th>
    </tr>
</table>

<!-- ══════════════════════════════ PLANES + VEHÍCULO + COBERTURAS -->
<table class="planaso" style="margin-top:5px;" width="100%" cellspacing="0">
    <tr><th colspan="6" class="linea">Planes Asociados</th></tr>
    <tr class="titu2">
        <td colspan="6" style="border:1px solid #888; padding:3px 5px;">
            {{-- Solo el producto (ej. "RCV") — el nombre interno de la tarifa
                 ("Plan: …") no debe salir en el documento. --}}
            Producto: <strong>{{ $prodSnap['nombre'] ?? $poliza->producto?->nombre ?? '—' }}</strong>
        </td>
    </tr>

    @foreach($carnetList as $cb)
    @php
        $D = $datosBien($cb); $multi = count($carnetList) > 1;
        $attrsPares = collect($D['attrs'])->filter(fn($v) => $v !== null && $v !== '')->all();
        // Bienes viejos quedaron sin 'tipo' pero con sus atributos completos: se
        // reconocen como vehículo por las claves propias de uno. Las dos secciones
        // son EXCLUYENTES — un vehículo no debe salir también como bien genérico.
        $esVehiculo = ($D['tipo'] ?? null) === 'vehiculo' || (empty($D['tipo']) && array_intersect(
            ['placa', 'marca', 'serial_carroceria', 'serialCarroceria', 'serial_motor', 'serialMotor'],
            array_keys($attrsPares)
        ));
    @endphp
    @if($esVehiculo)
    <tr><th colspan="6" class="linea">Datos del Vehículo{{ $multi ? ' — '.$tipoPolizaLabel.' N° '.$D['cert'] : '' }}</th></tr>
    <tr>
        <td style="width:13%; text-align:left; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Marca:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $D['marca'] }}</strong></td>
        <td style="width:13%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px;">Modelo:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $D['modelo'] }}</strong></td>
        <td style="width:14%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px;">Núm. Pasajeros:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ $D['puestos'] }}</strong></td>
    </tr>
    <tr>
        <td style="width:13%; text-align:left; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Versión:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $D['version'] }}</strong></td>
        <td style="width:13%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px;">Año:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $D['anio'] }}</strong></td>
        <td style="width:14%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px;">Tipo de Vehículo:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ $D['clase'] }}</strong></td>
    </tr>
    <tr>
        <td style="width:13%; text-align:left; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Placa:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $D['placa'] }}</strong></td>
        <td style="width:13%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px;">Serial Motor:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $D['serMot'] }}</strong></td>
        <td style="width:14%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px;">Uso:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ $D['uso'] }}</strong></td>
    </tr>
    <tr>
        <td style="width:13%; text-align:left; border-left:1px solid #888; border-bottom:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Color:</td>
        <td style="padding:3px 5px; border-bottom:1px solid #888;"><strong>{{ $D['color'] }}</strong></td>
        <td style="width:13%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px; border-bottom:1px solid #888;">Serial Carrocería:</td>
        <td style="padding:3px 5px; border-bottom:1px solid #888;"><strong>{{ $D['serCar'] }}</strong></td>
        <td style="width:14%; text-align:left; padding:1.5px 3px; color:#555; font-size:9px; border-bottom:1px solid #888;">Otros:</td>
        <td style="border-right:1px solid #888; padding:3px 5px; border-bottom:1px solid #888;"><strong>{{ $D['obs'] ?: '—' }}</strong></td>
    </tr>
    @elseif(count($attrsPares) > 0)
    <tr><th colspan="6" class="linea">Datos del Bien Asegurado{{ $D['tipo'] ? ' — '.ucfirst(str_replace('_', ' ', $D['tipo'])) : '' }}{{ $multi ? ' (N° '.$D['cert'].')' : '' }}</th></tr>
        @foreach(array_chunk(array_keys($attrsPares), 3) as $grupo)
        <tr>
            @foreach($grupo as $k)
            <td style="width:13%; text-align:left; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">{{ ucfirst(str_replace('_', ' ', $k)) }}:</td>
            <td style="{{ $loop->last ? 'border-right:1px solid #888;' : '' }} padding:1.5px 4px;"><strong>{{ mb_strtoupper((string) $attrsPares[$k]) }}</strong></td>
            @endforeach
            @if(count($grupo) < 3)
                @for($i = count($grupo); $i < 3; $i++)
                <td style="width:13%;"></td><td style="{{ $i === 2 ? 'border-right:1px solid #888;' : '' }}"></td>
                @endfor
            @endif
        </tr>
        @endforeach
    @endif
    @endforeach

    <tr><th colspan="6" class="linea">Coberturas / Sumas Aseguradas</th></tr>
    @if($coberturaGrid)
        @foreach($coberturaGrid as $fila)
        <tr>
            @for($i = 0; $i < 6; $i += 2)
                @if($fila[$i] !== null)
                <td style="width:13%; text-align:left; border-left:{{ $i === 0 ? '1px solid #888' : 'none' }}; padding:1.5px 3px; color:#555; font-size:9px;">{{ $fila[$i] }}:</td>
                <td style="{{ $i === 4 ? 'border-right:1px solid #888;' : '' }} padding:1.5px 4px;"><strong>{{ $monedaSimbolo }}{{ $fila[$i + 1] }}</strong></td>
                @else
                <td style="width:13%; border-left:{{ $i === 0 ? '1px solid #888' : 'none' }};"></td>
                <td style="{{ $i === 4 ? 'border-right:1px solid #888;' : '' }}"></td>
                @endif
            @endfor
        </tr>
        @endforeach
    @else
        @foreach($cobertura_items as $item)
        <tr>
            <td style="text-align:left; border-left:1px solid #888; padding:1.5px 4px; color:#555; font-size:9px;" colspan="2">{{ $item[0] }}:</td>
            <td colspan="4" style="border-right:1px solid #888; padding:3px 6px;">
                <strong>{{ $monedaSimbolo }}{{ $item[1] }}</strong>
            </td>
        </tr>
        @endforeach
    @endif

    <tr>
        @if(($cobs['iva'] ?? 0) > 0)
        <td style="border-left:1px solid #888; border-bottom:1px solid #888; text-align:left; padding:3px 5px; color:#555; font-size:9px;">IVA:</td>
        <td style="border-bottom:1px solid #888; padding:3px 5px;"><strong>{{ $monedaSimbolo }}{{ $fmtM($cobs["iva"]) }}</strong></td>
        <td colspan="4" style="border-right:1px solid #888; border-bottom:1px solid #888;"></td>
        @else
        <td colspan="6" style="border-left:1px solid #888; border-right:1px solid #888; border-bottom:1px solid #888;"></td>
        @endif
    </tr>

    <tr>
        <td style="padding:3px 5px 1px; font-size:8px; color:#555; text-align:justify;" colspan="6">
            El Asegurador entregará al Tomador este Cuadro Póliza, junto con las condiciones generales, las condiciones particulares, los anexos, si los hubiere, copia de la solicitud de seguro y demás documentos que formen parte del contrato. En las renovaciones la obligación se mantendrá si se modifican las condiciones originalmente contratadas. El Asegurador se obliga a atender y resolver cualquier denuncia, queja, reclamo o sugerencia que presente el Tomador, Asegurado o Beneficiario, con ocasión de las controversias derivadas de la ejecución del presente contrato de seguro, a través de la figura del Defensor del Tomador, Asegurado o Beneficiario. A tales fines, el Tomador, Asegurado o Beneficiario, podrá acudir a la respectiva Unidad de Defensa, o comunicarse a través de los mecanismos dispuestos para ello.
        </td>
    </tr>
    <tr>
        <td style="padding:1px 5px 3px; font-size:8px; color:#555;" colspan="6">
            Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-09-0138-2025 de fecha 21/02/2025.
        </td>
    </tr>
</table>

<!-- ══════════════════════════════════════════════════════ FIRMAS -->
<table width="100%" border="0" cellspacing="0" style="margin-top:1px;">
    <tr>
        <td width="50%" style="text-align:center; vertical-align:bottom; padding:3px 6px;">
            <div class="lineaf"></div>
            <span style="font-size:9px; color:#333;">{{ $tomadorNombre }}</span>
        </td>
        <td width="50%" style="text-align:center; vertical-align:bottom; padding:2px 6px;">
            <!-- Sello superpuesto sobre la firma a propósito (no uno al
                 lado del otro) — para que no se puedan recortar/falsificar
                 por separado. -->
            <div style="position:relative; display:inline-block; width:4.4cm; height:1.7cm;">
                <img src="{{ $imgFirma }}" style="position:absolute; left:0; bottom:0; width:3cm; height:1.4cm;" alt="firma"/>
                <img src="{{ $imgSello }}" style="position:absolute; right:0; top:0; width:2.6cm; height:1.47cm; opacity:0.88;" alt="sello"/>
            </div>
            <div class="lineaf"></div>
            <span style="font-size:9px; color:#333;">Por LA VENEZOLANA DE SEGUROS Y VIDA C.A.</span>
        </td>
    </tr>
</table>

<!-- ════════════════════════════════════════════════ PIE EMPRESA -->
<table style="margin-top:4px; border:1px solid #127481;" width="100%" border="0" align="center" cellspacing="0">
    <tr>
        <td style="padding:3px 5px; font-size:8px; color:#444; background:#f9fdfe;">
            Inscrita en el Registro Mercantil Segundo de la Circunscripción Judicial del Distrito Federal y Estado Miranda, en fecha 21/04/1955, bajo el Nro. 70, Tomo 4-A-SGDO. Inscrita en la Superintendencia de la Actividad Aseguradora bajo el N° 40. Miembro de la Cámara de Aseguradores de Venezuela. Dirección: Av. Madrid con Av. Jalisco, Edf. La Venezolana de Seguros, Las Mercedes-Baruta, Caracas-Venezuela. Telf. (0414) 3169371 &nbsp; / (0422) 2320897
        </td>
    </tr>
</table>

<!-- ══════════════════════════════════════════════ CARNETS + QR (uno por bien/vehículo) -->
@foreach($carnetList as $cb)
@php
    // Datos del bien de este carnet. El principal conserva los datos ya
    // calculados arriba (snapshot/acotado); los adicionales derivan de su
    // propio BienAsegurado y muestran su número de certificado.
    $carnetNro = ($cb?->certificado) ?: $poliza->nro_contrato;
    if ($cb && $cb->certificado !== null && $cb->bien) {
        $bien   = ['tipo' => $cb->bien->tipo, 'atributos' => $cb->bien->atributos ?? []];
        $attrs  = $cb->bien->atributos ?? [];
        $marca  = mb_strtoupper($attrs['marca']  ?? '—');
        $modelo = mb_strtoupper($attrs['modelo'] ?? '—');
        $anio   = $attrs['anio']              ?? '—';
        $placa  = mb_strtoupper($attrs['placa']  ?? '—');
        $color  = mb_strtoupper($attrs['color']  ?? '—');
        $serCar = mb_strtoupper($attrs['serial_carroceria'] ?? ($attrs['serialCarroceria'] ?? '—'));
    }
@endphp
{{-- Ambos carnets (frontal y reverso) deben medir EXACTAMENTE lo mismo en
     todos los certificados: table-layout fixed reparte columnas iguales sin
     importar el contenido, y el div interno de alto fijo con overflow hidden
     evita que un carnet con más datos crezca más que los demás. --}}
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:20px; page-break-inside:avoid; table-layout:fixed;">
    <tr>
        <!-- Carnet Frontal -->
        <td style="width:48.7%; border:2px solid #127481; font-size:9px; vertical-align:top; padding:0;">
            <div style="position:relative; width:100%; height:196px; overflow:hidden;">
            <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:100%; height:100%; top:0; left:0; opacity:0.16;"/>
            <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.6cm; height:1.1cm; top:2px; left:5px; opacity:0.45;"/>
            <div style="padding:8px 14px;">
            <table style="text-align:center; width:100%; margin-top:0;">
                <!-- N° esquina superior derecha -->
                <tr>
                    <th colspan="3" style="text-align:right; padding:4px 8px 0 0; white-space:nowrap; font-weight:normal;">
                        <strong style="font-size:9px;">N° {{ $carnetNro }}</strong>
                    </th>
                </tr>
                <!-- Tipo de póliza centrado -->
                <tr>
                    <th colspan="3" style="text-align:center; padding:3px 0 5px;">
                        <strong style="font-size:15px;">{{ $tipoPolizaLabel }}</strong>
                    </th>
                </tr>
                <!-- DATOS DEL ASEGURADO -->
                <tr><th colspan="3" style="font-size:9px; padding:2px 6px;">DATOS DEL ASEGURADO</th></tr>
                <tr>
                    <th style="width:33.3%; font-size:8px; padding:1px 4px;">Nombres / Apellidos</th>
                    <th style="width:33.3%; font-size:8px; padding:1px 4px;">C.I / RIF</th>
                    <th style="width:33.3%; font-size:8px; padding:1px 4px;">Teléfono</th>
                </tr>
                <tr>
                    <td style="width:33.3%; font-size:8.5px; font-weight:600; padding:1px 4px; vertical-align:top;">
                        {{ $asegPartes['nombres'] ?: '—' }}<br/>{{ $asegPartes['apellidos'] ?: '—' }}
                    </td>
                    <td style="width:33.3%; font-size:8.5px; font-weight:600; padding:1px 4px; vertical-align:top;">{{ $asegCi }}</td>
                    <td style="width:33.3%; font-size:8.5px; font-weight:600; padding:1px 4px; vertical-align:top;">{{ $asegTel }}</td>
                </tr>
                <!-- VEHÍCULO ASEGURADO -->
                <tr><th colspan="3" style="font-size:9px; padding:2px 6px;">VEHÍCULO ASEGURADO</th></tr>
                <tr>
                    <th style="font-size:8px; padding:1px 4px;">MARCA</th>
                    <th style="font-size:8px; padding:1px 4px;">MODELO</th>
                    <th style="font-size:8px; padding:1px 4px;">PLACA</th>
                </tr>
                <tr>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $marca }}</td>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $modelo }}</td>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $placa }}</td>
                </tr>
                <tr>
                    <th style="font-size:8px; padding:1px 4px;">COLOR</th>
                    <th style="font-size:8px; padding:1px 4px;">SERIAL CARROCERÍA</th>
                    <th style="font-size:8px; padding:1px 4px;">AÑO</th>
                </tr>
                <tr>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $color }}</td>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $serCar }}</td>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $anio }}</td>
                </tr>
                @if(!empty($bien['tipo']))
                @php $attrsCarnet = array_slice(collect($attrs)->filter(fn($v) => $v !== null && $v !== '')->all(), 0, 6, true); @endphp
                <!-- BIEN ASEGURADO (no vehículo) -->
                <tr><th colspan="3" style="font-size:9px; padding:2px 6px;">BIEN ASEGURADO — {{ mb_strtoupper(str_replace('_', ' ', $bien['tipo'])) }}</th></tr>
                @foreach(array_chunk(array_keys($attrsCarnet), 3) as $grupoCarnet)
                <tr>
                    @foreach($grupoCarnet as $k)
                    <th style="font-size:8px; padding:1px 4px;">{{ mb_strtoupper(str_replace('_', ' ', $k)) }}</th>
                    @endforeach
                </tr>
                <tr>
                    @foreach($grupoCarnet as $k)
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ mb_strtoupper((string) $attrsCarnet[$k]) }}</td>
                    @endforeach
                </tr>
                @endforeach
                @endif
            </table>
            </div>
            </div>
        </td>

        <td style="width:2.6%;"></td>

        <!-- Carnet Reverso: EMISIÓN | QR | VENCIMIENTO -->
        <td style="width:48.7%; border:2px solid #127481; font-size:9px; vertical-align:top; padding:0;">
            <div style="position:relative; width:100%; height:196px; overflow:hidden;">
            <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:100%; height:100%; top:0; left:0; opacity:0.16;"/>
            <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.6cm; height:1.1cm; top:2px; left:5px; opacity:0.45;"/>
            <div style="padding:12px 20px;">
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:0;">
                <!-- Providencia -->
                <tr>
                    <td colspan="3" style="font-size:7px; padding:4px 6px 8px; line-height:1.35; text-align:center;">
                        <strong>Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-09-0138-2025 de fecha 21/02/2025.</strong>
                    </td>
                </tr>
                <!-- EMISIÓN | QR | VENCIMIENTO -->
                <tr>
                    <td style="width:80px; text-align:center; vertical-align:middle; padding:6px 6px;">
                        <div style="font-size:8.5px; font-weight:bold;">EMISIÓN</div>
                        <div style="font-size:9px; font-weight:600; white-space:nowrap;">{{ $poliza->fecha_emision?->format('d-m-Y') }}</div>
                    </td>
                    <td style="width:130px; text-align:center; vertical-align:middle; padding:6px 12px;">
                        @if($qrCode)
                        <img src="{{ $qrCode }}" style="width:78px; height:78px; display:block; margin:0 auto;" alt="QR"/>
                        @else
                        <div style="width:78px; height:78px; border:1px dashed #aaa; margin:0 auto; display:flex; align-items:center; justify-content:center;">
                            <span style="font-size:7px; color:#888; word-break:break-all; padding:4px;">Verificar póliza</span>
                        </div>
                        @endif
                    </td>
                    <td style="width:80px; text-align:center; vertical-align:middle; padding:6px 6px;">
                        <div style="font-size:8.5px; font-weight:bold;">VENCIMIENTO</div>
                        <div style="font-size:9px; font-weight:600; white-space:nowrap;">{{ $poliza->fecha_vencimiento?->format('d-m-Y') }}</div>
                    </td>
                </tr>
                <!-- Contacto siniestros -->
                <tr>
                    <td colspan="3" style="text-align:center; padding:8px 4px 4px;">
                        <div style="font-weight:bold; font-size:8.5px;">Reportes y/o Siniestros</div>
                        <div style="font-weight:bold; font-size:8.5px;">0414-8299562 / 0414-3169371</div>
                    </td>
                </tr>
            </table>
            </div>
            </div>
        </td>
    </tr>
</table>
@endforeach

</body>
</html>
