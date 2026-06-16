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

    $marca   = strtoupper($attrs['marca']  ?? '—');
    $modelo  = strtoupper($attrs['modelo'] ?? '—');
    $anio    = $attrs['anio']              ?? '—';
    $placa   = strtoupper($attrs['placa']  ?? '—');
    $color   = strtoupper($attrs['color']  ?? '—');
    $uso     = strtoupper($attrs['uso']    ?? '—');
    $serCar  = strtoupper($attrs['serial_carroceria'] ?? ($attrs['serialCarroceria'] ?? '-'));
    $serMot  = strtoupper($attrs['serial_motor']      ?? ($attrs['serialMotor']      ?? '-'));
    $puestos = $attrs['puestos'] ?? '-';
    $clase   = strtoupper($attrs['clase']  ?? ($attrs['tipo'] ?? '-'));

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

    $imgLogon  = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logon.jpg')));
    $imgIcono  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/icono.png')));
    $imgCarnet = 'data:image/jpeg;base64,' . base64_encode(file_get_contents(public_path('images/logocarnet.jpg')));
    $imgFirma  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/firma.png')));
    $imgSello  = 'data:image/png;base64,'  . base64_encode(file_get_contents(public_path('images/sello.png')));
@endphp

<style>
    @page { margin: 0cm 0cm; font-family: arial, "sans-serif"; font-size: 11px; }
    body  { margin-top: 0.5cm; margin-bottom: 0cm; margin-left: 1cm; margin-right: 1.2cm; }

    .center { text-align: center; }
    .center h1, .center h3 { margin: 0; }

    /* Cuadro número de póliza */
    .cuadro table { border: 1px solid black; border-collapse: collapse; width: 100%; }
    .cuadro td    { border: 1px solid black; text-align: center; text-transform: uppercase; }

    .linea {
        text-align: center; border: 1px solid black;
        background: rgb(18, 116, 129); padding: 3.5px 0;
        text-transform: uppercase; color: white; font-size: 12.2px;
    }
    .titu, .titu td { font-size: 10px; border: 1px solid black; border-bottom: none; }
    .titu2 th       { border: 1px solid black; border-top: none; text-align: left; padding: 1.5px 1.8px; }

    /* Línea de firma */
    .lineaf { border-top: 1px solid black; height: 2px; max-width: 200px; padding: 0; margin: 3px auto 2px auto; }

</style>

