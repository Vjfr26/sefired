<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Póliza {{ $poliza->nro_contrato }}</title>
</head>

@php
    $snap        = $poliza->snapshot_datos ?? [];
    $tomador     = $snap['tomador']    ?? [];
    $asegurado   = $snap['asegurado']  ?? [];
    $prodSnap    = $snap['producto']   ?? [];
    $bien        = $snap['bien']       ?? [];
    $attrs       = $bien['atributos']  ?? [];
    $cobs        = $snap['coberturas'] ?? [];
    $tipoCal     = $prodSnap['tipo_calculo'] ?? 'fijo';
    $tarifaDatos = $cobs['tarifa']['datos'] ?? ($snap['tarifario']['datos'] ?? []);

    $tomadorNombre = $tomador['nombre']   ?? ($poliza->asegurado_nombre ?? '—');
    $tomadorCi     = $tomador['ci']       ?? ($poliza->asegurado_ci     ?? '—');
    $asegNombre    = $asegurado['nombre'] ?? ($poliza->asegurado_nombre ?? $tomadorNombre);
    $asegCi        = $asegurado['ci']     ?? ($poliza->asegurado_ci     ?? $tomadorCi);

    // Teléfono: del snapshot (pólizas futuras con campo) o de la relación persona
    $persona    = $poliza->solicitud?->persona;
    $tomadorTel = $tomador['telefono'] ?? ($persona?->celular ?? ($persona?->telefono ?? '—'));

    // Vendedor / intermediario desde la relación cargada
    $vendedorNombre = strtoupper($poliza->vendedor?->nombre ?? '—');
    $vendedorCodigo = $poliza->vendedor?->nro_sede ?? '—';

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
        $cobertura_items[] = ['Responsabilidad Civil Obligatoria', number_format((float)$poliza->cobertura_dolares, 2)];
    } elseif ($tipoCal === 'por_plan' && is_array($tarifaDatos)) {
        foreach (['muerte_accidental'=>'Muerte Accidental','invalidez'=>'Invalidez Permanente','medicos'=>'Gastos Médicos','funerarios'=>'Funerarios'] as $key => $label) {
            if (isset($tarifaDatos[$key]['suma'])) {
                $cobertura_items[] = [$label, number_format((float)$tarifaDatos[$key]['suma'], 2)];
            }
        }
    } elseif ($tipoCal === 'fijo' && is_array($tarifaDatos)) {
        if (!empty($tarifaDatos['suma_persona'])) $cobertura_items[] = ['Suma por Persona', number_format((float)$tarifaDatos['suma_persona'], 2)];
        if (!empty($tarifaDatos['suma_cosa']))    $cobertura_items[] = ['Suma por Cosa',    number_format((float)$tarifaDatos['suma_cosa'],   2)];
    } elseif ($tipoCal === 'por_nivel' && is_array($tarifaDatos)) {
        if (!empty($tarifaDatos['suma'])) $cobertura_items[] = [$tarifaDatos['nivel'] ?? 'Suma Asegurada', number_format((float)$tarifaDatos['suma'], 2)];
    }

    $tasaEmision    = (float) ($poliza->tasa_emision     ?? $snap['tasa_emision']     ?? 0);
    $tasaEmisionEur = (float) ($poliza->tasa_emision_eur ?? $snap['tasa_emision_eur'] ?? 0);
    $monedaPago     = $poliza->moneda ?? $snap['moneda'] ?? 'USD';

    $imgLogon  = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logon.jpg')));
    $imgIcono  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/icono.png')));
    $imgCarnet = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logocarnet.jpg')));
    $imgFirma  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/firma.png')));
    $imgSello  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/sello.png')));
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
            <span style="font-size:12px; color:#444;">Automóvil · {{ $poliza->tipo ?? 'Individual' }}</span>
        </td>
        <td style="width:190px; vertical-align:top;">
            <div class="cuadro">
                <table>
                    <tr><td>Póliza:</td>       <td><strong>{{ $poliza->nro_contrato }}</strong></td></tr>
                    <tr><td>Certificado:</td>   <td><strong>{{ $asegCi }}</strong></td></tr>
                    <tr><td>Fecha:</td>         <td><strong>{{ $poliza->fecha_emision?->format('d-m-Y') }}</strong></td></tr>
                    <tr><td>Páginas:</td>       <td><strong>1</strong></td></tr>
                    <tr><td>Inicio Póliza:</td> <td><strong>{{ $poliza->fecha_emision?->format('Y') }}</strong></td></tr>
                </table>
            </div>
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
        <td>Asegurado:</td><td>C.I. / RIF</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $asegNombre }}</th>
        <th style="width:30%; text-align:center;">{{ $asegCi }}</th>
    </tr>
    <tr class="titu">
        <td>Dirección / Sede:</td><td>Teléfono</td>
    </tr>
    <tr class="titu2">
        <th style="width:70%;">{{ $poliza->sede_poliza }}</th>
        <th style="width:30%; text-align:center;">{{ $tomadorTel }}</th>
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
        <th>DÓLARES</th>
    </tr>
    <tr class="titu">
        <td style="border-right:none;">Sucursal de Cobro:</td>
        <td style="border:none;">Canal de Venta</td>
        <td>Frecuencia de Pago</td>
    </tr>
    <tr class="titu2">
        <th style="border-right:none;">{{ $poliza->sede_poliza }}</th>
        <th style="border:none; border-bottom:1px solid #888;">DIRECTO/INTERMEDIARIO</th>
        <th>ANUAL</th>
    </tr>
    <tr class="titu"><td colspan="2">Código del Intermediario</td><td>Participación</td></tr>
    <tr class="titu2">
        <th style="border-right:none;">{{ $vendedorCodigo }}</th>
        <th style="border:none; border-bottom:1px solid #888; text-transform:uppercase;">{{ $vendedorNombre }}</th>
        <th>100%</th>
    </tr>
