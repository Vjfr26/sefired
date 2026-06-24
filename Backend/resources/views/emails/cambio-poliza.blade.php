@extends('emails.layout')
@section('title', 'Actualización en su póliza — La Venezolana de Seguros y Vida')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#fff7ed;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">✏️</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Actualización en su póliza
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $tomadorNombre }}</strong>, se realizó una modificación<br>
  en su póliza <strong>{{ $nroContrato }}</strong>.
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
      Cambios realizados
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach($cambios as $campo => $valores)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:40%;border-bottom:1px solid #f1f5f9;">
          {{ $campo }}
        </td>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:25%;border-bottom:1px solid #f1f5f9;">
          <span style="text-decoration:line-through;">{{ $valores['anterior'] }}</span>
        </td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#059669;border-bottom:1px solid #f1f5f9;">
          → {{ $valores['nuevo'] }}
        </td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<p style="margin:0 0 4px;font-size:13px;color:#94a3b8;text-align:center;">
  Modificado por: <strong style="color:#64748b;">{{ $modificadoPor }}</strong> · {{ $fechaCambio }}
</p>
<p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
  Si no reconoce este cambio, comuníquese con nosotros de inmediato.
</p>
@endsection