<body>
    <!-- Encabezado: logo | título | cuadro póliza — en la misma fila horizontal -->
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-top: 6px;">
        <tr>
            <!-- Logo La Venezolana -->
            <td style="width: 3.8cm; vertical-align: middle;">
                <img src="{{ $imgLogon }}" style="width: 3.8cm; height: 2.5cm;" alt="logo"/>
            </td>
            <!-- Título centrado -->
            <td style="text-align: center; vertical-align: middle;">
                <strong style="font-size: 1.7rem;">Cuadro Póliza - Recibo de Prima</strong><br/>
                <span style="font-size: 1.2rem;">Automóvil - Individual</span>
            </td>
            <!-- Cuadro número de póliza -->
            <td style="width: 175px; vertical-align: top;">
                <div class="cuadro">
                    <table>
                        <tr><td style="text-align:right;">Póliza:</td>       <td><strong>{{ $poliza->nro_contrato }}</strong></td></tr>
                        <tr><td style="text-align:right;">Certificado:</td>   <td><strong>{{ $asegCi }}</strong></td></tr>
                        <tr><td style="text-align:right;">Fecha:</td>         <td><strong>{{ $poliza->fecha_emision?->format('d-m-Y') }}</strong></td></tr>
                        <tr><td style="text-align:right;">Páginas</td>        <td><strong>1</strong></td></tr>
                        <tr><td style="text-align:right;">Inicio Póliza</td>  <td><strong>{{ $poliza->fecha_emision?->format('Y') }}</strong></td></tr>
                    </table>
                </div>
            </td>
        </tr>
    </table>

    <div>

        <!-- Contenido principal -->
        <div class="tomador">
            <table class="person" style="margin-top:10px;" width="100%" cellspacing="0">
                <tr><th colspan="2" class="linea">Datos del Tomador y Asegurado</th></tr>
                <tr class="titu">
                    <td style="width:70%;">Tomador:</td><td style="width:30%;">C.I. / RIF</td>
                </tr>
                <tr class="titu2">
                    <th style="width:70%;">{{ $tomadorNombre }}</th>
                    <th style="width:30%; text-align:center;">{{ $tomadorCi }}</th>
                </tr>
                <tr class="titu">
                    <td style="width:70%;">Asegurado:</td><td style="width:30%;">C.I. / RIF</td>
                </tr>
                <tr class="titu2">
                    <th style="width:70%;">{{ $asegNombre }}</th>
                    <th style="width:30%; text-align:center;">{{ $asegCi }}</th>
                </tr>
                <tr class="titu">
                    <td style="width:70%;">Dirección:</td><td style="width:30%;">Teléfonos</td>
                </tr>
                <tr class="titu2">
                    <th style="width:70%;">{{ $poliza->sede_poliza }}</th>
                    <th style="width:30%; text-align:center;">0414-8299562</th>
                </tr>
            </table>

            <table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
                <tr><th colspan="3" class="linea">Datos de la Póliza</th></tr>
                <tr class="titu"><td colspan="2">Vigencia:</td><td>Moneda</td></tr>
                <tr class="titu2">
                    <th colspan="2">
                        &nbsp;&nbsp;&nbsp;&nbsp;Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hasta: {{ $poliza->fecha_vencimiento?->format('d-m-Y') }}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hora: {{ now()->format('H:i') }}
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
                    <th style="border:none; border-bottom:1px solid black;">DIRECTO/INTERMEDIARIO</th>
                    <th>ANUAL</th>
                </tr>
                <tr class="titu"><td colspan="2">Código de los Intermediarios</td><td>Participación</td></tr>
                <tr class="titu2">
                    <th style="border-right:none;">4620</th>
                    <th style="border:none; border-bottom:1px solid black; text-transform:uppercase;">FRANKLIN ESPAÑOL BASTARDO</th>
                    <th>100%</th>
                </tr>
            </table>

            <table class="person" style="margin-top:5px;" width="100%" cellspacing="0">
                <tr><th colspan="4" class="linea">Datos del Recibo</th></tr>
                <tr class="titu"><td colspan="3">Vigencia:</td><td>Tipo de Movimiento</td></tr>
                <tr class="titu2">
                    <th colspan="3">
                        Desde: {{ $poliza->fecha_emision?->format('d-m-Y') }}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hasta: {{ $poliza->fecha_vencimiento?->format('d-m-Y') }}
                        &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Hora: {{ now()->format('H:i') }}
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
                    <th style="border:none; border-bottom:1px solid black;">DIRECTO/INTERMEDIARIO</th>
                    <th>ANUAL</th>
                    <th>{{ number_format((float)$poliza->total, 2) }}</th>
                </tr>
            </table>

            <table class="planaso" style="margin-top:5px;" width="100%" cellspacing="0">
                <tr><th colspan="6" class="linea">Planes Asociados</th></tr>
                <tr class="titu2">
                    <td colspan="6" style="border:1px solid black;">
                        Producto: <strong>{{ $prodSnap['nombre'] ?? $poliza->producto?->nombre ?? '—' }}</strong>
                        @if(!empty($cobs['tarifa']['nombre']))
                            &nbsp;|&nbsp; Plan: <strong>{{ $cobs['tarifa']['nombre'] }}</strong>
                        @endif
                    </td>
                </tr>
                <tr><th colspan="6" class="linea">Datos del Vehículo</th></tr>
                <tr>
                    <td style="width:13%; text-align:right; border-left:1px solid black;">Marca:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $marca }}</strong></td>
                    <td style="width:13%; text-align:right;">Modelo:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $modelo }}</strong></td>
                    <td style="width:13%; text-align:right;">Num. Pasajeros:</td>
                    <td style="border-right:1px solid black;"><strong>&nbsp;&nbsp;&nbsp;{{ $puestos }}</strong></td>
                </tr>
                <tr>
                    <td style="width:13%; text-align:right; border-left:1px solid black;">Versión:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;A INDICAR</strong></td>
                    <td style="width:13%; text-align:right;">Año:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $anio }}</strong></td>
                    <td style="width:13%; text-align:right;">Tipo de Vehículo:</td>
                    <td style="border-right:1px solid black;"><strong>&nbsp;&nbsp;&nbsp;{{ $clase }}</strong></td>
                </tr>
                <tr>
                    <td style="width:13%; text-align:right; border-left:1px solid black;">Placa:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $placa }}</strong></td>
                    <td style="width:13%; text-align:right;">Serial Motor:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $serMot }}</strong></td>
                    <td style="width:13%; text-align:right;">Uso:</td>
                    <td style="border-right:1px solid black;"><strong>&nbsp;&nbsp;&nbsp;{{ $uso }}</strong></td>
                </tr>
                <tr>
                    <td style="width:13%; text-align:right; border-left:1px solid black;">Color:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $color }}</strong></td>
                    <td style="width:13%; text-align:right;">Serial Carrocería:</td>
                    <td><strong>&nbsp;&nbsp;&nbsp;{{ $serCar }}</strong></td>
                    <td style="width:13%; text-align:right;">Otros:</td>
                    <td style="border-right:1px solid black;"><strong>&nbsp;&nbsp;&nbsp;-</strong></td>
                </tr>

                <tr><th colspan="6" class="linea">Coberturas</th></tr>

                @foreach($cobertura_items as $item)
                <tr>
                    <td style="width:30%; text-align:right; border-left:1px solid black;" colspan="2">{{ $item[0] }}:</td>
                    <td colspan="4" style="border-right:1px solid black;" align="left">
                        <strong>&nbsp;&nbsp;&nbsp;$ {{ $item[1] }}</strong>
                    </td>
                </tr>
                @endforeach

                <tr>
                    <td style="width:30%; text-align:right; border-left:1px solid black; border-bottom:1px solid black;" colspan="2">Prima Neta:</td>
                    <td style="border-bottom:1px solid black;" align="center"><strong>$ {{ number_format((float)($cobs['subtotal'] ?? $poliza->total), 2) }}</strong></td>
                    @if(($cobs['iva'] ?? 0) > 0)
                    <td style="border-bottom:1px solid black; text-align:right;">IVA:</td>
                    <td style="border-bottom:1px solid black; border-right:1px solid black;" colspan="2" align="center"><strong>$ {{ number_format((float)$cobs['iva'], 2) }}</strong></td>
                    @else
                    <td colspan="3" style="border-bottom:1px solid black; border-right:1px solid black;"></td>
                    @endif
                </tr>
                <tr>
                    <td style="padding-top:6px; font-size:8px;" colspan="6">
                        El presente documento será entregado a El Tomador conjuntamente con las Condiciones Generales, Condiciones Particulares, anexos y demás documentos que formen parte de la póliza.
                    </td>
                </tr>
                <tr>
                    <td style="padding-top:8px; font-size:8px;" colspan="6">
                        Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-01-0512-2024
                    </td>
                </tr>
            </table>

            <table width="100%" border="0" cellspacing="0" style="margin-top:4px;">
                <tr>
                    <td width="50%" style="text-align:center; vertical-align:bottom; padding:2px 4px;">
                        <div class="lineaf"></div>
                        <span style="font-size:9px;">{{ $tomadorNombre }}</span>
                    </td>
                    <td width="50%" style="text-align:center; vertical-align:bottom; padding:2px 4px;">
                        <img src="{{ $imgFirma }}" style="width:2.5cm; height:1.2cm; vertical-align:bottom;" alt="firma"/>
                        <img src="{{ $imgSello }}" style="width:3.5cm; height:1.9cm; vertical-align:bottom;" alt="sello"/>
                        <div class="lineaf"></div>
                        <span style="font-size:9px;">Por la Venezolana de Seguros y Vida, C.A.</span>
                    </td>
                </tr>
            </table>

            <table style="margin-top:10px; border:1px solid black;" width="100%" border="0" align="center" cellspacing="0">
                <tr>
                    <td style="padding:4.8px 1.8px; font-size:8px;">
                        Inscrita en el registro mercantil segundo de la circunscripción judicial del Distrito Federal y estado Miranda, en fecha 21/04/1955, bajo el numero 70 tomo 4 A-SGDO.E Inscrita en la Superintendencia de la Actividad Aseguradora bajo el Nº40. Miembro de la Camara Aseguradores de Venezuela. Dirección: Av. Madrid con Av. Jalisco Edf. La Venezolana de Seguros, Las Mercedes-Baruta, Caracas-Venezuela. Telf. (0212) 9094848  Fax (0212) 9094898
                    </td>
                </tr>
            </table>
        </div><!-- /tomador -->
    </div><!-- /hoja -->
    
    <!--
        Carnets + QR.
        Contenedor position:relative → QR absolute en la esquina derecha,
        superpuesto sobre el borde derecho del carnet2 (mismo efecto visual del sistema viejo).
    -->
    <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:10px;">
        <tr>
            <!-- Carnet 1 -->
            <td style="width:302px; height:159px; border:1px solid black; font-size:8px; vertical-align:top; position:relative; overflow:hidden;">
                <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:7.9cm; height:4.2cm; top:0; left:3px; opacity:0.7;"/>
                <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.5cm; height:1cm;   top:2px; left:5px; opacity:0.5;"/>
                <table style="text-align:center; width:100%;">
                    <!-- Etiqueta Certificado en flujo normal -->
                    <tr><th colspan="3">
                        <p style="margin-top:5px; margin-bottom:2px; margin-left:3.2cm; font-family:Candara;">
                            <strong style="font-size:15px;">Certificado</strong>
                            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
                            <strong style="font-size:12px;">N° {{ $poliza->nro_contrato }}</strong>
                        </p>
                    </th></tr>
                    <tr><th colspan="3">DATOS DEL ASEGURADO</th></tr>
                    <tr><th>Asegurado</th><th>C.I / RIF</th><th>Teléfono</th></tr>
                    <tr>
                        <td>{{ $asegNombre }}</td>
                        <td>{{ $asegCi }}</td>
                        <td>0414-8299562</td>
                    </tr>
                    <tr><th colspan="3">VEHÍCULO ASEGURADO</th></tr>
                    <tr><th>MARCA</th><th>MODELO</th><th>PLACA</th></tr>
                    <tr>
                        <td>{{ $marca }}</td>
                        <td>{{ $modelo }}</td>
                        <td>{{ $placa }}</td>
                    </tr>
                    <tr><th>COLOR</th><th>SERIAL CARROCERÍA</th><th>AÑO</th></tr>
                    <tr>
                        <td>{{ $color }}</td>
                        <td>{{ $serCar }}</td>
                        <td>{{ $anio }}</td>
                    </tr>
                </table>
            </td>

            <td style="width:8px;"></td>

            <!-- Carnet 2 -->
            <td style="width:302px; height:159px; border:1px solid black; font-size:8px; vertical-align:top; position:relative; overflow:hidden;">
                <img src="{{ $imgCarnet }}" style="position:absolute; z-index:-1; width:7.9cm; height:4.2cm; top:0; left:3px; opacity:0.7;"/>
                <img src="{{ $imgIcono }}"  style="position:absolute; z-index:-1; width:1.5cm; height:1cm;   top:2px; left:5px; opacity:0.5;"/>
                <table style="margin-top:8px; text-align:center; width:100%;">
                    <tr>
                        <td colspan="2" style="font-size:7px; padding:2px;">
                            <strong>Aprobado por la Superintendencia de la Actividad Aseguradora mediante PROVIDENCIA ADMINISTRATIVA N° SAA-01-0512-2024</strong>
                        </td>
                    </tr>
                </table>
                <table style="margin-top:55px; text-align:center; width:100%;">
                    <tr><th width="53%">EMISIÓN</th><th width="47%">VENCIMIENTO</th></tr>
                    <tr>
                        <td>{{ $poliza->fecha_emision?->format('d-m-Y') }}</td>
                        <td>{{ $poliza->fecha_vencimiento?->format('d-m-Y') }}</td>
                    </tr>
                    <tr><th colspan="2">Reportes y/o Siniestros</th></tr>
                    <tr><th colspan="2">0414-8299562 / 0414-3169371</th></tr>
                </table>
            </td>

            <!-- QR -->
            <td style="vertical-align:middle; text-align:center; padding-left:6px;">
                <div style="width:108px; height:108px;">{!! $qrCode !!}</div>
            </td>
        </tr>
    </table>

</body>
</html>
