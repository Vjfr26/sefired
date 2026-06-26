@extends('emails.layout')
@section('title', 'Actualización de datos — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#fff7ed;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      {{ $esCambioCorreo ? '📧' : '📋' }}
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  {{ $esCambioCorreo ? 'Se cambió el correo electrónico de su cuenta' : 'Sus datos han sido actualizados' }}
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>,<br>
  @if($esCambioCorreo)
    el correo electrónico asociado a su cuenta en LA VENEZOLANA DE SEGUROS Y VIDA C.A. fue modificado.
  @else
    le informamos que la siguiente información de su expediente fue actualizada.
  @endif
</p>

{{-- Detalle de cambios --}}
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
      Cambios realizados
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach($cambios as $campo => $valores)
      <tr>
        <td style="padding:7px 0;font-size:13px;color:#94a3b8;width:38%;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          {{ $campo }}
        </td>
        <td style="padding:7px 0;font-size:13px;color:#94a3b8;width:27%;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          <span style="text-decoration:line-through;">{{ $valores['anterior'] ?: '—' }}</span>
        </td>
        <td style="padding:7px 0;font-size:13px;font-weight:700;color:#059669;width:35%;border-bottom:1px solid #f1f5f9;vertical-align:top;">
          → {{ $valores['nuevo'] ?: '—' }}
        </td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

@if($esCambioCorreo)
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px 18px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#991b1b;line-height:1.6;">
    <strong>⚠️ Aviso de seguridad:</strong> si usted no realizó este cambio, comuníquese
    con LA VENEZOLANA DE SEGUROS Y VIDA C.A. de inmediato para proteger su cuenta.
  </p>
</div>
@endif

<p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-align:center;">
  Actualizado el {{ $fechaCambio }}
</p>
<p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
  Si no reconoce este cambio, contáctenos de inmediato.
</p>
@endsection
