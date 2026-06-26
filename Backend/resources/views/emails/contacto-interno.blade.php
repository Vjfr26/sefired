@extends('emails.layout')
@section('title', 'Nueva solicitud de contacto — INVERSIONES J&M, C.A.')

@section('content')
<h1 style="margin:0 0 8px;font-size:20px;font-weight:800;color:#1e293b;text-align:center;">
  Nueva solicitud de contacto
</h1>
<p style="margin:0 0 24px;font-size:13px;color:#64748b;text-align:center;">
  Generada desde el chatbot del portal de clientes el {{ $fecha }}.
</p>

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:20px;">
  <tr><td style="padding:20px 24px;">
    <table width="100%" cellpadding="0" cellspacing="0">
      @foreach([
        ['Correo del cliente', $email],
        ['Motivo',             $motivoLabel],
        ['Dirigido a',         $destinoLabel],
        ['IP de origen',       $ip ?? '—'],
      ] as $row)
      <tr>
        <td style="padding:6px 0;font-size:13px;color:#94a3b8;width:40%;border-bottom:1px solid #f1f5f9;">{{ $row[0] }}</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1e293b;border-bottom:1px solid #f1f5f9;">{{ $row[1] }}</td>
      </tr>
      @endforeach
    </table>
  </td></tr>
</table>

<p style="margin:0;font-size:13px;color:#475569;text-align:center;line-height:1.6;">
  Por favor contacta al cliente a la brevedad — ya recibió un correo confirmando que su solicitud fue recibida.
</p>
@endsection
