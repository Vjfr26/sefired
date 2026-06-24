@extends('emails.layout')
@section('title', 'Ya estás en nuestro sistema — La Venezolana de Seguros y Vida')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#eff6ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">🔎</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  @if($tienePoliza)
    ¡Ya tienes una póliza activa!
  @else
    ¡Ya estás en nuestro sistema!
  @endif
</h1>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Hola <strong>{{ $nombre }}</strong>, verificamos tu cédula y/o correo en nuestros registros.
</p>

<div style="background:{{ $tienePoliza ? '#eff6ff' : '#f8fafc' }};border:1px solid {{ $tienePoliza ? '#bfdbfe' : '#e2e8f0' }};border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:{{ $tienePoliza ? '#1e40af' : '#475569' }};line-height:1.6;">
    @if($tienePoliza)
      Cuentas con una <strong>póliza activa</strong> con nosotros. Si deseas renovarla, agregar
      cobertura o hacer cualquier ajuste, un asesor puede atenderte directamente.
    @else
      Ya tenemos tus datos registrados. No fue necesario crear una solicitud nueva — un asesor
      puede ayudarte a cotizar un seguro adicional cuando lo necesites.
    @endif
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
