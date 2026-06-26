@extends('emails.layout')
@section('title', ($accion === 'subido' ? 'Documento subido' : 'Documento eliminado') . ' — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:{{ $accion === 'subido' ? '#f0f9ff' : '#fff7ed' }};border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      {{ $accion === 'subido' ? '📄' : '🗑️' }}
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Documento {{ $accion === 'subido' ? 'agregado a su expediente' : 'eliminado de su expediente' }}
</h1>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>, le informamos que se ha
  {{ $accion === 'subido' ? 'subido un nuevo documento a' : 'eliminado un documento de' }}
  su expediente en LA VENEZOLANA DE SEGUROS Y VIDA C.A..
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">Documento</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $docNombre }}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Acción</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ ucfirst($accion) }}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Fecha</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">{{ $fecha }}</td>
      </tr>
    </table>
  </td></tr>
</table>

@if($accion === 'eliminado')
<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#9a3412;line-height:1.6;">
    Si no solicitó esta eliminación o cree que fue un error, contáctenos de inmediato.
  </p>
</div>
@else
<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#075985;line-height:1.6;">
    Este documento forma parte de su expediente en LA VENEZOLANA DE SEGUROS Y VIDA C.A..
    Si tiene alguna duda, no dude en contactarnos.
  </p>
</div>
@endif

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20me%20contacto%20desde%20J%26M%20Seguros."
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Contactar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
