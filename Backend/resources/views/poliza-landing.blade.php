<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Póliza {{ $nro_contrato ?? '' }} — La Venezolana de Seguros y Vida</title>
    <link rel="icon" type="image/png" href="{{ url('images/icono.png') }}">
    <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: Arial, sans-serif;
            background: #f0f4f8;
            min-height: 100vh;
            padding: 16px;
        }

        .wrap { max-width: 520px; margin: 0 auto; }

        /* ── Header ── */
        .header {
            background: #127481;
            border-radius: 12px 12px 0 0;
            padding: 20px 24px 16px;
            color: white;
            text-align: center;
        }
        .header-logo {
            width: 200px;
            height: auto;
            object-fit: contain;
            border-radius: 8px;
            background: white;
            padding: 8px 14px;
            margin: 0 auto 12px;
            display: block;
        }
        .header h1 { font-size: 18px; font-weight: bold; letter-spacing: 0.3px; }
        .header p  { font-size: 11px; opacity: .75; margin-top: 2px; }
        .header .nro { font-size: 13px; font-weight: bold; opacity: 1; margin-top: 6px; letter-spacing: 0.5px; }

        .status-row { margin-top: 10px; }
        .badge {
            display: inline-block;
            padding: 5px 18px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 13px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .badge-ACTIVA    { background: #d1fae5; color: #065f46; }
        .badge-VENCIDA   { background: #fee2e2; color: #991b1b; }
        .badge-ANULADA   { background: #f3f4f6; color: #374151; }
        .badge-RENOVADA  { background: #dbeafe; color: #1e40af; }
        .badge-default   { background: #fef3c7; color: #92400e; }

        /* ── Tabs ── */
        .tabs { display: flex; background: #0e5a65; }
        .tab-btn {
            flex: 1;
            padding: 11px 4px;
            background: none;
            border: none;
            color: rgba(255,255,255,.65);
            font-size: 13px;
            cursor: pointer;
            font-family: Arial, sans-serif;
            border-bottom: 3px solid transparent;
            transition: color .2s, border-color .2s;
        }
        .tab-btn.active { color: #fff; border-bottom-color: #5ce0d8; font-weight: bold; }

        /* ── Card body ── */
        .card {
            background: white;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,.1);
            padding: 24px;
        }

        .pane { display: none; }
        .pane.active { display: block; }

        /* ── Data rows ── */
        .row {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            padding: 9px 0;
            border-bottom: 1px solid #e5e7eb;
            gap: 8px;
        }
        .row:last-child { border-bottom: none; }
        .row .lbl { color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: .5px; white-space: nowrap; }
        .row .val { font-weight: 600; color: #111827; font-size: 13px; text-align: right; }

        .section-title {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .8px;
            color: #127481;
            font-weight: bold;
            margin: 18px 0 6px;
        }
        .section-title:first-child { margin-top: 0; }

        /* ── PDF tab ── */
        .pdf-box { text-align: center; padding: 16px 0; }
        .pdf-icon { font-size: 56px; margin-bottom: 12px; }
        .pdf-box p { color: #6b7280; font-size: 13px; margin-bottom: 20px; line-height: 1.5; }

        /* ── Buttons ── */
        .btn-primary {
            display: inline-block;
            background: #127481;
            color: white;
            padding: 12px 32px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            border: none;
            cursor: pointer;
            font-family: Arial, sans-serif;
            transition: background .2s;
        }
        .btn-primary:hover  { background: #0e5a65; }
        .btn-primary:disabled { opacity: .65; cursor: not-allowed; }
        .btn-full { width: 100%; padding: 13px; text-align: center; }

        /* ── Form ── */
        .form-group { margin-bottom: 14px; }
        .form-group label {
            display: block;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: .5px;
            color: #6b7280;
            margin-bottom: 5px;
        }
        .form-group input,
        .form-group select,
        .form-group textarea {
            width: 100%;
            padding: 10px 12px;
            border: 1px solid #d1d5db;
            border-radius: 6px;
            font-size: 13px;
            font-family: Arial, sans-serif;
            outline: none;
            transition: border-color .2s;
            background: white;
        }
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus { border-color: #127481; }
        .form-group textarea { resize: vertical; min-height: 72px; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

        .renew-summary {
            background: #f0fafa;
            border: 1px solid #b2e0e6;
            border-radius: 8px;
            padding: 14px 16px;
            margin-bottom: 20px;
            font-size: 13px;
            color: #374151;
            line-height: 1.6;
        }
        .renew-summary strong { color: #127481; }
        .renew-summary .amount { font-size: 18px; font-weight: 800; color: #127481; }

        /* ── Messages ── */
        .success-msg { display: none; text-align: center; padding: 20px 10px; }
        .success-msg .icon { font-size: 48px; margin-bottom: 12px; }
        .success-msg h3 { color: #065f46; margin-bottom: 6px; }
        .success-msg p  { color: #6b7280; font-size: 13px; line-height: 1.5; }

        .error-msg {
            display: none;
            background: #fee2e2;
            border-radius: 6px;
            padding: 10px 14px;
            font-size: 13px;
            color: #991b1b;
            margin-bottom: 12px;
        }

        .note {
            margin-top: 16px;
            font-size: 11px;
            color: #9ca3af;
            line-height: 1.4;
            text-align: center;
        }

        /* ── Agregar pago ── */
        .btn-agregar {
            display: block;
            width: 100%;
            padding: 10px;
            background: #f0fafa;
            color: #127481;
            border: 1.5px dashed #127481;
            border-radius: 8px;
            font-size: 13px;
            font-weight: bold;
            cursor: pointer;
            font-family: Arial, sans-serif;
            transition: background .15s;
            margin-top: 4px;
        }
        .btn-agregar:hover { background: #e0f5f7; }
        .btn-agregar:disabled { opacity: .4; cursor: not-allowed; }

        /* ── Fila de pago ── */
        .pago-row {
            border: 1px solid #e2e8f0;
            border-radius: 10px;
            padding: 14px;
            margin-bottom: 10px;
            background: #fafafa;
            position: relative;
        }
        .pago-row-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .pago-num {
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            color: #127481;
            letter-spacing: .5px;
        }
        .btn-remove {
            background: none;
            border: none;
            color: #ef4444;
            font-size: 18px;
            cursor: pointer;
            line-height: 1;
            padding: 0 4px;
        }

        /* ── Balance box ── */
        .balance-ok    { background: #d1fae5 !important; color: #065f46 !important; }
        .balance-pend  { background: #fef3c7 !important; color: #92400e !important; }
        .balance-favor { background: #dbeafe !important; color: #1e40af !important; }

        /* ── Not found ── */
        .not-found { text-align: center; padding: 24px 0; color: #6b7280; }
        .not-found .icon { font-size: 48px; margin-bottom: 14px; }
        .not-found h3 { color: #374151; margin-bottom: 8px; font-size: 16px; }

        /* ── Footer ── */
        .footer { margin-top: 16px; text-align: center; font-size: 11px; color: #9ca3af; }

        @media (max-width: 400px) {
            .form-row { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
<div class="wrap">

    {{-- ── Header ── --}}
    <div class="header">
        <img src="{{ url('images/logon.jpg') }}" alt="La Venezolana de Seguros" class="header-logo">
        <h1>J&amp;M Seguros</h1>
        <p>La Venezolana de Seguros y Vida, C.A.</p>
        @if(isset($nro_contrato))
            <p class="nro">{{ $nro_contrato }}</p>
        @endif
        @if($encontrada)
            @php
                $badgeClass = 'badge-' . ($status ?? 'default');
                if (!in_array($badgeClass, ['badge-ACTIVA','badge-VENCIDA','badge-ANULADA','badge-RENOVADA'])) {
                    $badgeClass = 'badge-default';
                }
            @endphp
            <div class="status-row">
                <span class="badge {{ $badgeClass }}">{{ $status }}</span>
            </div>
        @endif
    </div>

    @if($encontrada)

    <div class="tabs">
        <button class="tab-btn active" onclick="showTab('ver', this)">&#128196; Ver Póliza</button>
        <button class="tab-btn"        onclick="showTab('pdf', this)">&#128438; Reimprimir</button>
        <button class="tab-btn"        onclick="showTab('renov', this)">&#128260; Renovar</button>
    </div>

    <div class="card">

        {{-- ══ TAB 1: VER PÓLIZA ══ --}}
        <div id="pane-ver" class="pane active">

            <div class="section-title">Datos del Asegurado</div>
            <div class="row"><span class="lbl">Nombre</span>    <span class="val">{{ $asegurado_nombre }}</span></div>
            <div class="row"><span class="lbl">C.I. / RIF</span><span class="val">{{ $asegurado_ci }}</span></div>

            <div class="section-title">Datos de la Póliza</div>
            <div class="row"><span class="lbl">N° Póliza</span>      <span class="val">{{ $nro_contrato }}</span></div>
            <div class="row"><span class="lbl">Producto</span>       <span class="val">{{ $producto }}</span></div>
            <div class="row">
                <span class="lbl">Estado</span>
                @php
                    $statusColor = match($status ?? '') {
                        'ACTIVA'   => '#065f46',
                        'VENCIDA'  => '#991b1b',
                        'ANULADA'  => '#374151',
                        'RENOVADA' => '#1e40af',
                        default    => '#92400e',
                    };
                @endphp
                <span class="val" style="color:{{ $statusColor }}; font-weight:700;">{{ $status }}</span>
            </div>
            <div class="row"><span class="lbl">Emisión</span>        <span class="val">{{ $fecha_emision }}</span></div>
            <div class="row"><span class="lbl">Vencimiento</span>    <span class="val">{{ $fecha_vencimiento }}</span></div>
            @if(isset($total) && $total)
            <div class="row"><span class="lbl">Prima Total</span>    <span class="val">{{ $moneda_simbolo ?? '$' }}{{ number_format((float)$total, 2) }}</span></div>
            @endif

            @if($placa !== '—')
            <div class="section-title">Vehículo Asegurado</div>
            <div class="row"><span class="lbl">Placa</span>            <span class="val">{{ $placa }}</span></div>
            <div class="row"><span class="lbl">Vehículo</span>         <span class="val">{{ $marca }} {{ $modelo }} {{ $anio }}</span></div>
            @if($color !== '—')
            <div class="row"><span class="lbl">Color</span>            <span class="val">{{ $color }}</span></div>
            @endif
            @if($serial_carroceria !== '—')
            <div class="row"><span class="lbl">Serial Carrocería</span><span class="val">{{ $serial_carroceria }}</span></div>
            @endif
            @if($serial_motor !== '—')
            <div class="row"><span class="lbl">Serial Motor</span>     <span class="val">{{ $serial_motor }}</span></div>
            @endif
            @endif
        </div>

        {{-- ══ TAB 2: REIMPRIMIR ══ --}}
        <div id="pane-pdf" class="pane">
            <div class="pdf-box">
                <div class="pdf-icon">📄</div>
                <p>Descarga o imprime el documento oficial de tu póliza en formato PDF.</p>
                <a class="btn-primary" href="{{ route('poliza.pdf-publico', $nro_contrato) }}" target="_blank">
                    Descargar PDF
                </a>
                <p class="note">El documento generado es válido como comprobante de cobertura.<br>Para correcciones comuníquese con su agente.</p>
            </div>
        </div>

        {{-- ══ TAB 3: RENOVAR ══ --}}
        <div id="pane-renov" class="pane">

            {{-- Resumen de la póliza --}}
            <div class="renew-summary">
                <strong>Póliza:</strong> {{ $nro_contrato }}<br>
                <strong>Titular:</strong> {{ $asegurado_nombre }}<br>
                <strong>Vencimiento actual:</strong> {{ $fecha_vencimiento }}<br>
                @if(isset($total) && $total)
                @php
                    // La moneda nativa del producto va primero y resaltada;
                    // las otras dos son solo conversión de referencia — nunca
                    // se mezclan montos de monedas distintas en la misma cifra.
                    $cajasMoneda = [
                        'USD' => ['label' => 'Dólares',   'simbolo' => '$',    'valor' => $total_usd_equiv ?? null, 'color' => '#127481'],
                        'EUR' => ['label' => 'Euros',     'simbolo' => '€',    'valor' => $total_eur        ?? null, 'color' => '#b45309'],
                        'BS'  => ['label' => 'Bolívares', 'simbolo' => 'Bs. ', 'valor' => $total_bs         ?? null, 'color' => '#374151'],
                    ];
                    $cajasMoneda[$moneda ?? 'USD']['valor'] = $total;
                @endphp
                <div style="margin-top:10px; padding-top:10px; border-top:1px solid #b2e0e6;">
                    <div style="font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:#6b7280; margin-bottom:6px;">Monto a cancelar</div>
                    <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">
                        @foreach($cajasMoneda as $cod => $caja)
                        @if($caja['valor'])
                        <div style="background:white; border:1px solid {{ $cod === ($moneda ?? 'USD') ? $caja['color'] : '#d1d5db' }}; border-radius:8px; padding:8px 14px; text-align:center; min-width:110px;">
                            <div style="font-size:10px; color:#6b7280; margin-bottom:2px;">{{ $caja['label'] }}{{ $cod === ($moneda ?? 'USD') ? ' (a pagar)' : '' }}</div>
                            <div style="font-size:18px; font-weight:800; color:{{ $caja['color'] }};">{{ $caja['simbolo'] }}{{ number_format((float)$caja['valor'], 2) }}</div>
                        </div>
                        @endif
                        @endforeach
                    </div>
                    @if(isset($tasa_usd) && $tasa_usd)
                    <div style="font-size:10px; color:#9ca3af; margin-top:6px; text-align:center;">
                        Tasa BCV: 1 USD = Bs. {{ number_format($tasa_usd, 4) }}
                        @if(isset($tasa_eur) && $tasa_eur) · 1 EUR = Bs. {{ number_format($tasa_eur, 4) }} @endif
                    </div>
                    @else
                    <div style="font-size:10px; color:#f59e0b; margin-top:6px; text-align:center;">
                        ⚠️ Sin tasa del día registrada — ingrese la tasa al pagar en Bs.
                    </div>
                    @endif
                </div>
                @endif
            </div>

            {{-- Balance en tiempo real --}}
            @if(isset($total) && $total)
            <div id="balance-box" style="border-radius:8px; padding:12px 16px; margin-bottom:16px; font-size:13px; text-align:center; background:#f1f5f9; color:#475569; display:none;">
                <span id="balance-txt"></span>
            </div>
            @endif

            <div class="error-msg" id="renov-error"></div>

            <div id="renov-form">

                {{-- Lista dinámica de pagos --}}
                <div id="pagos-lista"></div>

                {{-- Botón agregar pago --}}
                <button type="button" class="btn-agregar" id="btn-agregar" onclick="agregarPago()">
                    + Agregar método de pago
                </button>

                <button class="btn-primary btn-full" id="renov-btn" onclick="enviarRenovacion()" style="margin-top:16px;">
                    Enviar Comprobante de Pago
                </button>
                <p class="note">Un asesor verificará su pago y procesará la renovación. Solo se aprueba internamente.</p>
            </div>

            <div class="success-msg" id="renov-success">
                <div class="icon">✅</div>
                <h3>¡Solicitud enviada!</h3>
                <p>Hemos recibido su comprobante de pago.<br>Un asesor verificará la información y procesará la renovación de su póliza a la brevedad.</p>
            </div>

        </div>

    </div>

    @else

    <div class="tabs"></div>
    <div class="card">
        <div class="not-found">
            <div class="icon">🔍</div>
            <h3>Póliza no encontrada</h3>
            <p>No se encontró ninguna póliza con el número <strong>{{ $nro_contrato }}</strong>.<br>Verifique que el código QR esté en buen estado.</p>
        </div>
    </div>

    @endif

    <p class="footer">La Venezolana de Seguros y Vida, C.A. &mdash; J&amp;M Seguros &copy; {{ date('Y') }}</p>

</div>

<script>
    // ── Constantes ────────────────────────────────────────────────────────────
    // TOTAL_POLIZA está en MONEDA_NATIVA (la moneda del producto, no siempre
    // USD) — todo pago se convierte a MONEDA_NATIVA antes de comparar, nunca
    // al revés, para no mezclar montos de monedas distintas en el balance.
    const TOTAL_POLIZA  = {{ isset($total) && $total ? (float)$total : 0 }};
    const TASA_USD      = {{ isset($tasa_usd) && $tasa_usd ? (float)$tasa_usd : 0 }};
    const TASA_EUR      = {{ isset($tasa_eur) && $tasa_eur ? (float)$tasa_eur : 0 }};
    const MONEDA_NATIVA = "{{ $moneda ?? 'USD' }}";
    const SIMBOLO_NATIVO = "{{ $moneda_simbolo ?? '$' }}";

    function normalizarMoneda(m) {
        const x = String(m || '').toUpperCase().replace(/[.\s]/g, '');
        if (['BS', 'BOLIVAR', 'BOLIVARES'].includes(x)) return 'BS';
        if (['EUR', 'EURO', 'EUROS'].includes(x))        return 'EUR';
        return 'USD';
    }
    // Pivotea por bolívares, igual que Moneda::convertir() en el backend.
    function convertirMoneda(valor, desde, hacia) {
        desde = normalizarMoneda(desde); hacia = normalizarMoneda(hacia);
        if (desde === hacia) return { valor, sinTasa: false };
        const enBs = desde === 'USD' ? (TASA_USD ? valor * TASA_USD : null)
                   : desde === 'EUR' ? (TASA_EUR ? valor * TASA_EUR : null)
                   : valor;
        if (enBs === null) return { valor: 0, sinTasa: true };
        if (hacia === 'USD') return TASA_USD ? { valor: enBs / TASA_USD, sinTasa: false } : { valor: 0, sinTasa: true };
        if (hacia === 'EUR') return TASA_EUR ? { valor: enBs / TASA_EUR, sinTasa: false } : { valor: 0, sinTasa: true };
        return { valor: enBs, sinTasa: false };
    }
    const METODOS = ['Transferencia Bancaria','Pago Móvil','Zelle','Binance / Cripto'];
    const MAX_PAGOS = 5;
    let contadorPago = 0;

    // ── Tabs ──────────────────────────────────────────────────────────────────
    function showTab(name, btn) {
        document.querySelectorAll('.pane').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.getElementById('pane-' + name).classList.add('active');
        btn.classList.add('active');
        if (name === 'renov' && contadorPago === 0) agregarPago();
    }

    // ── Sanitizar texto (sin comillas, sin caracteres peligrosos) ─────────────
    function sanitizar(str) {
        return String(str).replace(/['"<>&;\\]/g, '').trim().slice(0, 200);
    }
    function sanitizarRef(str) {
        // Solo alfanuméricos, guiones, barras y espacios
        return String(str).replace(/[^A-Za-z0-9\s\-\/]/g, '').trim().slice(0, 100);
    }

    // ── Pago row ──────────────────────────────────────────────────────────────
    function agregarPago() {
        const lista = document.getElementById('pagos-lista');
        if (lista.children.length >= MAX_PAGOS) return;

        contadorPago++;
        const id = contadorPago;

        const row = document.createElement('div');
        row.className = 'pago-row';
        row.id = 'pago-' + id;
        row.innerHTML = `
            <div class="pago-row-header">
                <span class="pago-num">Pago #${id}</span>
                ${id > 1 ? `<button type="button" class="btn-remove" onclick="eliminarPago(${id})" title="Eliminar">✕</button>` : ''}
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Método *</label>
                    <select onchange="toggleBancoRow(${id}); recalcular()">
                        ${METODOS.map(m => `<option value="${m}">${m}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group banco-group-${id}" style="display:none;">
                    <label>Banco</label>
                    <input type="text" placeholder="Ej. Banesco" maxlength="80">
                </div>
            </div>
            <div class="form-group">
                <label>N° de referencia *</label>
                <input type="text" placeholder="Ej. 00123456789" maxlength="100" oninput="this.value=this.value.replace(/[^A-Za-z0-9\\s\\-\\/]/g,'')">
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Monto *</label>
                    <input type="number" placeholder="0.00" min="0.01" step="0.01" max="9999999" oninput="recalcular()">
                </div>
                <div class="form-group">
                    <label>Moneda *</label>
                    <select onchange="recalcular()">
                        <option value="USD">USD — Dólares</option>
                        <option value="EUR">EUR — Euros</option>
                        <option value="Bs.">Bs. — Bolívares</option>
                    </select>
                </div>
            </div>`;

        lista.appendChild(row);
        actualizarBotonAgregar();
        recalcular();
    }

    function eliminarPago(id) {
        const row = document.getElementById('pago-' + id);
        if (row) row.remove();
        actualizarBotonAgregar();
        renumerarPagos();
        recalcular();
    }

    function renumerarPagos() {
        document.querySelectorAll('.pago-row').forEach((row, i) => {
            const span = row.querySelector('.pago-num');
            if (span) span.textContent = 'Pago #' + (i + 1);
        });
    }

    function actualizarBotonAgregar() {
        const cant = document.querySelectorAll('.pago-row').length;
        const btn  = document.getElementById('btn-agregar');
        btn.disabled = cant >= MAX_PAGOS;
        btn.textContent = cant >= MAX_PAGOS ? `Máximo ${MAX_PAGOS} pagos` : '+ Agregar método de pago';
    }

    function toggleBancoRow(id) {
        const row    = document.getElementById('pago-' + id);
        const select = row.querySelector('select');
        const grupo  = row.querySelector(`.banco-group-${id}`);
        if (!grupo) return;
        const mostrar = select.value === 'Transferencia Bancaria' || select.value === 'Pago Móvil';
        grupo.style.display = mostrar ? 'block' : 'none';
    }

    // ── Balance en tiempo real ────────────────────────────────────────────────
    function recalcular() {
        if (!TOTAL_POLIZA) return;
        const box = document.getElementById('balance-box');
        if (!box) return;

        let totalNativo = 0;
        let sinTasa      = false; // algún pago necesitó una tasa que no está registrada

        document.querySelectorAll('.pago-row').forEach(row => {
            const inputs  = row.querySelectorAll('input[type="number"]');
            const selects = row.querySelectorAll('select');
            const monto   = parseFloat(inputs[0]?.value) || 0;
            const moneda  = selects[1]?.value || 'USD';

            const { valor, sinTasa: faltaTasa } = convertirMoneda(monto, moneda, MONEDA_NATIVA);
            totalNativo += valor;
            if (faltaTasa) sinTasa = true;
        });

        const diff  = Math.round((totalNativo - TOTAL_POLIZA) * 100) / 100;
        const falta = Math.round((TOTAL_POLIZA - totalNativo) * 100) / 100;

        box.style.display = 'block';

        const BASE = 'border-radius:8px;padding:12px 16px;margin-bottom:16px;font-size:13px;text-align:center;';

        if (sinTasa) {
            box.innerHTML = '⚠️ Hay pagos en una moneda sin tasa registrada — el asesor verificará el total.';
            box.style.cssText = BASE + 'background:#fef3c7;color:#92400e;';
        } else if (totalNativo <= 0) {
            box.style.display = 'none';
        } else if (Math.abs(diff) < 0.01) {
            box.innerHTML = '✅ <strong>Monto completo</strong> — listo para enviar.';
            box.style.cssText = BASE + 'font-weight:bold;background:#d1fae5;color:#065f46;';
        } else if (diff > 0) {
            box.innerHTML = `ℹ️ Saldo a favor: <strong>${SIMBOLO_NATIVO}${diff.toFixed(2)} ${MONEDA_NATIVA}</strong> — el asesor lo considerará.`;
            box.style.cssText = BASE + 'background:#dbeafe;color:#1e40af;';
        } else {
            box.innerHTML = `⚠️ Falta por pagar: <strong>${SIMBOLO_NATIVO}${falta.toFixed(2)} ${MONEDA_NATIVA}</strong>`;
            box.style.cssText = BASE + 'font-weight:bold;background:#fef3c7;color:#92400e;';
        }
    }

    // ── Recolectar y enviar ───────────────────────────────────────────────────
    function enviarRenovacion() {
        const errEl = document.getElementById('renov-error');
        const btn   = document.getElementById('renov-btn');
        errEl.style.display = 'none';

        const filas = document.querySelectorAll('.pago-row');
        if (filas.length === 0) {
            errEl.textContent = 'Agregue al menos un método de pago.';
            errEl.style.display = 'block'; return;
        }

        const pagos = [];
        let valido  = true;
        let errMsg  = '';

        filas.forEach((row, i) => {
            if (!valido) return;
            const selects   = row.querySelectorAll('select');
            const inputs    = row.querySelectorAll('input');
            const metodo    = selects[0]?.value || '';
            const moneda    = selects[1]?.value || 'USD';
            const banco     = sanitizar(inputs[0]?.value || '');
            const referencia= sanitizarRef(inputs[1]?.value || '');
            const monto     = parseFloat(inputs[2]?.value) || 0;

            if (!metodo)     { valido = false; errMsg = `Pago #${i+1}: seleccione el método.`;   return; }
            if (!referencia) { valido = false; errMsg = `Pago #${i+1}: ingrese la referencia.`;  return; }
            if (monto <= 0)  { valido = false; errMsg = `Pago #${i+1}: ingrese un monto válido.`; return; }

            pagos.push({
                metodo,
                banco: banco || null,
                referencia,
                monto: Math.round(monto * 100) / 100,
                moneda,
            });
        });

        if (!valido) { errEl.textContent = errMsg; errEl.style.display = 'block'; return; }

        btn.disabled    = true;
        btn.textContent = 'Enviando…';

        fetch('{{ route("poliza.solicitar-renovacion", $nro_contrato ?? "") }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': '{{ csrf_token() }}',
            },
            body: JSON.stringify({ pagos }),
        })
        .then(r => r.json())
        .then(data => {
            if (data.ok) {
                document.getElementById('renov-form').style.display    = 'none';
                document.getElementById('balance-box') && (document.getElementById('balance-box').style.display = 'none');
                document.getElementById('renov-success').style.display = 'block';
            } else {
                const msg = data.message
                    || (data.errors ? Object.values(data.errors).flat().join(' ') : 'Error al enviar.');
                errEl.textContent = msg;
                errEl.style.display = 'block';
                btn.disabled    = false;
                btn.textContent = 'Enviar Comprobante de Pago';
            }
        })
        .catch(() => {
            errEl.textContent = 'Error de conexión. Intente nuevamente.';
            errEl.style.display = 'block';
            btn.disabled    = false;
            btn.textContent = 'Enviar Comprobante de Pago';
        });
    }
</script>
</body>
</html>
