-- ============================================================================
-- ACTUALIZA los montos de las tarifas RCV existentes con la tabla oficial
-- RCV LEY (montos en BOLÍVARES, TCR 190). NO crea ni desactiva tarifas.
-- Casa por NOMBRE (solo estado 'vigente'); usa JSON_SET, así que el resto
-- del JSON datos (deducible, coberturas_pdf, etc.) queda intacto.
-- Re-ejecutable. Las clases SIN equivalente oficial (ambulancias, pick-ups
-- por ocupantes...) no se tocan: revisarlas en el SELECT final.
-- ============================================================================

SET NAMES utf8mb4;
SET @producto_id = 1;  -- ID del producto RCV

-- Hasta 800 kg. de peso: cosas 380.000 | personas 475.950 | prima 6.270
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 380000, '$.suma_persona', 475950, '$.prima_anual', 6270),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Hasta 800 Kg de Peso / PARTICULAR y RUSTICOS';

-- Más de 800 kg. de peso: cosas 380.000 | personas 475.950 | prima 6.270
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 380000, '$.suma_persona', 475950, '$.prima_anual', 6270),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Más de 800 Kg%';

-- Más de 800 kg. de peso (sin acento): cosas 380.000 | personas 475.950 | prima 6.270
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 380000, '$.suma_persona', 475950, '$.prima_anual', 6270),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Mas de 800 Kg%';

-- Táxi o Por Puesto: cosas 427.880 | personas 629.850 | prima 21.660
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 427880, '$.suma_persona', 629850, '$.prima_anual', 21660),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Alquiler Con Chofer, Taxi o Por Puesto / PARTICULA%';

-- Alquiler sin chofer: cosas 427.880 | personas 629.850 | prima 19.380
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 427880, '$.suma_persona', 629850, '$.prima_anual', 19380),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Alquiler Sin Chofer / PARTICULAR y RUSTICOS';

-- Auto – Escuela: cosas 427.880 | personas 629.850 | prima 8.550
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 427880, '$.suma_persona', 629850, '$.prima_anual', 8550),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Auto-Escuela / PARTICULAR y RUSTICOS';

-- Motocicletas: cosas 380.000 | personas 475.950 | prima 2.850
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 380000, '$.suma_persona', 475950, '$.prima_anual', 2850),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Motocicletas%';

-- Motocarro carga hasta 750 kg.: cosas 356.060 | personas 475.950 | prima 3.990
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 356060, '$.suma_persona', 475950, '$.prima_anual', 3990),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Carga hasta 750 kg de Capacidad / MOTOCARROS';

-- Hasta 2 TM. y/o CHUTO: cosas 356.630 | personas 475.950 | prima 8.550
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 356630, '$.suma_persona', 475950, '$.prima_anual', 8550),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Hasta 02 TM de Capacidad / Carga';

-- Hasta 2 TM. y/o CHUTO: cosas 356.630 | personas 475.950 | prima 8.550
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 356630, '$.suma_persona', 475950, '$.prima_anual', 8550),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'CHUTOS hasta 2TM / Chutos';

-- Hasta 2 TM. y/o CHUTO: cosas 356.630 | personas 475.950 | prima 8.550
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 356630, '$.suma_persona', 475950, '$.prima_anual', 8550),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Chutos / ninguna';

-- Más de 2 y hasta 5 TM.: cosas 416.480 | personas 629.850 | prima 10.450
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 416480, '$.suma_persona', 629850, '$.prima_anual', 10450),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '2-5 TM de capacidad / Carga';

-- Más de 5 hasta 8 TM.: cosas 439.280 | personas 653.790 | prima 15.960
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 439280, '$.suma_persona', 653790, '$.prima_anual', 15960),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '5-8 TM de Capacidad / Carga';

-- Más de 8 hasta 12 TM.: cosas 493.050 | personas 831.820 | prima 20.520
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20520),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '8-12 TM de capacidad / Carga';

-- Más de 12 TM.: cosas 493.050 | personas 831.820 | prima 20.900
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20900),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '12-13 TM de capacidad / Carga';

-- Más de 12 TM.: cosas 493.050 | personas 831.820 | prima 20.900
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20900),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '13-14M de capacidad / Carga';

-- Más de 12 TM.: cosas 493.050 | personas 831.820 | prima 20.900
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20900),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '14-15 TM de capacidad / Carga';

-- Más de 12 TM.: cosas 493.050 | personas 831.820 | prima 20.900
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20900),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '15-16 TM de capacidad / Carga';

-- Más de 12 TM.: cosas 493.050 | personas 831.820 | prima 20.900
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20900),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '17-18 TM de capacidad / Carga';

-- Más de 12 TM.: cosas 493.050 | personas 831.820 | prima 20.900
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 493050, '$.suma_persona', 831820, '$.prima_anual', 20900),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE '19-20 TM de capacidad / Carga';

-- Autobús urbanos: cosas 285.380 | personas 535.230 | prima 21.660
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 285380, '$.suma_persona', 535230, '$.prima_anual', 21660),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Urbanos / Bus';

-- Autobús suburbanos: cosas 285.380 | personas 535.230 | prima 21.660
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 285380, '$.suma_persona', 535230, '$.prima_anual', 21660),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Suburbanos / Bus';

-- Autobús interurbanos: cosas 380.000 | personas 713.260 | prima 49.020
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 380000, '$.suma_persona', 713260, '$.prima_anual', 49020),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Interurbanos / Bus';

-- Autobús urbano/suburbano (genérico): cosas 285.380 | personas 535.230 | prima 21.660
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 285380, '$.suma_persona', 535230, '$.prima_anual', 21660),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Bus / ninguna';

-- Minibús urbanos: cosas 285.380 | personas 535.230 | prima 14.250
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 285380, '$.suma_persona', 535230, '$.prima_anual', 14250),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Urbanos / Minibus';

-- Minibús suburbanos: cosas 285.380 | personas 535.230 | prima 14.250
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 285380, '$.suma_persona', 535230, '$.prima_anual', 14250),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Suburbanos / Minibus';

-- Minibús interurbanos: cosas 475.950 | personas 713.260 | prima 31.920
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 475950, '$.suma_persona', 713260, '$.prima_anual', 31920),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Interurbanos / Minibus';

-- Casas móviles con tracción propia: cosas 380.000 | personas 475.950 | prima 7.410
UPDATE tarifario
   SET datos = JSON_SET(datos, '$.suma_cosa', 380000, '$.suma_persona', 475950, '$.prima_anual', 7410),
       updated_at = NOW()
 WHERE producto_id = @producto_id AND estado = 'vigente' AND JSON_VALID(datos)
   AND nombre LIKE 'Casas Móviles con Tracción Propia / PARTICULAR y R%';

-- ── Revisión: cómo quedó cada tarifa vigente (verificar montos y detectar
-- las que NO fueron actualizadas por no tener equivalente en la tabla LEY) ──
SELECT id, nombre,
       JSON_EXTRACT(datos, '$.suma_cosa')    AS cosas_bs,
       JSON_EXTRACT(datos, '$.suma_persona') AS personas_bs,
       JSON_EXTRACT(datos, '$.prima_anual')  AS prima_bs,
       updated_at
  FROM tarifario
 WHERE producto_id = @producto_id AND estado = 'vigente'
 ORDER BY updated_at DESC, nombre;