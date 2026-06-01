@extends('emails.layout')
@section('title', 'Recordatorio de Renovación — J&M Seguros')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:{{ $diasRestantes <= 0 ? '#fef2f2' : '#fffbeb' }};border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      {{ $diasRestantes <= 0 ? '⚠️' : '🔔' }}
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  @if($diasRestantes <= 0)
    Su póliza ha vencido
  @elseif($diasRestantes === 1)
    Su póliza vence hoy
  @else
    Su póliza vence en {{ $diasRestantes }} días
  @endif
</h1>

<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $tomadorNombre }}</strong>,<br>
  @if($diasRestantes <= 0)
    su póliza <strong>{{ $nroContrato }}</strong> venció el <strong>{{ $fechaVencimiento }}</strong>.<br>
    Contáctenos para renovarla y mantener su cobertura vigente.
  @else
    le recordamos que su póliza <strong>{{ $nroContrato }}</strong> vence el <strong>{{ $fechaVencimiento }}</strong>.
  @endif
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['Póliza',        $nroContrato],
        ['Producto',      $producto],
        ['Bien asegurado',$bienRef],
        ['Vencimiento',   $fechaVencimiento],
        ['Prima anterior','$' . $primaDolares . ' USD'],
      ] as $row)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">{{ $row[0] }}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $row[1] }}</td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20deseo%20renovar%20mi%20p%C3%B3liza%20en%20J%26M%20Seguros."
       style="display:inline-block;background:#25d366;color:#fff;
              font-size:14px;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;">
      Renovar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
