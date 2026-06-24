@extends('emails.layout')
@section('title', 'Estado de cuenta — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:{{ $bloqueado ? '#fef2f2' : '#f0fdf4' }};border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      {{ $bloqueado ? '🔒' : '🔓' }}
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  {{ $bloqueado ? 'Cuenta suspendida' : 'Cuenta reactivada' }}
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>,<br>
  @if($bloqueado)
    su cuenta en J&amp;M Seguros ha sido <strong>suspendida temporalmente</strong>.
  @else
    su cuenta en J&amp;M Seguros ha sido <strong>reactivada</strong> exitosamente.
  @endif
</p>

@if($bloqueado && $motivo)
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#991b1b;text-transform:uppercase;letter-spacing:1px;">Motivo</p>
  <p style="margin:0;font-size:14px;color:#7f1d1d;line-height:1.6;">{{ $motivo }}</p>
</div>
@endif

<p style="margin:0 0 24px;font-size:13px;color:#64748b;text-align:center;line-height:1.6;">
  Si tiene alguna consulta, comuníquese con nuestra oficina.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20necesito%20ayuda%20con%20mi%20cuenta%20en%20J%26M%20Seguros."
       style="display:inline-block;background:#25d366;color:#fff;
              font-size:14px;font-weight:700;padding:12px 32px;border-radius:8px;text-decoration:none;">
      Contactar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
