@extends('emails.layout')
@section('title', 'Documentos de su póliza — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#eff6ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">
      📄
    </div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  Documentos de su póliza
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Estimado/a <strong>{{ $nombre }}</strong>,<br>
  le adjuntamos {{ count($docs) === 1 ? 'el documento' : 'los documentos' }} correspondiente{{ count($docs) === 1 ? '' : 's' }} a su póliza <strong>{{ $producto }}</strong>.
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:24px;">
  <tr><td style="padding:16px 24px;">
    <p style="margin:0 0 10px;font-size:12px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:1px;">Documentos adjuntos</p>
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach($docs as $d)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#1e293b;font-weight:600;border-bottom:1px solid #f1f5f9;">
          📎 {{ $d['nombre'] ?? 'Documento' }}.pdf
        </td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<p style="margin:0 0 8px;font-size:13px;color:#64748b;text-align:center;line-height:1.6;">
  Conserve estos documentos. Si tiene dudas, un asesor puede ayudarle.
</p>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20tengo%20una%20consulta%20sobre%20los%20documentos%20de%20mi%20p%C3%B3liza"
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Hablar con un asesor por WhatsApp
    </a>
  </td></tr>
</table>
@endsection