</table>

<!-- ════════════════════════════════════════════════ DATOS RECIBO -->
<table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
    <tr><th colspan="4" class="linea">Datos del Recibo</th></tr>
    <tr class="titu"><td colspan="3">Vigencia:</td><td>Tipo de Movimiento</td></tr>
    <tr class="titu2">
        <th colspan="3">
            &nbsp;&nbsp;&nbsp;Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hasta: {{ $poliza->fecha_vencimiento?->format('d-m-Y') }}
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hora: {{ now()->format('H:i') }}
        </th>
        <th>EMISIÓN / ALTA</th>
    </tr>
    <tr class="titu">
        <td style="border-right:none;">Sucursal de Oficina:</td>
        <td style="border:none;">Canal de Venta</td>
        <td>Frecuencia de Pago</td>
        <td>Total a Cobrar</td>
    </tr>
    <tr class="titu2">
        <th style="border-right:none;">{{ $poliza->sede_poliza }}</th>
        <th style="border:none; border-bottom:1px solid #888;">DIRECTO/INTERMEDIARIO</th>
        <th>ANUAL</th>
        <th>$ {{ number_format((float)$poliza->total, 2) }}</th>
    </tr>
    <tr class="titu">
        <td>Forma de Pago / Moneda</td>
        <td>Tasa BCV Bs./USD</td>
        <td>Tasa BCV Bs./EUR</td>
        <td>Total en Bolívares</td>
    </tr>
    <tr class="titu2">
        <th>{{ $poliza->pago }} / {{ $monedaPago }}</th>
        <th>@if($tasaEmision > 1) Bs. {{ number_format($tasaEmision, 4) }} @else — @endif</th>
        <th>@if($tasaEmisionEur > 1) Bs. {{ number_format($tasaEmisionEur, 4) }} @else — @endif</th>
        <th>Bs. {{ number_format((float)$poliza->total_bs, 2) }}</th>
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
        <td style="border-right:1px solid #888; padding:3px 5px; border-bottom:1px solid #888;"><strong>—</strong></td>
    </tr>

    <tr><th colspan="6" class="linea">Coberturas</th></tr>
    @foreach($cobertura_items as $item)
    <tr>
        <td style="text-align:right; border-left:1px solid #888; padding:1.5px 4px; color:#555; font-size:9px;" colspan="2">{{ $item[0] }}:</td>
        <td colspan="4" style="border-right:1px solid #888; padding:3px 6px;">
            <strong>$ {{ $item[1] }}</strong>
        </td>
    </tr>
    @endforeach

    <tr>
        <td style="text-align:right; border-left:1px solid #888; border-bottom:1px solid #888; padding:1.5px 4px; color:#555; font-size:9px;" colspan="2">Prima Neta:</td>
        <td style="border-bottom:1px solid #888; padding:1.5px 4px;" align="center"><strong>$ {{ number_format((float)($cobs['subtotal'] ?? $poliza->total), 2) }}</strong></td>
        @if(($cobs['iva'] ?? 0) > 0)
        <td style="border-bottom:1px solid #888; text-align:right; padding:3px 5px; color:#555; font-size:9px;">IVA:</td>
        <td style="border-bottom:1px solid #888; border-right:1px solid #888; padding:3px 5px;" colspan="2" align="center"><strong>$ {{ number_format((float)$cobs['iva'], 2) }}</strong></td>
        @else
        <td colspan="3" style="border-bottom:1px solid #888; border-right:1px solid #888;"></td>
        @endif
    </tr>

    <tr>
        <td style="padding:3px 5px 1px; font-size:8px; color:#555;" colspan="6">
            El presente documento será entregado a El Tomador conjuntamente con las Condiciones Generales, Condiciones Particulares, anexos y demás documentos que formen parte de la póliza.
        </td>
    </tr>
    <tr>
        <td style="padding:1px 5px 3px; font-size:8px; color:#555;" colspan="6">
            Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-01-0512-2024
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
            <img src="{{ $imgFirma }}" style="width:2.2cm; height:1cm; vertical-align:bottom;" alt="firma"/>
            <img src="{{ $imgSello }}" style="width:3.5cm; height:1.7cm; vertical-align:bottom;" alt="sello"/>
            <div class="lineaf"></div>
            <span style="font-size:9px; color:#333;">Por la Venezolana de Seguros y Vida, C.A.</span>
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
            <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:100%; height:100%; top:0; left:0; opacity:0.65;"/>
            <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.6cm; height:1.1cm; top:2px; left:5px; opacity:0.45;"/>
            <table style="text-align:center; width:100%; margin-top:8px;">
                <!-- N° esquina superior derecha -->
                <tr>
                    <th colspan="3" style="text-align:right; padding:4px 8px 0 0; white-space:nowrap; font-weight:normal;">
                        <strong style="font-size:9px;">N° {{ $poliza->nro_contrato }}</strong>
                    </th>
                </tr>
                <!-- Certificado centrado -->
                <tr>
                    <th colspan="3" style="text-align:center; padding:3px 0 5px;">
                        <strong style="font-size:15px;">Certificado</strong>
                    </th>
                </tr>
                <!-- DATOS DEL ASEGURADO -->
                <tr><th colspan="3" style="font-size:9px; padding:2px 6px;">DATOS DEL ASEGURADO</th></tr>
                <tr>
                    <th style="font-size:8px; padding:1px 4px;">Asegurado</th>
                    <th style="font-size:8px; padding:1px 4px;">C.I / RIF</th>
                    <th style="font-size:8px; padding:1px 4px;">Teléfono</th>
                </tr>
                <tr>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $asegNombre }}</td>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $asegCi }}</td>
                    <td style="font-size:8.5px; font-weight:600; padding:1px 4px;">{{ $tomadorTel }}</td>
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
            </table>
        </td>

        <td style="width:14px;"></td>

        <!-- Carnet Reverso: EMISIÓN | QR | VENCIMIENTO -->
        <td style="width:290px; height:182px; border:2px solid #127481; font-size:9px; vertical-align:top; position:relative; overflow:hidden;">
            <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:100%; height:100%; top:0; left:0; opacity:0.65;"/>
            <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.6cm; height:1.1cm; top:2px; left:5px; opacity:0.45;"/>
            <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:15px;">
                <!-- Providencia -->
                <tr>
                    <td colspan="3" style="font-size:7px; padding:2px 8px 4px; line-height:1.35; text-align:center;">
                        <strong>Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-01-0512-2024</strong>
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
