-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db:3306
-- Tiempo de generación: 17-06-2026 a las 16:58:18
-- Versión del servidor: 8.0.46
-- Versión de PHP: 8.3.31

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sefired`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `audit_log`
--

CREATE TABLE `audit_log` (
  `id` bigint UNSIGNED NOT NULL,
  `modelo` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo_id` bigint UNSIGNED DEFAULT NULL,
  `accion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cambios` json DEFAULT NULL,
  `usuario_id` bigint UNSIGNED DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `audit_log`
--

INSERT INTO `audit_log` (`id`, `modelo`, `modelo_id`, `accion`, `cambios`, `usuario_id`, `ip`, `created_at`) VALUES
(1, 'Producto', 1, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:05'),
(2, 'Producto', 2, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:05'),
(3, 'Solicitud', 1, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:17'),
(4, 'Poliza', 1, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:17'),
(5, 'Solicitud', 2, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:17'),
(6, 'Poliza', 2, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:17'),
(7, 'Solicitud', 3, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:17'),
(8, 'Poliza', 3, 'created', NULL, NULL, '127.0.0.1', '2026-05-27 19:42:17'),
(9, 'Poliza', 1, 'updated', '{\"antes\": {\"snapshot_datos\": {\"placa\": \"AA111BB\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Particular RCV\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 20522.55, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 532.5, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 20522.55, \"total_usd\": 532.5, \"coberturas\": []}, \"fecha_emision\": \"2026-05-22\"}}, \"despues\": {\"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\",\\\"ci\\\":\\\"V-4961881\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\",\\\"ci\\\":\\\"V-4961881\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Veh\\\\u00edculo Particular RCV\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"15000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":532.5,\\\"total_bs\\\":20522.55},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"AA111BB\\\",\\\"fecha_emision\\\":\\\"2026-05-22\\\",\\\"total_usd\\\":532.5,\\\"total_bs\\\":20522.55}\"}}', NULL, '127.0.0.1', '2026-05-27 19:43:06'),
(10, 'Poliza', 2, 'updated', '{\"antes\": {\"snapshot_datos\": {\"placa\": \"CC222DD\", \"tomador\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Particular RCV\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 27525.268, \"asegurado\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 714.2, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 27525.268, \"total_usd\": 714.2, \"coberturas\": []}, \"fecha_emision\": \"2026-05-23\"}}, \"despues\": {\"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"PEDRO JOSE SALAZAR\\\",\\\"ci\\\":\\\"V-12345678\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"PEDRO JOSE SALAZAR\\\",\\\"ci\\\":\\\"V-12345678\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Veh\\\\u00edculo Particular RCV\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"15000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":714.2,\\\"total_bs\\\":27525.268},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"CC222DD\\\",\\\"fecha_emision\\\":\\\"2026-05-23\\\",\\\"total_usd\\\":714.2,\\\"total_bs\\\":27525.268}\"}}', NULL, '127.0.0.1', '2026-05-27 19:43:06'),
(11, 'Poliza', 3, 'updated', '{\"antes\": {\"snapshot_datos\": {\"placa\": \"EE333FF\", \"tomador\": {\"ci\": \"V-87654321\", \"nombre\": \"ANA MARIA SUAREZ\"}, \"producto\": {\"id\": 2, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Comercial\", \"cobertura\": \"25000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 47789.6, \"asegurado\": {\"ci\": \"V-87654321\", \"nombre\": \"ANA MARIA SUAREZ\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 1240, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 47789.6, \"total_usd\": 1240, \"coberturas\": []}, \"fecha_emision\": \"2026-05-24\"}}, \"despues\": {\"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"ANA MARIA SUAREZ\\\",\\\"ci\\\":\\\"V-87654321\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"ANA MARIA SUAREZ\\\",\\\"ci\\\":\\\"V-87654321\\\"},\\\"producto\\\":{\\\"id\\\":2,\\\"nombre\\\":\\\"Veh\\\\u00edculo Comercial\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"25000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":1240,\\\"total_bs\\\":47789.6},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"EE333FF\\\",\\\"fecha_emision\\\":\\\"2026-05-24\\\",\\\"total_usd\\\":1240,\\\"total_bs\\\":47789.6}\"}}', NULL, '127.0.0.1', '2026-05-27 19:43:06'),
(12, 'Solicitud', 4, 'created', NULL, 1, '172.18.0.5', '2026-05-28 19:09:45'),
(13, 'Solicitud', 4, 'updated', '{\"antes\": {\"status\": \"En Revisión\"}, \"despues\": {\"status\": \"Aprobado\"}}', 1, '172.18.0.5', '2026-05-28 19:10:09'),
(14, 'Poliza', 4, 'created', NULL, 1, '172.18.0.5', '2026-05-28 19:13:39'),
(15, 'Poliza', 4, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a1893e3b9709\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00004\"}}', 1, '172.18.0.5', '2026-05-28 19:13:39'),
(16, 'Factura', 1, 'created', NULL, 1, '172.18.0.5', '2026-05-28 19:13:39'),
(17, 'Solicitud', 4, 'updated', '{\"antes\": {\"status\": \"Aprobado\"}, \"despues\": {\"status\": \"Emitida\"}}', 1, '172.18.0.5', '2026-05-28 19:13:39'),
(18, 'Solicitud', 5, 'created', NULL, 1, '172.18.0.5', '2026-05-28 19:16:18'),
(19, 'Solicitud', 5, 'updated', '{\"antes\": {\"coberturas\": {\"iva\": 0, \"uso\": \"Particular\", \"año\": \"2026\", \"color\": \"Blanco\", \"marca\": \"Toyota\", \"total\": 0, \"modelo\": \"Aslgoe\", \"tarifa\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\"}, \"tasaBCV\": 540.0431, \"subtotal\": 0, \"total_bs\": 0, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 150000, \"derecho_poliza\": 0, \"valor_declarado\": 0, \"documentos_requeridos\": []}}, \"despues\": {\"coberturas\": \"{\\\"tasaBCV\\\":540.0431,\\\"subtotal\\\":0,\\\"iva\\\":0,\\\"derecho_poliza\\\":0,\\\"total\\\":0,\\\"total_bs\\\":0,\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"documentos_requeridos\\\":[],\\\"marca\\\":\\\"Toyota\\\",\\\"modelo\\\":\\\"Aslgoe\\\",\\\"a\\\\u00f1o\\\":\\\"2026\\\",\\\"color\\\":\\\"Blanco\\\",\\\"uso\\\":\\\"Particular\\\",\\\"valor_mercado\\\":150000,\\\"valor_declarado\\\":0,\\\"tarifa\\\":null}\"}}', 1, '172.18.0.5', '2026-05-28 19:17:09'),
(20, 'Solicitud', 1, 'updated', '{\"antes\": {\"vendedor_id\": 1, \"fecha_solicitud\": \"2026-05-22T00:00:00.000000Z\"}, \"despues\": {\"vendedor_id\": 2, \"fecha_solicitud\": \"2026-05-02 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:04'),
(21, 'Poliza', 1, 'updated', '{\"antes\": {\"sede_poliza\": \"Sede Central\", \"vendedor_id\": 1, \"nro_contrato\": \"POL-2026-00001\", \"fecha_emision\": \"2026-05-22T00:00:00.000000Z\", \"snapshot_datos\": {\"placa\": \"AA111BB\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Particular RCV\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 20522.55, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 532.5, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 20522.55, \"total_usd\": 532.5, \"coberturas\": []}, \"fecha_emision\": \"2026-05-22\"}, \"fecha_vencimiento\": \"2027-05-22T00:00:00.000000Z\"}, \"despues\": {\"sede_poliza\": \"Valencia\", \"vendedor_id\": 2, \"nro_contrato\": \"SEF-2026-VEH-00848\", \"fecha_emision\": \"2026-05-02 00:00:00\", \"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\",\\\"ci\\\":\\\"V-4961881\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\",\\\"ci\\\":\\\"V-4961881\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Veh\\\\u00edculo Particular RCV\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"15000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":532.5,\\\"total_bs\\\":20522.55},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"AA111BB\\\",\\\"fecha_emision\\\":\\\"2026-05-02\\\",\\\"total_usd\\\":532.5,\\\"total_bs\\\":20522.55}\", \"fecha_vencimiento\": \"2027-05-02 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:04'),
(22, 'Solicitud', 2, 'updated', '{\"antes\": {\"vendedor_id\": 1, \"fecha_solicitud\": \"2026-05-23T00:00:00.000000Z\"}, \"despues\": {\"vendedor_id\": 3, \"fecha_solicitud\": \"2026-05-01 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:04'),
(23, 'Poliza', 2, 'updated', '{\"antes\": {\"sede_poliza\": \"Sede Central\", \"vendedor_id\": 1, \"nro_contrato\": \"POL-2026-00002\", \"fecha_emision\": \"2026-05-23T00:00:00.000000Z\", \"snapshot_datos\": {\"placa\": \"CC222DD\", \"tomador\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Particular RCV\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 27525.268, \"asegurado\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 714.2, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 27525.268, \"total_usd\": 714.2, \"coberturas\": []}, \"fecha_emision\": \"2026-05-23\"}, \"fecha_vencimiento\": \"2027-05-23T00:00:00.000000Z\"}, \"despues\": {\"sede_poliza\": \"Caracas\", \"vendedor_id\": 3, \"nro_contrato\": \"SEF-2026-VEH-00847\", \"fecha_emision\": \"2026-05-01 00:00:00\", \"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"PEDRO JOSE SALAZAR\\\",\\\"ci\\\":\\\"V-12345678\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"PEDRO JOSE SALAZAR\\\",\\\"ci\\\":\\\"V-12345678\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Veh\\\\u00edculo Particular RCV\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"15000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":714.2,\\\"total_bs\\\":27525.268},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"CC222DD\\\",\\\"fecha_emision\\\":\\\"2026-05-01\\\",\\\"total_usd\\\":714.2,\\\"total_bs\\\":27525.268}\", \"fecha_vencimiento\": \"2027-05-01 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:04'),
(24, 'Solicitud', 3, 'updated', '{\"antes\": {\"vendedor_id\": 1, \"fecha_solicitud\": \"2026-05-24T00:00:00.000000Z\"}, \"despues\": {\"vendedor_id\": 4, \"fecha_solicitud\": \"2026-04-30 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:05'),
(25, 'Poliza', 3, 'updated', '{\"antes\": {\"sede_poliza\": \"Sede Central\", \"vendedor_id\": 1, \"nro_contrato\": \"POL-2026-00003\", \"fecha_emision\": \"2026-05-24T00:00:00.000000Z\", \"snapshot_datos\": {\"placa\": \"EE333FF\", \"tomador\": {\"ci\": \"V-87654321\", \"nombre\": \"ANA MARIA SUAREZ\"}, \"producto\": {\"id\": 2, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Comercial\", \"cobertura\": \"25000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 47789.6, \"asegurado\": {\"ci\": \"V-87654321\", \"nombre\": \"ANA MARIA SUAREZ\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 1240, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 47789.6, \"total_usd\": 1240, \"coberturas\": []}, \"fecha_emision\": \"2026-05-24\"}, \"fecha_vencimiento\": \"2027-05-24T00:00:00.000000Z\"}, \"despues\": {\"sede_poliza\": \"Caracas\", \"vendedor_id\": 4, \"nro_contrato\": \"SEF-2026-VEH-00846\", \"fecha_emision\": \"2026-04-30 00:00:00\", \"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"ANA MARIA SUAREZ\\\",\\\"ci\\\":\\\"V-87654321\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"ANA MARIA SUAREZ\\\",\\\"ci\\\":\\\"V-87654321\\\"},\\\"producto\\\":{\\\"id\\\":2,\\\"nombre\\\":\\\"Veh\\\\u00edculo Comercial\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"25000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":1240,\\\"total_bs\\\":47789.6},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"EE333FF\\\",\\\"fecha_emision\\\":\\\"2026-04-30\\\",\\\"total_usd\\\":1240,\\\"total_bs\\\":47789.6}\", \"fecha_vencimiento\": \"2027-04-30 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:05'),
(26, 'Solicitud', 1, 'updated', '{\"antes\": {\"total\": \"532.50\", \"total_bs\": \"20522.55\", \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 20522.55, \"total_usd\": 532.5, \"coberturas\": []}, \"vendedor_id\": 2, \"suma_prima_bs\": \"20522.55\", \"fecha_solicitud\": \"2026-05-02T00:00:00.000000Z\"}, \"despues\": {\"total\": 487, \"total_bs\": 18768.98, \"coberturas\": \"{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":487,\\\"total_bs\\\":18768.98}\", \"vendedor_id\": 5, \"suma_prima_bs\": 18768.98, \"fecha_solicitud\": \"2026-04-29 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:05'),
(27, 'Poliza', 1, 'updated', '{\"antes\": {\"total\": \"532.50\", \"total_bs\": \"20522.55\", \"sede_poliza\": \"Valencia\", \"vendedor_id\": 2, \"nro_contrato\": \"SEF-2026-VEH-00848\", \"fecha_emision\": \"2026-05-02T00:00:00.000000Z\", \"snapshot_datos\": {\"placa\": \"AA111BB\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Particular RCV\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 20522.55, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 532.5, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 20522.55, \"total_usd\": 532.5, \"coberturas\": []}, \"fecha_emision\": \"2026-05-02\"}, \"fecha_vencimiento\": \"2027-05-02T00:00:00.000000Z\"}, \"despues\": {\"total\": 487, \"total_bs\": 18768.98, \"sede_poliza\": \"Maracaibo\", \"vendedor_id\": 5, \"nro_contrato\": \"SEF-2026-VEH-00845\", \"fecha_emision\": \"2026-04-29 00:00:00\", \"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\",\\\"ci\\\":\\\"V-4961881\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\",\\\"ci\\\":\\\"V-4961881\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Veh\\\\u00edculo Particular RCV\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"15000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":487,\\\"total_bs\\\":18768.98},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"AA111BB\\\",\\\"fecha_emision\\\":\\\"2026-04-29\\\",\\\"total_usd\\\":487,\\\"total_bs\\\":18768.98}\", \"fecha_vencimiento\": \"2027-04-29 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:05'),
(28, 'Solicitud', 2, 'updated', '{\"antes\": {\"total\": \"714.20\", \"total_bs\": \"27525.27\", \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 27525.268, \"total_usd\": 714.2, \"coberturas\": []}, \"vendedor_id\": 3, \"suma_prima_bs\": \"27525.27\", \"fecha_solicitud\": \"2026-05-01T00:00:00.000000Z\"}, \"despues\": {\"total\": 350, \"total_bs\": 13489, \"coberturas\": \"{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":350,\\\"total_bs\\\":13489}\", \"vendedor_id\": 2, \"suma_prima_bs\": 13489, \"fecha_solicitud\": \"2026-04-25 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:05'),
(29, 'Poliza', 2, 'updated', '{\"antes\": {\"pago\": \"Financiado\", \"total\": \"714.20\", \"status\": \"ACTIVA\", \"total_bs\": \"27525.27\", \"sede_poliza\": \"Caracas\", \"vendedor_id\": 3, \"nro_contrato\": \"SEF-2026-VEH-00847\", \"fecha_emision\": \"2026-05-01T00:00:00.000000Z\", \"snapshot_datos\": {\"placa\": \"CC222DD\", \"tomador\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"Vehículo Particular RCV\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 38.54, \"total_bs\": 27525.268, \"asegurado\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"tasa\": 38.54}, \"nombre\": \"Tarifario General 2026\", \"version\": 1}, \"total_usd\": 714.2, \"coberturas\": {\"tasaBCV\": 38.54, \"total_bs\": 27525.268, \"total_usd\": 714.2, \"coberturas\": []}, \"fecha_emision\": \"2026-05-01\"}, \"fecha_vencimiento\": \"2027-05-01T00:00:00.000000Z\"}, \"despues\": {\"pago\": \"Contado\", \"total\": 350, \"status\": \"ANULADA\", \"total_bs\": 13489, \"sede_poliza\": \"Valencia\", \"vendedor_id\": 2, \"nro_contrato\": \"SEF-2026-VEH-00844\", \"fecha_emision\": \"2026-04-25 00:00:00\", \"snapshot_datos\": \"{\\\"tomador\\\":{\\\"nombre\\\":\\\"PEDRO JOSE SALAZAR\\\",\\\"ci\\\":\\\"V-12345678\\\"},\\\"asegurado\\\":{\\\"nombre\\\":\\\"PEDRO JOSE SALAZAR\\\",\\\"ci\\\":\\\"V-12345678\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Veh\\\\u00edculo Particular RCV\\\",\\\"tipo\\\":\\\"rcv\\\",\\\"tipo_calculo\\\":\\\"fijo\\\",\\\"cobertura\\\":\\\"15000.00\\\"},\\\"tarifario\\\":{\\\"id\\\":1,\\\"nombre\\\":\\\"Tarifario General 2026\\\",\\\"version\\\":1,\\\"datos\\\":{\\\"tasa\\\":38.54}},\\\"coberturas\\\":{\\\"tasaBCV\\\":38.54,\\\"coberturas\\\":[],\\\"total_usd\\\":350,\\\"total_bs\\\":13489},\\\"tasa_bcv\\\":38.54,\\\"placa\\\":\\\"CC222DD\\\",\\\"fecha_emision\\\":\\\"2026-04-25\\\",\\\"total_usd\\\":350,\\\"total_bs\\\":13489}\", \"fecha_vencimiento\": \"2027-04-25 00:00:00\"}}', NULL, '127.0.0.1', '2026-06-01 22:37:05');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `audit_log`
--
ALTER TABLE `audit_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_modelo` (`modelo`,`modelo_id`),
  ADD KEY `idx_audit_usuario` (`usuario_id`),
  ADD KEY `idx_audit_fecha` (`created_at`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
