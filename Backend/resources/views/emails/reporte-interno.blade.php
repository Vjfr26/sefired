@extends('emails.layout')
@section('title', 'Reporte Interno Semanal — J&M Seguros')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#f1f5f9;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">🏢</div>
  </td></tr>
</table>

<h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Reporte Semanal
</h1>
<p style="margin:0 0 24px;font-size:13px;color:#94a3b8;text-align:center;">
  Semana del {{ $semanaDesde }} al {{ $semanaHasta }}
</p>

{{-- KPIs --}}
<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
  <tr>
    @foreach([
      ['Pólizas emitidas',   $polizasEmitidas,  '#0ea5e9', '📄'],
      ['Recibos generados',  $facturasEmitidas, '#6366f1', '🧾'],
      ['Clientes nuevos',    $clientesNuevos,   '#10b981', '👤'],
    ] as $kpi)
    <td style="width:33%;padding:0 6px 0 {{ $loop->first ? '0' : '6px' }};">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-top:3px solid {{ $kpi[2] }};
                  border-radius:8px;padding:16px;text-align:center;">
        <div style="font-size:24px;margin-bottom:4px;">{{ $kpi[3] }}</div>
        <div style="font-size:24px;font-weight:900;color:{{ $kpi[2] }};">{{ $kpi[1] }}</div>
        <div style="font-size:11px;color:#94a3b8;margin-top:4px;">{{ $kpi[0] }}</div>
      </div>
    </td>
    @endforeach
  </tr>
</table>

{{-- Resumen financiero --}}
<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#0f172a;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">
      Resumen Financiero
    </p>
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['Prima total USD',    '$' . $primaTotalUsd],
        ['Prima total Bs.',    'Bs. ' . $primaTotalBs],
        ['Pólizas por vencer (30d)', $polizasPorVencer],
        ['Pólizas vencidas',  $polizasVencidas],
      ] as $row)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:55%;border-bottom:1px solid #1e293b;">{{ $row[0] }}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:700;color:#f8fafc;border-bottom:1px solid #1e293b;">{{ $row[1] }}</td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<p style="margin:0;font-size:12px;color:#cbd5e1;text-align:center;">
  Generado automáticamente por J&M Seguros · {{ now()->format('d/m/Y H:i') }}
</p>
@endsection
