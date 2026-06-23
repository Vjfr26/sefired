<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>@yield('title', 'J&M Seguros')</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1e293b;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        {{-- HEADER --}}
        <tr>
          <td style="background:{{ $accentColor ?? '#001463' }};border-radius:12px 12px 0 0;padding:28px 36px;text-align:center;">
            <p style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:2px;">J&amp;M Seguros</p>
            <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,0.75);letter-spacing:1px;text-transform:uppercase;">
              La Venezolana de Seguros y Vida.
            </p>
          </td>
        </tr>

        {{-- BADGE TIPO --}}
        <tr>
          <td style="background:#ffffff;padding:0 36px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:20px 0 0;text-align:center;">
                  <span style="display:inline-block;background:{{ $badgeColor ?? '#001463' }};color:#fff;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:6px 18px;border-radius:20px;">
                    {{ $badgeText ?? '' }}
                  </span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        {{-- CONTENIDO --}}
        <tr>
          <td style="background:#ffffff;padding:24px 36px 32px;border-radius:0;">
            @yield('content')
          </td>
        </tr>

        {{-- FOOTER --}}
        <tr>
          <td style="background:#f8fafc;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 12px 12px;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
              Este correo fue generado automáticamente por el sistema J&M Seguros.
            </p>
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              <strong style="color:#64748b;">J&amp;M Seguros</strong> ·
              <a href="mailto:tuseguro@jmlavenezolana.com" style="color:#64748b;text-decoration:none;">tuseguro@jmlavenezolana.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>

</body>
</html>
