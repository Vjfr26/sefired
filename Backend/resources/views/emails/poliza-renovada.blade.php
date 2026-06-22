@extends('emails.layout')
@section('title', 'Póliza renovada — J&M Seguros')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#eff6ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">🔄</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Póliza renovada exitosamente
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $tomadorNombre }}</strong>,<br>
  su póliza ha sido <strong>renovada</strong>. Su cobertura continúa activa por un año adicional.
</p>

{{-- Póliza nueva --}}
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:16px;">
  <tr><td style="padding:16px 24px;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Nueva póliza</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['N° de Póliza',    $nroNuevo],
        ['Bien asegurado',  $bienRef],
        ['Producto',        $producto],
        ['Inicio vigencia', $fechaEmision],
        ['Fin vigencia',    $fechaVencimiento],
        ['Forma de pago',   $esMensual ? 'Mensual (12 cuotas)' : 'Pago único anual'],
        [$esMensual ? 'Prima Anual Total' : 'Prima', '$' . $prima . ' USD'],
        ...($esMensual ? [
          ['Cuota mensual (esta es la que pagó)', '$' . $cuotaMensual . ' USD'],
          ['Próxima cuota',                       $proximaCuota],
        ] : []),
      ] as $row)
      <tr>
        <td style="padding:5px 0;font-size:13px;color:#94a3b8;width:45%;border-bottom:1px solid #f1f5f9;">{{ $row[0] }}</td>
        <td style="padding:5px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $row[1] }}</td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<p style="margin:0 0 24px;font-size:12px;color:#94a3b8;text-align:center;">
  Póliza anterior <strong style="color:#64748b;">{{ $nroAnterior }}</strong> cerrada — reemplazada por la nueva.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20consulto%20sobre%20mi%20p%C3%B3liza%20{{ urlencode($nroNuevo) }}"
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Contactar por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
