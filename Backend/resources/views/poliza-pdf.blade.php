<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Póliza {{ $poliza->nro_contrato }}</title>
</head>

@php
    // El bien original de la póliza siempre tiene certificado=NULL (los
    // certificados numerados son solo para bienes ADICIONALES agregados
    // después) — "0" es la representación estándar de ese bien base.
    $bienPrincipal       = $poliza->bienes->firstWhere('certificado', null) ?? $poliza->bienes->first();
    $certificadoPrincipal = $bienPrincipal?->certificado ?? '0';

    $snap        = $poliza->snapshot_datos ?? [];
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
    $llevaCertificado = (bool) ($poliza->producto?->lleva_certificado ?? false) && $poliza->bienes->count() > 1;
    $bien        = $snap['bien'] ?? ($poliza->solicitud?->bien ? [
        'tipo'          => $poliza->solicitud->bien->tipo,
        'atributos'     => $poliza->solicitud->bien->atributos ?? [],
        'observaciones' => $poliza->solicitud->bien->observaciones,
    ] : []);
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
    $tarifaDatos = $cobs['tarifa']['datos'] ?? ($snap['tarifario']['datos'] ?? []);

    // Todos los montos del documento (prima, sumas aseguradas, IVA, total a
    // cobrar) van en la moneda nativa del producto — nunca mezclada con otra.
    $monedaProducto = $poliza->monedaNativa();
    $monedaSimbolo  = \App\Support\Moneda::simbolo($monedaProducto);

    $tomadorNombre = $tomador['nombre']   ?? ($poliza->asegurado_nombre ?? '—');
    $tomadorCi     = $tomador['ci']       ?? ($poliza->asegurado_ci     ?? '—');
    $asegNombre    = $asegurado['nombre'] ?? ($poliza->asegurado_nombre ?? $tomadorNombre);
    $asegCi        = $asegurado['ci']     ?? ($poliza->asegurado_ci     ?? $tomadorCi);
    $asegPartes    = \App\Support\NombreSplitter::partes($asegNombre);

    // Teléfono y dirección: del snapshot (pólizas futuras con esos campos) o
    // de la relación persona en vivo.
    $persona         = $poliza->solicitud?->persona;
    $tomadorTel      = $tomador['telefono']  ?? ($persona?->celular ?? ($persona?->telefono ?? '—'));
    $tomadorDireccion = $tomador['direccion'] ?? ($persona?->direccion ?? '—');
    // El asegurado no siempre tiene su propio registro de Persona (puede ser
    // un familiar indicado solo por nombre/CI al cotizar) — si no hay datos
    // propios, se asume la misma dirección/teléfono del tomador.
    $asegDireccion   = $asegurado['direccion'] ?? $tomadorDireccion;
    $asegTel         = $asegurado['telefono']  ?? $tomadorTel;

    // Vendedor / intermediario desde la relación cargada
    $vendedorNombre = strtoupper($poliza->vendedor?->nombre ?? '—');
    $vendedorCodigo = $poliza->vendedor?->nro_sede ?? '—';
    // Canal de venta: "Vendedor Calle" vende como intermediario externo;
    // "Oficina"/"Admin" gestionan la venta directa desde la cooperativa.
    $canalVenta     = $poliza->vendedor?->cargo === 'Vendedor Calle' ? 'INTERMEDIARIO' : 'DIRECTO';

    $marca   = strtoupper($attrs['marca']  ?? '—');
    $modelo  = strtoupper($attrs['modelo'] ?? '—');
    $anio    = $attrs['anio']              ?? '—';
    $placa   = strtoupper($attrs['placa']  ?? '—');
    $color   = strtoupper($attrs['color']  ?? '—');
    $uso     = strtoupper($attrs['uso']    ?? '—');
    $serCar  = strtoupper($attrs['serial_carroceria'] ?? ($attrs['serialCarroceria'] ?? '—'));
    $serMot  = strtoupper($attrs['serial_motor']      ?? ($attrs['serialMotor']      ?? '—'));
    $puestos = $attrs['puestos'] ?? '—';
    $clase   = strtoupper($attrs['clase']  ?? ($attrs['tipo'] ?? '—'));
    $version = strtoupper($attrs['version'] ?? 'A INDICAR');

    $cobertura_items = [];
    if ($tipoCal === 'por_valor') {
        // "por_valor" no es exclusivo de vehículos (ej. Póliza Muebles también
        // lo usa) — antes decía "Responsabilidad Civil Obligatoria" siempre,
        // aunque el bien fuera un inmueble o cualquier otro bien de valor.
        $labelPorValor = ($bien['tipo'] ?? null) === 'vehiculo' ? 'Responsabilidad Civil Obligatoria' : 'Suma Asegurada';
        $cobertura_items[] = [$labelPorValor, number_format((float)$poliza->cobertura_dolares, 2)];
    } elseif ($tipoCal === 'por_plan' && is_array($tarifaDatos)) {
        // Las coberturas de un plan son un mapa de claves nombradas (ver
        // TarifarioController) — antes solo se reconocían 4 claves fijas que
        // no coincidían con los datos reales (p.ej. "invalidez_total" vs
        // "invalidez"), así que la mayoría de las coberturas no aparecían.
        foreach ($tarifaDatos as $key => $val) {
            if (is_array($val) && isset($val['suma'])) {
                $label = $val['label'] ?? ucwords(str_replace('_', ' ', (string) $key));
                $cobertura_items[] = [$label, number_format((float)$val['suma'], 2)];
            }
        }
    } elseif ($tipoCal === 'fijo' && is_array($tarifaDatos)) {
        if (!empty($tarifaDatos['suma_persona'])) $cobertura_items[] = ['Suma por Persona', number_format((float)$tarifaDatos['suma_persona'], 2)];
        if (!empty($tarifaDatos['suma_cosa']))    $cobertura_items[] = ['Suma por Cosa',    number_format((float)$tarifaDatos['suma_cosa'],   2)];
    } elseif ($tipoCal === 'por_nivel' && is_array($tarifaDatos)) {
        if (!empty($tarifaDatos['suma'])) $cobertura_items[] = [$tarifaDatos['nivel'] ?? 'Suma Asegurada', number_format((float)$tarifaDatos['suma'], 2)];
    }
    // Pólizas sin tarifario enlazado (anteriores a esa relación): la suma
    // asegurada se guarda directamente en la póliza, sin depender del snapshot.
    if (empty($cobertura_items) && (float) $poliza->cobertura_dolares > 0) {
        $cobertura_items[] = ['Suma Asegurada', number_format((float) $poliza->cobertura_dolares, 2)];
    }

    // Para vehículos el cuadro póliza estándar (modelo La Venezolana) usa un
    // grid fijo de 8 coberturas típicas de auto en vez de una lista simple —
    // las que el producto no tenga configuradas se muestran en 0,00, igual
    // que en un cuadro póliza real cuando esa cobertura no aplica.
    $coberturaGrid = null;
    if (($bien['tipo'] ?? null) === 'vehiculo' && $tipoCal === 'fijo' && is_array($tarifaDatos)) {
        $g = fn($k) => number_format((float) ($tarifaDatos[$k] ?? 0), 2);
        $coberturaGrid = [
            ['Daños a Personas', $g('suma_persona'), 'Exceso de Límite', $g('exceso_limite'), 'Muerte e Invalidez', $g('muerte_invalidez')],
            ['Daños a Cosas',    $g('suma_cosa'),    'Defensa Penal',    $g('defensa_penal'), 'Gastos Médicos',     $g('gastos_medicos')],
            ['Asistencia Vial',  $g('asistencia_vial'), null, null,     'Gastos Funerarios',  $g('gastos_funerarios')],
        ];
    }

    // La póliza se queda en su moneda nativa de principio a fin — sin tasa
    // BCV ni equivalente en bolívares en el cuadro (no se mezcla con Bs.).
    $monedaPago     = $poliza->moneda ?? $snap['moneda'] ?? 'USD';
    $monedaLabel    = \App\Support\Moneda::etiqueta($monedaProducto);
    $frecuenciaPago = strtoupper($poliza->frecuencia_pago ?? 'Anual');

    $imgLogon  = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logon.jpg')));
    $imgIcono  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/icono.png')));
    $imgCarnet = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logocarnet.jpg')));
    $imgFirma  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/firma.png')));
    $imgSello  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/sello-venezolanadeseguros.png')));
