@extends('emails.layout')
@section('title', 'Su simulación de seguro — J&M Seguros')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#f5f3ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">📊</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Su simulación de seguro
</h1>
<p style="margin:0 0 10px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $tomadorNombre }}</strong>, le enviamos el resumen<br>
  de la simulación realizada el <strong>{{ $fecha }}</strong>.
</p>
<p style="margin:0 0 24px;text-align:center;">
  <span style="display:inline-block;font-size:12px;font-weight:700;color:#475569;background:#f1f5f9;border-radius:6px;padding:4px 10px;margin-right:6px;">
    {{ $nroCotizacion }}
  </span>
  <span style="display:inline-block;font-size:12px;font-weight:700;color:#fff;background:{{ $statusColor }};border-radius:6px;padding:4px 10px;">
    {{ $statusLabel }}
  </span>
</p>

{{-- Tarjeta resultado --}}
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:24px;text-align:center;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;">
      Prima Anual Estimada
    </p>
    <p style="margin:0;font-size:36px;font-weight:900;color:#4c1d95;line-height:1.1;">
      {{ $simboloNativo }}{{ $primaPrincipal }} <span style="font-size:16px;font-weight:600;color:#7c3aed;">{{ $monedaNativa }}</span>
    </p>
  </td></tr>
</table>

{{-- Detalle del producto --}}
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
      Detalle de la Simulación
    </p>
    @if($productoDescripcion)
    <p style="margin:0 0 12px;font-size:13px;color:#64748b;line-height:1.5;">{{ $productoDescripcion }}</p>
    @endif
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['Tomador',         $tomadorNombre],
        ['Cédula / RIF',    $ciTomador],
        ['Teléfono',        $telefono],
        ['Correo',          $correoCliente],
        ['Ciudad',          $ciudad],
        ['Estado',          $estadoVe],
        ['Dirección',       $direccion],
        ['Producto',        $productoNombre],
        ['Bien asegurado',  $bienRef],
        ['Suma asegurada',  $cobertura],
      ] as $row)
      @if($row[1] && $row[1] !== '—')
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">{{ $row[0] }}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $row[1] }}</td>
      </tr>
      @endif
      @endforeach

      {{-- Coberturas incluidas --}}
      @if(!empty($coberturasDetalle))
      <tr>
        <td colspan="2" style="padding:12px 0 4px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
            Coberturas incluidas
          </p>
        </td>
      </tr>
      @foreach($coberturasDetalle as $cob)
      <tr>
        <td style="padding:5px 0 5px 12px;font-size:13px;color:#64748b;border-bottom:1px solid #f1f5f9;" colspan="2">
          ✓ {{ $cob }}
        </td>
      </tr>
      @endforeach
      @endif
    </table>
  </td></tr>
</table>

<div style="background:#fefce8;border:1px solid #fde68a;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
    <strong>⚠️ Nota:</strong> Esta simulación es una estimación referencial.
    El precio final puede variar según la evaluación de riesgos.
    Contáctenos para formalizar su cotización.
  </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20quisiera%20hablar%20sobre%20mi%20cotizaci%C3%B3n%20en%20J%26M%20Seguros."
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Hablar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
