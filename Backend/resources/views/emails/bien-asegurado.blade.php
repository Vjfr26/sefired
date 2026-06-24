@extends('emails.layout')
@section('title', ucfirst('Bien ' . $accion) . ' — La Venezolana de Seguros y Vida')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#f8fafc;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      {{ $icon }}
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  {{ ucfirst($tipo) }} {{ $accion }}
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>,<br>
  @if($accion === 'registrado')
    se ha registrado un nuevo bien asegurado en su cuenta.
  @elseif($accion === 'actualizado')
    los datos de su bien asegurado han sido actualizados.
  @else
    su bien asegurado ha sido eliminado del sistema.
  @endif
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['Tipo',        $tipo],
        ['Referencia',  $referencia],
        ['Fecha',       $fecha],
      ] as $row)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:40%;border-bottom:1px solid #f1f5f9;">{{ $row[0] }}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $row[1] }}</td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<p style="margin:0 0 24px;font-size:13px;color:#94a3b8;text-align:center;">
  Si no reconoce esta acción, comuníquese con nosotros de inmediato.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20necesito%20ayuda%20con%20mi%20bien%20asegurado"
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Contactar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
