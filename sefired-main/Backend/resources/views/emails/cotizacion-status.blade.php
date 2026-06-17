@extends('emails.layout')
@section('title', ($aprobado ? 'Cotización aprobada' : 'Cotización rechazada') . ' — J&M Seguros')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:{{ $aprobado ? '#f0fdf4' : '#fef2f2' }};border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      {{ $aprobado ? '✅' : '❌' }}
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  {{ $aprobado ? 'Cotización aprobada' : 'Cotización rechazada' }}
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>,<br>
  @if($aprobado)
    su cotización <strong>{{ $nroCot }}</strong> ha sido <strong style="color:#059669;">aprobada</strong>.<br>
    El siguiente paso es la emisión formal de su póliza.
  @else
    lamentamos informarle que su cotización <strong>{{ $nroCot }}</strong> ha sido <strong style="color:#dc2626;">rechazada</strong>.
  @endif
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['N° de Cotización', $nroCot],
        ['Producto',         $producto],
        ['Prima estimada',   '$' . $total . ' USD'],
        ['Fecha',            $fecha],
      ] as $row)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">{{ $row[0] }}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $row[1] }}</td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

@if($observacion)
<div style="background:{{ $aprobado ? '#f0fdf4' : '#fef2f2' }};border:1px solid {{ $aprobado ? '#bbf7d0' : '#fecaca' }};border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:{{ $aprobado ? '#166534' : '#991b1b' }};text-transform:uppercase;letter-spacing:1px;">Observación</p>
  <p style="margin:0;font-size:14px;color:{{ $aprobado ? '#15803d' : '#7f1d1d' }};line-height:1.6;">{{ $observacion }}</p>
</div>
@endif

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20consulto%20sobre%20mi%20cotizaci%C3%B3n%20{{ urlencode($nroCot) }}"
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      {{ $aprobado ? 'Continuar con la emisión' : 'Consultar por WhatsApp' }}
    </a>
  </td></tr>
</table>
@endsection
