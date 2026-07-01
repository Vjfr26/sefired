<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificación de Póliza</title>
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; }
        .card { background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.1); max-width: 480px; width: 100%; padding: 32px; }
        .logo-header { text-align: center; margin-bottom: 24px; }
        .logo-header h2 { color: #127481; font-size: 22px; margin-top: 8px; }
        .logo-header p { color: #666; font-size: 13px; margin-top: 4px; }
        .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 20px; }
        .status-ACTIVA  { background: #d1fae5; color: #065f46; }
        .status-VENCIDA { background: #fee2e2; color: #991b1b; }
        .status-ANULADA { background: #f3f4f6; color: #374151; }
        .status-default { background: #fef3c7; color: #92400e; }
        .row { display: flex; justify-content: space-between; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
        .row:last-child { border-bottom: none; }
        .row .label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .row .value { font-weight: 600; color: #111827; font-size: 14px; text-align: right; }
        .not-found { text-align: center; color: #6b7280; }
        .not-found .icon { font-size: 48px; margin-bottom: 16px; }
        .not-found h3 { color: #374151; margin-bottom: 8px; }
        .footer { margin-top: 24px; text-align: center; font-size: 11px; color: #9ca3af; }
    </style>
</head>
<body>
    <div class="card">
        <div class="logo-header">
            <h2>J&M</h2>
            <p>Verificación de Póliza</p>
        </div>

        @if($encontrada)
            @php
                $statusClass = 'status-' . ($status ?? 'default');
                if (!in_array($statusClass, ['status-ACTIVA','status-VENCIDA','status-ANULADA'])) {
                    $statusClass = 'status-default';
                }
            @endphp
            <div style="text-align:center;">
                <span class="status-badge {{ $statusClass }}">{{ $status }}</span>
            </div>

            <div class="row">
                <span class="label">N° Póliza</span>
                <span class="value">{{ $nro_contrato }}</span>
            </div>
            <div class="row">
                <span class="label">Asegurado</span>
                <span class="value">{{ $asegurado_nombre }}</span>
            </div>
            <div class="row">
                <span class="label">Producto</span>
                <span class="value">{{ $producto }}</span>
            </div>
            <div class="row">
                <span class="label">Placa</span>
                <span class="value">{{ $placa }}</span>
            </div>
            <div class="row">
                <span class="label">Vehículo</span>
                <span class="value">{{ $marca }} {{ $modelo }}</span>
            </div>
            <div class="row">
                <span class="label">Emisión</span>
                <span class="value">{{ $fecha_emision }}</span>
            </div>
            <div class="row">
                <span class="label">Vencimiento</span>
                <span class="value">{{ $fecha_vencimiento }}</span>
            </div>
        @else
            <div class="not-found">
                <div class="icon">🔍</div>
                <h3>Póliza no encontrada</h3>
                <p>No se encontró ninguna póliza con ese número. Verifique que el código QR esté en buen estado.</p>
            </div>
        @endif

        <div class="footer">
            <p style="margin:0 0 6px;font-size:12px;color:#94a3b8;">
              Servicio operado por <strong style="color:#64748b;">INVERSIONES J&amp;M, C.A. &copy;</strong>,
              <strong style="color:#64748b;">LA VENEZOLANA DE SEGUROS Y VIDA C.A.</strong> {{ date('Y') }}.
            </p>
        </div>
    </div>
</body>
</html>
