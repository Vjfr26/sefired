@extends('emails.layout')
@section('title', '¡Feliz Cumpleaños! — LA VENEZOLANA DE SEGUROS Y VIDA C.A.')

@section('content')
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding-bottom:16px;">
    <div style="font-size:48px;line-height:1.2;">🎂</div>
  </td></tr>
</table>

<h1 style="margin:0 0 8px;font-size:24px;font-weight:800;color:#1e293b;text-align:center;">
  ¡Feliz Cumpleaños, {{ $nombre }}!
</h1>
<p style="margin:0 0 24px;font-size:15px;color:#64748b;text-align:center;line-height:1.7;">
  En este día especial, todo el equipo de <strong>LA VENEZOLANA DE SEGUROS Y VIDA C.A.</strong><br>
  le desea un año lleno de salud, prosperidad y protección.
</p>

<div style="background:linear-gradient(135deg,#fdf2f8,#fce7f3);border:1px solid #fbcfe8;border-radius:12px;padding:24px;text-align:center;margin-bottom:24px;">
  <p style="margin:0;font-size:15px;color:#831843;font-style:italic;line-height:1.7;">
    "Contar con un seguro no es un gasto, es el regalo más valioso<br>que puede hacerse a sí mismo y a quienes ama."
  </p>
</div>

<p style="margin:0;font-size:13px;color:#94a3b8;text-align:center;">
  Con aprecio, el equipo de LA VENEZOLANA DE SEGUROS Y VIDA C.A. 💙
</p>
@endsection
