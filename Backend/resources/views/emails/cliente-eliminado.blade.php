@extends('emails.layout')
@section('title', 'Cuenta eliminada — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#f1f5f9;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">🗑️</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Cuenta eliminada
</h1>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>, le informamos que su expediente ha sido
  eliminado de nuestro sistema de LA VENEZOLANA DE SEGUROS Y VIDA C.A..
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">Nombre</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $nombre }}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Cédula / RIF</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $cedula }}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Fecha</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">{{ $fecha }}</td>
      </tr>
    </table>
  </td></tr>
</table>

<div style="background:#fef3c7;border:1px solid #fde68a;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#92400e;line-height:1.6;">
    Si cree que esto fue un error o necesita más información, no dude en contactarnos.
  </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20me%20contacto%20desde%20La%20Venezolana."
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Contactar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
