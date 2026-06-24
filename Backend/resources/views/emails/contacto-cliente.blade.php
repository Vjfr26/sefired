@extends('emails.layout')
@section('title', 'Solicitud de contacto recibida — La Venezolana de Seguros y Vida')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:20px;">
    <div style="width:64px;height:64px;background:#f5f3ff;border-radius:50%;display:inline-block;line-height:64px;text-align:center;font-size:30px;">✅</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1e293b;text-align:center;">
  ¡Recibimos tu solicitud!
</h1>
<p style="margin:0 0 24px;font-size:14px;color:#64748b;text-align:center;line-height:1.6;">
  Tu solicitud para ser contactado fue recibida con éxito el <strong>{{ $fecha }}</strong>.
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;border-radius:12px;margin-bottom:24px;">
  <tr><td style="padding:20px 24px;">
    <p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#7c3aed;text-transform:uppercase;letter-spacing:1.5px;">
      Motivo de tu solicitud
    </p>
    <p style="margin:0;font-size:16px;font-weight:700;color:#4c1d95;">
      {{ $motivoLabel }}
    </p>
  </td></tr>
</table>

<p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;text-align:center;">
  @if($esTecnico)
    Pronto un <strong>técnico</strong> de nuestro equipo de soporte se pondrá en contacto contigo a este correo para ayudarte.
  @else
    Pronto un <strong>asesor</strong> de J&amp;M se pondrá en contacto contigo a este correo para atender tu solicitud.
  @endif
</p>

<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center">
    <a href="https://wa.me/584148299562?text=Hola%2C%20acabo%20de%20solicitar%20que%20me%20contacten%20desde%20el%20sitio%20web."
       style="display:inline-block;background:#25d366;color:#fff;font-size:14px;font-weight:700;
              padding:12px 32px;border-radius:8px;text-decoration:none;">
      Hablar por WhatsApp ahora
    </a>
  </td></tr>
</table>
@endsection
