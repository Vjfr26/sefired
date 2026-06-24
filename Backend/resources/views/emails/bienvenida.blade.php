@extends('emails.layout')
@section('title', 'Bienvenido/a — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#f0fdf4;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">🤝</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  ¡Bienvenido/a a J&amp;M Seguros!
</h1>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>, nos complace tenerle como cliente.<br>
  Su expediente ha sido registrado exitosamente en nuestro sistema.
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">Código de cliente</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">CLI-{{ str_pad($clienteId, 4, '0', STR_PAD_LEFT) }}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;border-bottom:1px solid #f1f5f9;">Nombre</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $nombre }}</td>
      </tr>
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;">Cédula / RIF</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;">{{ $cedula }}</td>
      </tr>
    </table>
  </td></tr>
</table>

<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#166534;line-height:1.6;">
    <strong>¿Qué sigue?</strong><br>
    Nuestro equipo le contactará para asesorarle sobre las coberturas disponibles para usted.
    Puede comunicarse con nosotros en cualquier momento.
  </p>
</div>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20me%20comunico%20desde%20J%26M%20Seguros."
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Contactar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