@endphp

<style>
    @page { margin: 0cm 0cm; font-family: Arial, sans-serif; font-size: 10px; }
    body  { margin-top: 0.3cm; margin-bottom: 0cm; margin-left: 1cm; margin-right: 1.2cm; }

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
            <span style="font-size:12px; color:#444;">{{ $ramoLabel }} · {{ $poliza->tipo ?? 'Individual' }}</span>
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
        <th style="width:30%; text-align:center;">{{ $tomadorCi }}</th>
    </tr>
    <tr class="titu">
        <td>Dirección Tomador:</td><td>Teléfonos</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $tomadorDireccion }}</th>
        <th style="width:30%; text-align:center;">{{ $tomadorTel }}</th>
    </tr>
    <tr class="titu">
        <td>Asegurado:</td><td>C.I. / RIF</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $asegNombre }}</th>
        <th style="width:30%; text-align:center;">{{ $asegCi }}</th>
    </tr>
    <tr class="titu">
        <td>Dirección Asegurado:</td><td>Teléfonos</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $asegDireccion }}</th>
        <th style="width:30%; text-align:center;">{{ $asegTel }}</th>
    </tr>
</table>

<!-- ═══════════════════════════════════════════════ DATOS PÓLIZA -->
<table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
    <tr><th colspan="3" class="linea">Datos de la Póliza</th></tr>
    <tr class="titu"><td colspan="2">Vigencia:</td><td>Moneda</td></tr>
    <tr class="titu2">
        <th colspan="2">
            &nbsp;&nbsp;&nbsp;Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
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
    <tr class="titu"><td colspan="2">Código del Intermediario</td><td>Participación</td></tr>
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
            &nbsp;&nbsp;&nbsp;Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
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
        <th>{{ $monedaSimbolo }}{{ number_format((float)$poliza->total, 2) }}</th>
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
            Producto: <strong>{{ $prodSnap['nombre'] ?? $poliza->producto?->nombre ?? '—' }}</strong>
            @if(!empty($cobs['tarifa']['nombre']))
                &nbsp;|&nbsp; Plan: <strong>{{ $cobs['tarifa']['nombre'] }}</strong>
            @endif
        </td>
    </tr>

    @if(($bien['tipo'] ?? null) === 'vehiculo')
    <tr><th colspan="6" class="linea">Datos del Vehículo</th></tr>
    <tr>
        <td style="width:13%; text-align:right; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Marca:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $marca }}</strong></td>
        <td style="width:13%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Modelo:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $modelo }}</strong></td>
        <td style="width:14%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Núm. Pasajeros:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ $puestos }}</strong></td>
    </tr>
    <tr>
        <td style="width:13%; text-align:right; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Versión:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $version }}</strong></td>
        <td style="width:13%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Año:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $anio }}</strong></td>
        <td style="width:14%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Tipo de Vehículo:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ $clase }}</strong></td>
    </tr>
    <tr>
        <td style="width:13%; text-align:right; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Placa:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $placa }}</strong></td>
        <td style="width:13%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Serial Motor:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $serMot }}</strong></td>
        <td style="width:14%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Uso:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ $uso }}</strong></td>
    </tr>
    <tr>
        <td style="width:13%; text-align:right; border-left:1px solid #888; border-bottom:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">Color:</td>
        <td style="padding:3px 5px; border-bottom:1px solid #888;"><strong>{{ $color }}</strong></td>
        <td style="width:13%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px; border-bottom:1px solid #888;">Serial Carrocería:</td>
        <td style="padding:3px 5px; border-bottom:1px solid #888;"><strong>{{ $serCar }}</strong></td>
        <td style="width:14%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px; border-bottom:1px solid #888;">Otros:</td>
        <td style="border-right:1px solid #888; padding:3px 5px; border-bottom:1px solid #888;"><strong>{{ $bienObservaciones ?: '—' }}</strong></td>
    </tr>
    @elseif(!empty($bien['tipo']))
    <tr><th colspan="6" class="linea">Datos del Bien Asegurado — {{ ucfirst(str_replace('_', ' ', $bien['tipo'])) }}</th></tr>
    @php $attrsPares = collect($attrs)->filter(fn($v) => $v !== null && $v !== '')->all(); @endphp
    @if(count($attrsPares) > 0)
        @foreach(array_chunk(array_keys($attrsPares), 3) as $grupo)
        <tr>
            @foreach($grupo as $k)
            <td style="width:13%; text-align:right; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">{{ ucfirst(str_replace('_', ' ', $k)) }}:</td>
            <td style="{{ $loop->last ? 'border-right:1px solid #888;' : '' }} padding:1.5px 4px;"><strong>{{ strtoupper((string) $attrsPares[$k]) }}</strong></td>
            @endforeach
            @if(count($grupo) < 3)
                @for($i = count($grupo); $i < 3; $i++)
                <td style="width:13%;"></td><td style="{{ $i === 2 ? 'border-right:1px solid #888;' : '' }}"></td>
                @endfor
            @endif
        </tr>
        @endforeach
    @endif
    @endif

    @if($bienesAdicionales->isNotEmpty())
    <tr><th colspan="6" class="linea">Bienes Adicionales Cubiertos por esta Póliza</th></tr>
    @foreach($bienesAdicionales as $pb)
    <tr>
        <td style="width:13%; text-align:right; border-left:1px solid #888; padding:1.5px 3px; color:#555; font-size:9px;">{{ $tipoPolizaLabel }}:</td>
        <td style="padding:1.5px 4px;"><strong>{{ $pb->certificado }}</strong></td>
        <td style="width:13%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Tipo:</td>
        <td style="padding:1.5px 4px;"><strong>{{ ucfirst($pb->bien?->tipo ?? '—') }}</strong></td>
        <td style="width:14%; text-align:right; padding:1.5px 3px; color:#555; font-size:9px;">Referencia:</td>
        <td style="border-right:1px solid #888; padding:1.5px 4px;"><strong>{{ strtoupper($pb->bien?->atributos['placa'] ?? $pb->bien?->atributos['descripcion'] ?? $pb->bien?->descripcion ?? '—') }}</strong></td>
    </tr>
    @endforeach
    @endif

    <tr><th colspan="6" class="linea">Coberturas / Sumas Aseguradas</th></tr>
    @if($coberturaGrid)
        @foreach($coberturaGrid as $fila)
        <tr>
            @for($i = 0; $i < 6; $i += 2)
                @if($fila[$i] !== null)
                <td style="width:13%; text-align:right; border-left:{{ $i === 0 ? '1px solid #888' : 'none' }}; padding:1.5px 3px; color:#555; font-size:9px;">{{ $fila[$i] }}:</td>
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
            <td style="text-align:right; border-left:1px solid #888; padding:1.5px 4px; color:#555; font-size:9px;" colspan="2">{{ $item[0] }}:</td>
            <td colspan="4" style="border-right:1px solid #888; padding:3px 6px;">
                <strong>{{ $monedaSimbolo }}{{ $item[1] }}</strong>
            </td>
        </tr>
        @endforeach
    @endif

    <tr>
        <td style="text-align:right; border-left:1px solid #888; border-bottom:1px solid #888; padding:1.5px 4px; color:#555; font-size:9px;" colspan="2">Prima Neta:</td>
        <td style="border-bottom:1px solid #888; padding:1.5px 4px;" align="center"><strong>{{ $monedaSimbolo }}{{ number_format((float)($cobs["subtotal"] ?? $poliza->total), 2) }}</strong></td>
        @if(($cobs['iva'] ?? 0) > 0)
        <td style="border-bottom:1px solid #888; text-align:right; padding:3px 5px; color:#555; font-size:9px;">IVA:</td>
        <td style="border-bottom:1px solid #888; border-right:1px solid #888; padding:3px 5px;" colspan="2" align="center"><strong>{{ $monedaSimbolo }}{{ number_format((float)$cobs["iva"], 2) }}</strong></td>
        @else
        <td colspan="3" style="border-bottom:1px solid #888; border-right:1px solid #888;"></td>
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
            Inscrita en el Registro Mercantil Segundo de la Circunscripción Judicial del Distrito Federal y Estado Miranda, en fecha 21/04/1955, bajo el Nro. 70, Tomo 4-A-SGDO. Inscrita en la Superintendencia de la Actividad Aseguradora bajo el N° 40. Miembro de la Cámara de Aseguradores de Venezuela. Dirección: Av. Madrid con Av. Jalisco, Edf. La Venezolana de Seguros, Las Mercedes-Baruta, Caracas-Venezuela. Telf. (0212) 909-4848 &nbsp; Fax (0212) 909-4898
        </td>
    </tr>
