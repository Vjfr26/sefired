@extends('emails.layout')
@section('title', 'Póliza Emitida — J&M Seguros')

@section('content')
{{-- Icono --}}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding-bottom:20px;">
      <div style="width:64px;height:64px;background:#eff6ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
        📄
      </div>
    </td>
  </tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  ¡Su póliza ha sido emitida!
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $tomadorNombre }}</strong>, su cobertura está activa.<br>
  A continuación el resumen de su póliza.
</p>

{{-- Tarjeta de datos --}}
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr>
    <td style="padding:20px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        @foreach([
          ['N° de Póliza',   $nroContrato],
          ['Producto',       $producto],
          ['Asegurado',      $aseguradoNombre],
          ['Bien asegurado', $bienRef],
          ['Vigencia',       $fechaEmision . ' → ' . $fechaVencimiento],
          ['Forma de pago',  $esMensual ? 'Mensual (12 cuotas)' : 'Pago único anual'],
          [$esMensual ? 'Prima Anual Total' : 'Prima', $simboloNativo . $primaPrincipal . ' ' . $monedaNativa],
          ...($esMensual ? [
            ['Cuota mensual (esta es la que pagó)', $simboloNativo . $cuotaMensual . ' ' . $monedaNativa],
            ['Próxima cuota',                       $proximaCuota],
          ] : []),
        ] as $row)
        <tr>
          <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">
            {{ $row[0] }}
          </td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">
            {{ $row[1] }}
          </td>
        </tr>
        @endforeach
      </table>
    </td>
  </tr>
</table>

<p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;text-align:center;">
  La póliza y el recibo correspondiente se adjuntan a este correo.
</p>

{{-- CTA --}}
<table width="100%" cellpadding="0" cellspacing="0">
  <tr>
    <td align="center" style="padding-bottom:8px;">
      <a href="{{ $verificarUrl }}"
         style="display:inline-block;background:#0ea5e9;color:#fff;font-size:14px;font-weight:700;
                padding:12px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.5px;">
        Verificar póliza en línea
      </a>
    </td>
  </tr>
</table>
@endsection
