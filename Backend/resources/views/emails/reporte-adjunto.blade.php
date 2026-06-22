@extends('emails.layout')
@section('title', $nombreReporte . ' — J&M Seguros')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#eef2ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">📊</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  {{ $nombreReporte }}
</h1>
<p style="margin:0 0 20px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Adjunto encontrarás el reporte generado automáticamente el {{ $fecha }}.
</p>

<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
  <p style="margin:0;font-size:13px;color:#475569;line-height:1.6;">
    Frecuencia de envío configurada: <strong style="text-transform:capitalize;">{{ $frecuencia }}</strong>.<br>
    Si ya no deseas recibir este reporte, solicita a un administrador que te quite de la lista de
    destinatarios en el panel interno.
  </p>
</div>
@endsection