</table>

<!-- ══════════════════════════════════════════════ CARNETS + QR -->
<table width="100%" cellspacing="0" cellpadding="0" style="margin-top:5px;">
    <tr>
        <!-- Carnet Frontal -->
        <td style="width:290px; height:182px; border:2px solid #127481; font-size:9px; vertical-align:top; position:relative; overflow:hidden;">
            <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:100%; height:100%; top:0; left:0; opacity:0.07;"/>
            <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.6cm; height:1.1cm; top:2px; left:5px; opacity:0.45;"/>
            <table style="text-align:center; width:100%; margin-top:8px;">
                <!-- N° esquina superior derecha -->
                <tr>
                    <th colspan="3" style="text-align:right; padding:4px 8px 0 0; white-space:nowrap; font-weight:normal;">
                        <strong style="font-size:9px;">N° {{ $poliza->nro_contrato }}</strong>
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
                @if(($bien['tipo'] ?? null) === 'vehiculo')
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
                @elseif(!empty($bien['tipo']))
                @php $attrsCarnet = array_slice(collect($attrs)->filter(fn($v) => $v !== null && $v !== '')->all(), 0, 6, true); @endphp
                <!-- BIEN ASEGURADO (no vehículo) -->
                <tr><th colspan="3" style="font-size:9px; padding:2px 6px;">BIEN ASEGURADO — {{ strtoupper(str_replace('_', ' ', $bien['tipo'])) }}</th></tr>
                @foreach(array_chunk(array_keys($attrsCarnet), 3) as $grupoCarnet)
                <tr>
                    @foreach($grupoCarnet as $k)
                    <th style="font-size:8px; padding:1px 4px;">{{ strtoupper(str_replace('_', ' ', $k)) }}</th>
                    @endforeach
                </tr>
                <tr>
                    @foreach($grupoCarnet as $k)
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ strtoupper((string) $attrsCarnet[$k]) }}</td>
                    @endforeach
                </tr>
                @endforeach
                @endif
            </table>
        </td>

        <td style="width:14px;"></td>

        <!-- Carnet Reverso: EMISIÓN | QR | VENCIMIENTO -->
        <td style="width:290px; height:182px; border:2px solid #127481; font-size:9px; vertical-align:top; position:relative; overflow:hidden;">
            <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:100%; height:100%; top:0; left:0; opacity:0.07;"/>
            <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.6cm; height:1.1cm; top:2px; left:5px; opacity:0.45;"/>
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:15px;">
                <!-- Providencia -->
                <tr>
                    <td colspan="3" style="font-size:7px; padding:2px 8px 4px; line-height:1.35; text-align:center;">
                        <strong>Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-09-0138-2025 de fecha 21/02/2025.</strong>
                    </td>
                </tr>
                <!-- EMISIÓN | QR | VENCIMIENTO -->
                <tr>
                    <td style="width:80px; text-align:center; vertical-align:middle; padding:4px 3px;">
                        <div style="font-size:8.5px; font-weight:bold;">EMISIÓN</div>
                        <div style="font-size:9px; font-weight:600; white-space:nowrap;">{{ $poliza->fecha_emision?->format('d-m-Y') }}</div>
                    </td>
                    <td style="width:130px; text-align:center; vertical-align:middle; padding:2px 4px;">
                        @if($qrCode)
                        <img src="{{ $qrCode }}" style="width:78px; height:78px; display:block; margin:0 auto;" alt="QR"/>
                        @else
                        <div style="width:78px; height:78px; border:1px dashed #aaa; margin:0 auto; display:flex; align-items:center; justify-content:center;">
                            <span style="font-size:7px; color:#888; word-break:break-all; padding:4px;">Verificar póliza</span>
                        </div>
                        @endif
                    </td>
                    <td style="width:80px; text-align:center; vertical-align:middle; padding:4px 3px;">
                        <div style="font-size:8.5px; font-weight:bold;">VENCIMIENTO</div>
                        <div style="font-size:9px; font-weight:600; white-space:nowrap;">{{ $poliza->fecha_vencimiento?->format('d-m-Y') }}</div>
                    </td>
                </tr>
                <!-- Contacto siniestros -->
                <tr>
                    <td colspan="3" style="text-align:center; padding:4px 4px 2px;">
                        <div style="font-weight:bold; font-size:8.5px;">Reportes y/o Siniestros</div>
                        <div style="font-weight:bold; font-size:8.5px;">0414-8299562 / 0414-3169371</div>
                    </td>
                </tr>
            </table>
        </td>
    </tr>
</table>

</body>
</html>
