-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db:3306
-- Tiempo de generación: 21-06-2026 a las 16:12:09
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
(1, 'Solicitud', 4, 'created', NULL, 5, '172.20.0.9', '2026-06-17 19:40:34'),
(2, 'Solicitud', 4, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 5, '172.20.0.9', '2026-06-17 19:40:55'),
(3, 'Solicitud', 5, 'created', NULL, 5, '172.20.0.9', '2026-06-19 14:00:46'),
(4, 'Solicitud', 5, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 5, '172.20.0.9', '2026-06-19 14:00:50'),
(5, 'Poliza', 4, 'created', NULL, 5, '172.20.0.9', '2026-06-19 14:00:57'),
(6, 'Poliza', 4, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a354b99f1fa3\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00004\"}}', 5, '172.20.0.9', '2026-06-19 14:00:57'),
(7, 'Factura', 1, 'created', NULL, 5, '172.20.0.9', '2026-06-19 14:00:57'),
(8, 'Solicitud', 5, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 5, '172.20.0.9', '2026-06-19 14:00:57'),
(9, 'Solicitud', 6, 'created', NULL, NULL, '127.0.0.1', '2026-06-19 18:47:21'),
(10, 'Solicitud', 7, 'created', NULL, NULL, '127.0.0.1', '2026-06-19 18:47:21'),
(11, 'Producto', 1, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', NULL, '127.0.0.1', '2026-06-19 19:13:36'),
(12, 'Producto', 10, 'deleted', NULL, 5, '172.20.0.1', '2026-06-20 01:07:57'),
(13, 'Solicitud', 8, 'created', NULL, 5, '172.20.0.1', '2026-06-20 02:06:44'),
(14, 'Solicitud', 8, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 5, '172.20.0.1', '2026-06-20 02:07:18'),
(15, 'Poliza', 5, 'created', NULL, 5, '172.20.0.1', '2026-06-20 02:07:35'),
(16, 'Poliza', 5, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a35f5e73db97\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00005\"}}', 5, '172.20.0.1', '2026-06-20 02:07:35'),
(17, 'Factura', 2, 'created', NULL, 5, '172.20.0.1', '2026-06-20 02:07:35'),
(18, 'Solicitud', 8, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 5, '172.20.0.1', '2026-06-20 02:07:35'),
(19, 'Solicitud', 9, 'created', NULL, 5, '172.20.0.1', '2026-06-19 22:22:27'),
(20, 'Solicitud', 9, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 5, '172.20.0.1', '2026-06-19 22:22:43'),
(21, 'Solicitud', 9, 'deleted', NULL, 5, '172.20.0.1', '2026-06-19 22:23:28'),
(22, 'Producto', 11, 'created', NULL, 5, '172.20.0.1', '2026-06-19 22:29:15'),
(23, 'Producto', 11, 'updated', '{\"antes\": {\"derecho_poliza\": \"5000.00\"}, \"despues\": {\"derecho_poliza\": 7000}}', 5, '172.20.0.1', '2026-06-19 22:29:28'),
(24, 'Producto', 7, 'deleted', NULL, 5, '172.20.0.1', '2026-06-19 22:29:58'),
(25, 'Poliza', 1, 'updated', '{\"antes\": {\"status\": \"ACTIVA\"}, \"despues\": {\"status\": \"VENCIDA\"}}', NULL, '127.0.0.1', '2026-06-19 23:01:15'),
(26, 'Poliza', 1, 'updated', '{\"antes\": {\"status\": \"VENCIDA\"}, \"despues\": {\"status\": \"ACTIVA\"}}', NULL, '127.0.0.1', '2026-06-19 23:01:23'),
(27, 'Producto', 11, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', NULL, '172.20.0.1', '2026-06-20 07:12:25'),
(28, 'Producto', 11, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', NULL, '172.20.0.1', '2026-06-20 07:12:40'),
(29, 'Solicitud', 10, 'created', NULL, 5, '172.20.0.1', '2026-06-20 07:56:08'),
(30, 'Solicitud', 10, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 5, '172.20.0.1', '2026-06-20 07:56:13'),
(31, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 07:59:53'),
(32, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 07:59:56'),
(33, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 07:59:57'),
(34, 'Producto', 11, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', NULL, '172.20.0.1', '2026-06-20 08:09:29'),
(35, 'Producto', 11, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', NULL, '172.20.0.1', '2026-06-20 08:09:59'),
(36, 'Producto', 2, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 08:17:22'),
(37, 'Producto', 2, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 08:17:34'),
(38, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 08:17:38'),
(39, 'Solicitud', 10, 'deleted', NULL, 5, '172.20.0.1', '2026-06-20 08:21:48'),
(40, 'Solicitud', 11, 'created', NULL, 5, '172.20.0.1', '2026-06-20 08:24:02'),
(41, 'Solicitud', 11, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 5, '172.20.0.1', '2026-06-20 08:24:11'),
(42, 'Poliza', 6, 'created', NULL, 5, '172.20.0.1', '2026-06-20 08:24:39'),
(43, 'Poliza', 6, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a3686870e0f7\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00006\"}}', 5, '172.20.0.1', '2026-06-20 08:24:39'),
(44, 'Factura', 3, 'created', NULL, 5, '172.20.0.1', '2026-06-20 08:24:39'),
(45, 'Solicitud', 11, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 5, '172.20.0.1', '2026-06-20 08:24:39'),
(46, 'Solicitud', 12, 'created', NULL, NULL, '172.20.0.1', '2026-06-20 08:33:50'),
(47, 'Solicitud', 12, 'deleted', NULL, NULL, '127.0.0.1', '2026-06-20 08:34:08'),
(48, 'Poliza', 1, 'updated', '{\"antes\": {\"status\": \"ACTIVA\"}, \"despues\": {\"status\": \"RENOVADA\"}}', NULL, '172.20.0.1', '2026-06-20 09:32:19'),
(49, 'Poliza', 7, 'created', NULL, NULL, '172.20.0.1', '2026-06-20 09:32:19'),
(50, 'Poliza', 7, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a3696633658f\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00007\"}}', NULL, '172.20.0.1', '2026-06-20 09:32:19'),
(51, 'Factura', 4, 'created', NULL, NULL, '172.20.0.1', '2026-06-20 09:32:19'),
(52, 'Poliza', 7, 'deleted', NULL, NULL, '127.0.0.1', '2026-06-20 09:33:27'),
(53, 'Poliza', 1, 'updated', '{\"antes\": {\"status\": \"RENOVADA\"}, \"despues\": {\"status\": \"ACTIVA\"}}', NULL, '127.0.0.1', '2026-06-20 09:33:28'),
(54, 'Producto', 8, 'updated', '{\"antes\": {\"descripcion\": \"Cobertura individual por accidentes sin vínculo a vehículo\"}, \"despues\": {\"descripcion\": \"Descripcion de prueba QA audit_log\"}}', NULL, '172.20.0.1', '2026-06-20 10:15:25'),
(55, 'Producto', 8, 'updated', '{\"antes\": {\"descripcion\": \"Descripcion de prueba QA audit_log\"}, \"despues\": {\"descripcion\": \"Cobertura individual por accidentes sin vínculo a vehículo\"}}', NULL, '127.0.0.1', '2026-06-20 10:16:01'),
(56, 'Poliza', 1, 'updated', '{\"antes\": {\"papeleria\": null}, \"despues\": {\"papeleria\": \"CERT-001234\"}}', NULL, '172.20.0.1', '2026-06-20 10:27:44'),
(57, 'Poliza', 1, 'updated', '{\"antes\": {\"nro_venezolana\": null}, \"despues\": {\"nro_venezolana\": \"VZ-998877\"}}', NULL, '172.20.0.1', '2026-06-20 10:30:09'),
(58, 'Poliza', 1, 'updated', '{\"antes\": {\"papeleria\": \"CERT-001234\", \"nro_venezolana\": \"VZ-998877\"}, \"despues\": {\"papeleria\": null, \"nro_venezolana\": null}}', NULL, '127.0.0.1', '2026-06-20 10:30:16'),
(59, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 14:11:32'),
(60, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 14:11:33'),
(61, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 14:11:36'),
(62, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 14:11:37'),
(63, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 14:33:39'),
(64, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 14:33:42'),
(65, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 15:58:01'),
(66, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 15:58:02'),
(67, 'Solicitud', 13, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(68, 'Solicitud', 13, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:07'),
(69, 'Poliza', 8, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(70, 'Poliza', 8, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4b35e18\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00008\"}}', 4, '::1', '2026-06-20 18:55:07'),
(71, 'Factura', 5, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(72, 'Solicitud', 13, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:07'),
(73, 'Solicitud', 14, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(74, 'Solicitud', 14, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:07'),
(75, 'Poliza', 9, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(76, 'Poliza', 9, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4b5c8f6\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00009\"}}', 4, '::1', '2026-06-20 18:55:07'),
(77, 'Factura', 6, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(78, 'Solicitud', 14, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:07'),
(79, 'Solicitud', 15, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(80, 'Solicitud', 15, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:07'),
(81, 'Poliza', 10, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(82, 'Poliza', 10, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4b94b08\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00010\"}}', 4, '::1', '2026-06-20 18:55:07'),
(83, 'Factura', 7, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(84, 'Solicitud', 15, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:07'),
(85, 'Solicitud', 16, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(86, 'Solicitud', 16, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:07'),
(87, 'Poliza', 11, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(88, 'Poliza', 11, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4bc9bac\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00011\"}}', 4, '::1', '2026-06-20 18:55:07'),
(89, 'Factura', 8, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(90, 'Solicitud', 16, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:07'),
(91, 'Solicitud', 17, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(92, 'Solicitud', 17, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:07'),
(93, 'Poliza', 12, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(94, 'Poliza', 12, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4bef65e\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00012\"}}', 4, '::1', '2026-06-20 18:55:07'),
(95, 'Factura', 9, 'created', NULL, 4, '::1', '2026-06-20 18:55:07'),
(96, 'Solicitud', 17, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:07'),
(97, 'Solicitud', 18, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(98, 'Solicitud', 18, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:08'),
(99, 'Poliza', 13, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(100, 'Poliza', 13, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4c22f9c\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00013\"}}', 4, '::1', '2026-06-20 18:55:08'),
(101, 'Factura', 10, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(102, 'Solicitud', 18, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:08'),
(103, 'Solicitud', 19, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(104, 'Solicitud', 19, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:08'),
(105, 'Poliza', 14, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(106, 'Poliza', 14, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4c42822\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00014\"}}', 4, '::1', '2026-06-20 18:55:08'),
(107, 'Factura', 11, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(108, 'Solicitud', 19, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:08'),
(109, 'Solicitud', 20, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(110, 'Solicitud', 20, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:08'),
(111, 'Poliza', 15, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(112, 'Poliza', 15, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a4c5e0d3\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00015\"}}', 4, '::1', '2026-06-20 18:55:08'),
(113, 'Factura', 12, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(114, 'Solicitud', 20, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:55:08'),
(115, 'Solicitud', 21, 'created', NULL, 4, '::1', '2026-06-20 18:55:08'),
(116, 'Solicitud', 21, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:55:08'),
(117, 'Poliza', 16, 'created', NULL, 4, '::1', '2026-06-20 18:56:18'),
(118, 'Poliza', 16, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371a921300e\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00016\"}}', 4, '::1', '2026-06-20 18:56:18'),
(119, 'Factura', 13, 'created', NULL, 4, '::1', '2026-06-20 18:56:18'),
(120, 'Solicitud', 21, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:56:18'),
(121, 'Solicitud', 22, 'created', NULL, 4, '::1', '2026-06-20 18:56:57'),
(122, 'Solicitud', 22, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:56:59'),
(123, 'Poliza', 17, 'created', NULL, 4, '::1', '2026-06-20 18:57:01'),
(124, 'Poliza', 17, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371abd5bd99\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00017\"}}', 4, '::1', '2026-06-20 18:57:01'),
(125, 'Factura', 14, 'created', NULL, 4, '::1', '2026-06-20 18:57:01'),
(126, 'Solicitud', 22, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:01'),
(127, 'Solicitud', 23, 'created', NULL, 4, '::1', '2026-06-20 18:57:05'),
(128, 'Solicitud', 23, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:06'),
(129, 'Poliza', 18, 'created', NULL, 4, '::1', '2026-06-20 18:57:08'),
(130, 'Poliza', 18, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371ac4b662d\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00018\"}}', 4, '::1', '2026-06-20 18:57:08'),
(131, 'Factura', 15, 'created', NULL, 4, '::1', '2026-06-20 18:57:08'),
(132, 'Solicitud', 23, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:08'),
(133, 'Solicitud', 24, 'created', NULL, 4, '::1', '2026-06-20 18:57:12'),
(134, 'Solicitud', 24, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:14'),
(135, 'Poliza', 19, 'created', NULL, 4, '::1', '2026-06-20 18:57:16'),
(136, 'Poliza', 19, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371acc1a3b4\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00019\"}}', 4, '::1', '2026-06-20 18:57:16'),
(137, 'Factura', 16, 'created', NULL, 4, '::1', '2026-06-20 18:57:16'),
(138, 'Solicitud', 24, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:16'),
(139, 'Solicitud', 25, 'created', NULL, 4, '::1', '2026-06-20 18:57:19'),
(140, 'Solicitud', 25, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:21'),
(141, 'Poliza', 20, 'created', NULL, 4, '::1', '2026-06-20 18:57:23'),
(142, 'Poliza', 20, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371ad377b5a\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00020\"}}', 4, '::1', '2026-06-20 18:57:23'),
(143, 'Factura', 17, 'created', NULL, 4, '::1', '2026-06-20 18:57:23'),
(144, 'Solicitud', 25, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:23'),
(145, 'Solicitud', 26, 'created', NULL, 4, '::1', '2026-06-20 18:57:27'),
(146, 'Solicitud', 26, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:29'),
(147, 'Poliza', 21, 'created', NULL, 4, '::1', '2026-06-20 18:57:30'),
(148, 'Poliza', 21, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371adad46e0\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00021\"}}', 4, '::1', '2026-06-20 18:57:30'),
(149, 'Factura', 18, 'created', NULL, 4, '::1', '2026-06-20 18:57:30'),
(150, 'Solicitud', 26, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:30'),
(151, 'Solicitud', 27, 'created', NULL, 4, '::1', '2026-06-20 18:57:34'),
(152, 'Solicitud', 27, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:36'),
(153, 'Poliza', 22, 'created', NULL, 4, '::1', '2026-06-20 18:57:38'),
(154, 'Poliza', 22, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371ae2381ff\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00022\"}}', 4, '::1', '2026-06-20 18:57:38'),
(155, 'Factura', 19, 'created', NULL, 4, '::1', '2026-06-20 18:57:38'),
(156, 'Solicitud', 27, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:38'),
(157, 'Solicitud', 28, 'created', NULL, 4, '::1', '2026-06-20 18:57:41'),
(158, 'Solicitud', 28, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:43'),
(159, 'Poliza', 23, 'created', NULL, 4, '::1', '2026-06-20 18:57:45'),
(160, 'Poliza', 23, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371ae992021\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00023\"}}', 4, '::1', '2026-06-20 18:57:45'),
(161, 'Factura', 20, 'created', NULL, 4, '::1', '2026-06-20 18:57:45'),
(162, 'Solicitud', 28, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:45'),
(163, 'Solicitud', 29, 'created', NULL, 4, '::1', '2026-06-20 18:57:49'),
(164, 'Solicitud', 29, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:51'),
(165, 'Poliza', 24, 'created', NULL, 4, '::1', '2026-06-20 18:57:52'),
(166, 'Poliza', 24, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371af0ed22c\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00024\"}}', 4, '::1', '2026-06-20 18:57:52'),
(167, 'Factura', 21, 'created', NULL, 4, '::1', '2026-06-20 18:57:52'),
(168, 'Solicitud', 29, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:57:52'),
(169, 'Solicitud', 30, 'created', NULL, 4, '::1', '2026-06-20 18:57:56'),
(170, 'Solicitud', 30, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:57:58'),
(171, 'Poliza', 25, 'created', NULL, 4, '::1', '2026-06-20 18:58:00'),
(172, 'Poliza', 25, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371af855da8\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00025\"}}', 4, '::1', '2026-06-20 18:58:00'),
(173, 'Factura', 22, 'created', NULL, 4, '::1', '2026-06-20 18:58:00'),
(174, 'Solicitud', 30, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:58:00'),
(175, 'Solicitud', 31, 'created', NULL, 4, '::1', '2026-06-20 18:58:05'),
(176, 'Solicitud', 31, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:58:07'),
(177, 'Poliza', 26, 'created', NULL, 4, '::1', '2026-06-20 18:58:09'),
(178, 'Poliza', 26, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371b0189455\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00026\"}}', 4, '::1', '2026-06-20 18:58:09'),
(179, 'Factura', 23, 'created', NULL, 4, '::1', '2026-06-20 18:58:09'),
(180, 'Solicitud', 31, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:58:09'),
(181, 'Solicitud', 32, 'created', NULL, 4, '::1', '2026-06-20 18:58:15'),
(182, 'Solicitud', 32, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-20 18:58:16'),
(183, 'Poliza', 27, 'created', NULL, 4, '::1', '2026-06-20 18:58:18'),
(184, 'Poliza', 27, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a371b0abf644\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00027\"}}', 4, '::1', '2026-06-20 18:58:18'),
(185, 'Factura', 24, 'created', NULL, 4, '::1', '2026-06-20 18:58:18'),
(186, 'Solicitud', 32, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-20 18:58:18'),
(187, 'Solicitud', 33, 'created', NULL, NULL, '127.0.0.1', '2026-06-20 19:00:21'),
(188, 'Solicitud', 33, 'deleted', NULL, NULL, '127.0.0.1', '2026-06-20 19:00:21'),
(189, 'Solicitud', 33, 'deleted', NULL, NULL, '127.0.0.1', '2026-06-20 19:00:30'),
(190, 'Solicitud', 34, 'created', NULL, 5, '172.20.0.1', '2026-06-20 22:48:13'),
(191, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": true}, \"despues\": {\"publicado\": false}}', 5, '172.20.0.1', '2026-06-20 22:50:37'),
(192, 'Producto', 8, 'updated', '{\"antes\": {\"publicado\": false}, \"despues\": {\"publicado\": true}}', 5, '172.20.0.1', '2026-06-20 22:50:46'),
(193, 'Producto', 12, 'created', NULL, 4, '::1', '2026-06-21 08:59:01'),
(194, 'Solicitud', 35, 'created', NULL, 4, '::1', '2026-06-21 08:59:02'),
(195, 'Solicitud', 35, 'updated', '{\"antes\": {\"status\": \"en_revision\"}, \"despues\": {\"status\": \"aprobado\"}}', 4, '::1', '2026-06-21 08:59:02'),
(196, 'Poliza', 28, 'created', NULL, 4, '::1', '2026-06-21 08:59:02'),
(197, 'Poliza', 28, 'updated', '{\"antes\": {\"nro_contrato\": \"TMP-6a37e01633e0e\"}, \"despues\": {\"nro_contrato\": \"POL-2026-00028\"}}', 4, '::1', '2026-06-21 08:59:02'),
(198, 'Factura', 25, 'created', NULL, 4, '::1', '2026-06-21 08:59:02'),
(199, 'Solicitud', 35, 'updated', '{\"antes\": {\"status\": \"aprobado\"}, \"despues\": {\"status\": \"emitida\"}}', 4, '::1', '2026-06-21 08:59:02'),
(203, 'Poliza', 28, 'deleted', NULL, NULL, '127.0.0.1', '2026-06-21 09:01:55'),
(204, 'Solicitud', 35, 'deleted', NULL, NULL, '127.0.0.1', '2026-06-21 09:01:55'),
(205, 'Producto', 13, 'created', NULL, 4, '172.20.0.1', '2026-06-21 09:26:19'),
(206, 'Producto', 14, 'created', NULL, 4, '172.20.0.1', '2026-06-21 09:35:26'),
(207, 'Producto', 13, 'deleted', NULL, 4, '172.20.0.1', '2026-06-21 09:36:37'),
(208, 'Producto', 14, 'deleted', NULL, 4, '172.20.0.1', '2026-06-21 09:36:37'),
(209, 'Poliza', 1, 'updated', '{\"antes\": {\"snapshot_datos\": {\"placa\": \"AA111BB\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Bu00e1sico\"}, \"total_bs\": 256524.37, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"total_usd\": 487}}, \"despues\": {\"snapshot_datos\": \"{\\\"placa\\\":\\\"AA111BB\\\",\\\"tomador\\\":{\\\"ci\\\":\\\"V-4961881\\\",\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"tipo\\\":\\\"rcv\\\",\\\"nombre\\\":\\\"RCV Bu00e1sico\\\"},\\\"total_bs\\\":256524.37,\\\"asegurado\\\":{\\\"ci\\\":\\\"V-4961881\\\",\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\"},\\\"total_usd\\\":487,\\\"tarifario\\\":{\\\"datos\\\":{\\\"prima_anual\\\":120,\\\"suma_persona\\\":5000,\\\"suma_cosa\\\":5000,\\\"deducible\\\":0,\\\"asistencia_vial\\\":1500,\\\"exceso_limite\\\":0,\\\"defensa_penal\\\":0,\\\"muerte_invalidez\\\":0,\\\"gastos_medicos\\\":0,\\\"gastos_funerarios\\\":0}}}\"}}', NULL, '127.0.0.1', '2026-06-21 11:12:53'),
(210, 'Poliza', 1, 'updated', '{\"antes\": {\"snapshot_datos\": {\"placa\": \"AA111BB\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Bu00e1sico\"}, \"total_bs\": 256524.37, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"tarifario\": {\"datos\": {\"deducible\": 0, \"suma_cosa\": 5000, \"prima_anual\": 120, \"suma_persona\": 5000, \"defensa_penal\": 0, \"exceso_limite\": 0, \"gastos_medicos\": 0, \"asistencia_vial\": 1500, \"muerte_invalidez\": 0, \"gastos_funerarios\": 0}}, \"total_usd\": 487}}, \"despues\": {\"snapshot_datos\": \"{\\\"placa\\\":\\\"AA111BB\\\",\\\"tomador\\\":{\\\"ci\\\":\\\"V-4961881\\\",\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\"},\\\"producto\\\":{\\\"id\\\":1,\\\"tipo\\\":\\\"rcv\\\",\\\"nombre\\\":\\\"RCV B\\\\u00e1sico\\\"},\\\"total_bs\\\":256524.37,\\\"asegurado\\\":{\\\"ci\\\":\\\"V-4961881\\\",\\\"nombre\\\":\\\"ODILA ELVIRA GONZALEZ DE CAMACHO\\\"},\\\"total_usd\\\":487}\"}}', NULL, '127.0.0.1', '2026-06-21 11:13:36');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `beneficiarios`
--

CREATE TABLE `beneficiarios` (
  `id` bigint UNSIGNED NOT NULL,
  `poliza_id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cedula` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parentesco` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `porcentaje` decimal(5,2) NOT NULL DEFAULT '100.00',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `beneficiarios`
--

INSERT INTO `beneficiarios` (`id`, `poliza_id`, `nombre`, `cedula`, `parentesco`, `porcentaje`, `created_at`, `updated_at`) VALUES
(2, 4, 'Jose rodri', '201992111', 'papa', 30.00, '2026-06-20 14:08:30', '2026-06-20 14:08:30');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `beneficios`
--

CREATE TABLE `beneficios` (
  `id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `descripcion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `monto` decimal(18,2) NOT NULL DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bien_asegurado`
--

CREATE TABLE `bien_asegurado` (
  `id` bigint UNSIGNED NOT NULL,
  `persona_id` bigint UNSIGNED DEFAULT NULL COMMENT 'Titular/dueño del bien',
  `tipo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'vehiculo|inmueble|vida|bien|otro',
  `atributos` json DEFAULT NULL COMMENT 'Datos específicos según tipo',
  `valor_declarado` decimal(18,2) DEFAULT NULL,
  `descripcion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `placa_idx` varchar(20) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (json_unquote(json_extract(`atributos`,_utf8mb4'$.placa'))) STORED COMMENT 'Índice buscable de placa (solo tipo=vehiculo)',
  `serial_carroceria_idx` varchar(40) COLLATE utf8mb4_unicode_ci GENERATED ALWAYS AS (json_unquote(json_extract(`atributos`,_utf8mb4'$.serial_carroceria'))) STORED COMMENT 'Índice buscable de serial (solo tipo=vehiculo)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `bien_asegurado`
--

INSERT INTO `bien_asegurado` (`id`, `persona_id`, `tipo`, `atributos`, `valor_declarado`, `descripcion`, `created_by`, `created_at`, `updated_at`, `deleted_at`) VALUES
(1, 1, 'vehiculo', '{\"uso\": \"particular\", \"anio\": 2015, \"peso\": null, \"clase\": \"PASEO\", \"color\": \"PLATA\", \"marca\": \"TOYOTA\", \"placa\": \"AA111BB\", \"modelo\": \"COROLLA\", \"titulo\": \"\", \"puestos\": 5, \"aparcamiento\": \"\", \"serial_motor\": \"1ZZ-1234567\", \"tipo_carroceria\": \"sedan\", \"fecha_adquisicion\": \"2020-01-01\", \"serial_carroceria\": \"8Y1AB23C4DE567890\", \"certificado_origen\": \"\", \"certificado_transito\": \"\"}', NULL, NULL, NULL, '2026-06-17 19:40:12', '2026-06-17 19:40:12', NULL),
(2, 2, 'vehiculo', '{\"uso\": \"particular\", \"anio\": 2012, \"peso\": null, \"clase\": \"PASEO\", \"color\": \"AZUL\", \"marca\": \"CHEVROLET\", \"placa\": \"CC222DD\", \"modelo\": \"AVEO\", \"titulo\": \"\", \"puestos\": 5, \"aparcamiento\": \"\", \"serial_motor\": \"F16D3-123456\", \"tipo_carroceria\": \"hatchback\", \"fecha_adquisicion\": \"2021-06-15\", \"serial_carroceria\": \"8Y1AB23C4DE567891\", \"certificado_origen\": \"\", \"certificado_transito\": \"\"}', NULL, NULL, NULL, '2026-06-17 19:40:12', '2026-06-17 19:40:12', NULL),
(3, 3, 'vehiculo', '{\"uso\": \"particular\", \"anio\": 2014, \"peso\": null, \"clase\": \"PASEO\", \"color\": \"BLANCO\", \"marca\": \"FORD\", \"placa\": \"EE333FF\", \"modelo\": \"FIESTA\", \"titulo\": \"\", \"puestos\": 5, \"aparcamiento\": \"\", \"serial_motor\": \"SIGMA-123456\", \"tipo_carroceria\": \"sedan\", \"fecha_adquisicion\": \"2022-10-10\", \"serial_carroceria\": \"8Y1AB23C4DE567892\", \"certificado_origen\": \"\", \"certificado_transito\": \"\"}', NULL, NULL, NULL, '2026-06-17 19:40:12', '2026-06-17 19:40:12', NULL),
(6, 1, 'vehiculo', '{\"marca\": \"QA-TEST\", \"placa\": \"QA999ZZ\", \"modelo\": \"TEST\"}', NULL, 'Bien de prueba QA', 5, '2026-06-20 17:36:51', '2026-06-20 17:37:41', '2026-06-20 17:37:41'),
(8, 8, 'vehiculo', '{\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Blanco\", \"marca\": \"Toyota\", \"placa\": \"QA001AB\", \"modelo\": \"Corolla\", \"valor_mercado\": 15000}', 15000.00, 'Toyota Corolla 2022', 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07', NULL),
(9, 9, 'vehiculo', '{\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Negro\", \"marca\": \"Chevrolet\", \"placa\": \"QA002AB\", \"modelo\": \"Aveo\", \"valor_mercado\": 15000}', 15000.00, 'Chevrolet Aveo 2022', 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07', NULL),
(10, 10, 'vehiculo', '{\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Gris\", \"marca\": \"Ford\", \"placa\": \"QA003AB\", \"modelo\": \"Fiesta\", \"valor_mercado\": 15000}', 15000.00, 'Ford Fiesta 2022', 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07', NULL),
(11, 11, 'vehiculo', '{\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Azul\", \"marca\": \"Hyundai\", \"placa\": \"QA004AB\", \"modelo\": \"Accent\", \"valor_mercado\": 15000}', 15000.00, 'Hyundai Accent 2022', 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07', NULL),
(12, 12, 'vehiculo', '{\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Rojo\", \"marca\": \"Kia\", \"placa\": \"QA005AB\", \"modelo\": \"Rio\", \"valor_mercado\": 15000}', 15000.00, 'Kia Rio 2022', 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07', NULL),
(13, 13, 'vehiculo', '{\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Blanco\", \"marca\": \"Renault\", \"placa\": \"QA006AB\", \"modelo\": \"Sandero\", \"valor_mercado\": 15000}', 15000.00, 'Renault Sandero 2022', 4, '2026-06-20 18:55:08', '2026-06-20 18:55:08', NULL),
(14, 26, 'inmueble', '{\"subtipo\": \"Apartamento\", \"direccion\": \"Av. Prueba QA #19, Sector Ficticio\"}', 50000.00, 'Poliza Muebles', 4, '2026-06-20 18:58:04', '2026-06-20 18:58:04', NULL),
(15, 27, 'inmueble', '{\"subtipo\": \"Apartamento\", \"direccion\": \"Av. Prueba QA #20, Sector Ficticio\"}', 50000.00, 'Poliza Muebles', 4, '2026-06-20 18:58:13', '2026-06-20 18:58:13', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `bien_persona_rol`
--

CREATE TABLE `bien_persona_rol` (
  `id` bigint UNSIGNED NOT NULL,
  `bien_asegurado_id` bigint UNSIGNED NOT NULL,
  `persona_id` bigint UNSIGNED NOT NULL,
  `rol` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `datos` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `cache`
--

INSERT INTO `cache` (`key`, `value`, `expiration`) VALUES
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba', 'i:2;', 1781824614),
('laravel-cache-5c785c036466adea360111aa28563bfd556b5fba:timer', 'i:1781824614;', 1781824614),
('laravel-cache-80174ad43b6cecc0d479abca3c288131', 'i:1;', 1781824614),
('laravel-cache-80174ad43b6cecc0d479abca3c288131:timer', 'i:1781824614;', 1781824614),
('laravel-cache-contacto_cooldown:tecnico.qa@example.com', 'b:1;', 1781824674);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `owner` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` bigint NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente_documentos`
--

CREATE TABLE `cliente_documentos` (
  `id` bigint UNSIGNED NOT NULL,
  `persona_id` bigint UNSIGNED DEFAULT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `path` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` bigint UNSIGNED DEFAULT NULL,
  `mime` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `email_log`
--

CREATE TABLE `email_log` (
  `id` bigint UNSIGNED NOT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destinatario` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asunto` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `persona_id` int UNSIGNED DEFAULT NULL,
  `poliza_id` int UNSIGNED DEFAULT NULL,
  `status` enum('enviado','error') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'enviado',
  `error_msg` text COLLATE utf8mb4_unicode_ci,
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `email_log`
--

INSERT INTO `email_log` (`id`, `tipo`, `destinatario`, `asunto`, `persona_id`, `poliza_id`, `status`, `error_msg`, `sent_at`) VALUES
(1, 'cotizacion', 'carlos@mail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-16 20:52:09'),
(2, 'cambio_cliente', 'instrumentosyvoz@mail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-16 20:53:11'),
(3, 'cambio_correo_aviso', 'carlos@mail.com', 'Aviso cambio de correo', 3, NULL, 'enviado', NULL, '2026-06-16 20:53:11'),
(4, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-16 20:53:18'),
(5, 'cambio_correo_aviso', 'instrumentosyvoz@mail.com', 'Aviso cambio de correo', 3, NULL, 'enviado', NULL, '2026-06-16 20:53:18'),
(6, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-16 20:53:34'),
(7, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 16:21:37'),
(8, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 16:23:56'),
(9, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 16:25:05'),
(10, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 16:32:51'),
(11, 'cotizacion_rechazado', 'instrumentosyvoz@gmail.com', 'Cotización rechazada', 3, NULL, 'enviado', NULL, '2026-06-17 16:33:37'),
(12, 'cotizacion_aprobado', 'instrumentosyvoz@gmail.com', 'Cotización aprobada', 3, NULL, 'enviado', NULL, '2026-06-17 16:33:39'),
(13, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 16:34:08'),
(14, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 16:38:15'),
(15, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 16:39:17'),
(16, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 16:42:58'),
(17, 'cotizacion_rechazado', 'instrumentosyvoz@gmail.com', 'Cotización rechazada', 3, NULL, 'enviado', NULL, '2026-06-17 16:43:14'),
(18, 'cotizacion_rechazado', 'instrumentosyvoz@gmail.com', 'Cotización rechazada', 3, NULL, 'enviado', NULL, '2026-06-17 16:53:59'),
(19, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 17:05:59'),
(20, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 17:11:07'),
(21, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 17:16:19'),
(22, 'cambio_cliente', 'instrumentosyvoz@gmail.com', 'Datos actualizados', 3, NULL, 'enviado', NULL, '2026-06-17 17:28:33'),
(23, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 19:31:26'),
(24, 'cotizacion', 'anas@gmail.com', 'Simulación de seguro', 3, NULL, 'enviado', NULL, '2026-06-17 19:40:34'),
(25, 'cotizacion', 'odilaelvirag@gmail.com', 'Simulación de seguro', 1, NULL, 'enviado', NULL, '2026-06-19 14:00:46'),
(26, 'poliza_emitida', 'odilaelvirag@gmail.com', 'Póliza emitida POL-2026-00004', 1, 4, 'enviado', NULL, '2026-06-19 14:00:58'),
(27, 'factura', 'odilaelvirag@gmail.com', 'Factura FAC-2026-00004', 1, 4, 'enviado', NULL, '2026-06-19 14:00:58'),
(31, 'reporte_externo', 'instrumentosyvoz@gmail.com', 'Nuevo Reporte', NULL, NULL, 'enviado', NULL, '2026-06-20 00:53:22'),
(32, 'reporte_interno', 'instrumentosyvoz@gmail.com', 'Reporte de Ventas Diarias', NULL, NULL, 'enviado', NULL, '2026-06-20 00:59:30'),
(33, 'bien_actualizado', 'odilaelvirag@gmail.com', 'Bien asegurado actualizado', 1, NULL, 'enviado', NULL, '2026-06-20 01:44:06'),
(35, 'bienvenida', 'instrumentosyvoz@gmail.com', 'Bienvenido/a a LA VENEZOLANA DE SEGUROS Y VIDA C.A', 5, NULL, 'enviado', NULL, '2026-06-20 02:06:36'),
(36, 'cotizacion', 'instrumentosyvoz@gmail.com', 'Simulación de seguro', 5, NULL, 'enviado', NULL, '2026-06-20 02:06:44'),
(37, 'poliza_emitida', 'instrumentosyvoz@gmail.com', 'Póliza emitida POL-2026-00005', 5, 5, 'enviado', NULL, '2026-06-20 02:07:35'),
(38, 'factura', 'instrumentosyvoz@gmail.com', 'Factura FAC-2026-00005', 5, 5, 'enviado', NULL, '2026-06-20 02:07:35'),
(39, 'reporte_externo', 'instrumentosyvoz@gmail.com', 'Nuevo Reporte', NULL, NULL, 'enviado', NULL, '2026-06-19 22:15:09'),
(40, 'reporte_interno', 'instrumentosyvoz@gmail.com', 'Reporte de Ventas Diarias', NULL, NULL, 'enviado', NULL, '2026-06-19 22:15:11'),
(41, 'cotizacion', 'odilaelvirag@gmail.com', 'Simulación de seguro', 1, NULL, 'enviado', NULL, '2026-06-19 22:22:27'),
(42, 'cambio_cliente', 'odilaelvirag@gmail.com', 'Datos actualizados', 1, NULL, 'enviado', NULL, '2026-06-19 22:29:45'),
(43, 'reporte_externo', 'instrumentosyvoz@gmail.com', 'Nuevo Reporte', NULL, NULL, 'enviado', NULL, '2026-06-20 02:00:32'),
(46, 'cotizacion', 'odilaelvirag@gmail.com', 'Simulación de seguro', 1, NULL, 'enviado', NULL, '2026-06-20 07:56:08'),
(47, 'reporte_interno', 'instrumentosyvoz@gmail.com', 'Reporte de Ventas Diarias', NULL, NULL, 'enviado', NULL, '2026-06-20 08:00:14'),
(48, 'cotizacion', 'odilaelvirag@gmail.com', 'Simulación de seguro', 1, NULL, 'enviado', NULL, '2026-06-20 08:24:02'),
(49, 'poliza_emitida', 'odilaelvirag@gmail.com', 'Póliza emitida POL-2026-00006', 1, 6, 'enviado', NULL, '2026-06-20 08:24:39'),
(50, 'factura', 'odilaelvirag@gmail.com', 'Factura FAC-2026-00006', 1, 6, 'enviado', NULL, '2026-06-20 08:24:39'),
(51, 'cotizacion', 'pedros@gmail.com', 'Simulación de seguro', 2, NULL, 'enviado', NULL, '2026-06-20 08:33:50'),
(52, 'poliza_renovada', 'odilaelvirag@gmail.com', 'Renovación POL-2026-00007', 1, NULL, 'enviado', NULL, '2026-06-20 09:32:19'),
(53, 'cambio_poliza', 'odilaelvirag@gmail.com', 'Póliza ajustada SEF-2026-VEH-00845', 1, NULL, 'enviado', NULL, '2026-06-20 10:27:44'),
(54, 'cambio_poliza', 'odilaelvirag@gmail.com', 'Póliza ajustada SEF-2026-VEH-00845', 1, NULL, 'enviado', NULL, '2026-06-20 10:30:09'),
(55, 'reporte_interno', 'instrumentosyvoz@gmail.com', 'Reporte de Ventas Diarias', NULL, NULL, 'enviado', NULL, '2026-06-20 11:32:03'),
(57, 'bien_registrado', 'odilaelvirag@gmail.com', 'Bien asegurado registrado', 1, NULL, 'enviado', NULL, '2026-06-20 17:36:51'),
(58, 'bienvenida', 'prueba.qatest@example.com', 'Bienvenido/a a la Venezolana de seguros c.a', 7, NULL, 'enviado', NULL, '2026-06-20 18:52:16'),
(59, 'bien_registrado', 'prueba.qatest@example.com', 'Bien asegurado registrado', 7, NULL, 'enviado', NULL, '2026-06-20 18:52:16'),
(60, 'bienvenida', 'prueba.qa1@example.com', 'Bienvenido/a a la Venezolana de seguros', 8, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(61, 'bien_registrado', 'prueba.qa1@example.com', 'Bien asegurado registrado', 8, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(62, 'cotizacion', 'prueba.qa1@example.com', 'Simulación de seguro', 8, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(63, 'poliza_emitida', 'prueba.qa1@example.com', 'Póliza emitida POL-2026-00008', 8, 8, 'enviado', NULL, '2026-06-20 18:55:07'),
(64, 'factura', 'prueba.qa1@example.com', 'Factura FAC-2026-00008', 8, 8, 'enviado', NULL, '2026-06-20 18:55:07'),
(65, 'bienvenida', 'prueba.qa2@example.com', 'Bienvenido/a a la Venezolana de seguros', 9, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(66, 'bien_registrado', 'prueba.qa2@example.com', 'Bien asegurado registrado', 9, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(67, 'cotizacion', 'prueba.qa2@example.com', 'Simulación de seguro', 9, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(68, 'poliza_emitida', 'prueba.qa2@example.com', 'Póliza emitida POL-2026-00009', 9, 9, 'enviado', NULL, '2026-06-20 18:55:07'),
(69, 'factura', 'prueba.qa2@example.com', 'Factura FAC-2026-00009', 9, 9, 'enviado', NULL, '2026-06-20 18:55:07'),
(70, 'bienvenida', 'prueba.qa3@example.com', 'Bienvenido/a a la Venezolana de seguros', 10, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(71, 'bien_registrado', 'prueba.qa3@example.com', 'Bien asegurado registrado', 10, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(72, 'cotizacion', 'prueba.qa3@example.com', 'Simulación de seguro', 10, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(73, 'poliza_emitida', 'prueba.qa3@example.com', 'Póliza emitida POL-2026-00010', 10, 10, 'enviado', NULL, '2026-06-20 18:55:07'),
(74, 'factura', 'prueba.qa3@example.com', 'Factura FAC-2026-00010', 10, 10, 'enviado', NULL, '2026-06-20 18:55:07'),
(75, 'bienvenida', 'prueba.qa4@example.com', 'Bienvenido/a a la Venezolana de seguros', 11, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(76, 'bien_registrado', 'prueba.qa4@example.com', 'Bien asegurado registrado', 11, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(77, 'cotizacion', 'prueba.qa4@example.com', 'Simulación de seguro', 11, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(78, 'poliza_emitida', 'prueba.qa4@example.com', 'Póliza emitida POL-2026-00011', 11, 11, 'enviado', NULL, '2026-06-20 18:55:07'),
(79, 'factura', 'prueba.qa4@example.com', 'Factura FAC-2026-00011', 11, 11, 'enviado', NULL, '2026-06-20 18:55:07'),
(80, 'bienvenida', 'prueba.qa5@example.com', 'Bienvenido/a a la Venezolana de seguros', 12, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(81, 'bien_registrado', 'prueba.qa5@example.com', 'Bien asegurado registrado', 12, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(82, 'cotizacion', 'prueba.qa5@example.com', 'Simulación de seguro', 12, NULL, 'enviado', NULL, '2026-06-20 18:55:07'),
(83, 'poliza_emitida', 'prueba.qa5@example.com', 'Póliza emitida POL-2026-00012', 12, 12, 'enviado', NULL, '2026-06-20 18:55:08'),
(84, 'factura', 'prueba.qa5@example.com', 'Factura FAC-2026-00012', 12, 12, 'enviado', NULL, '2026-06-20 18:55:08'),
(85, 'bienvenida', 'prueba.qa6@example.com', 'Bienvenido/a a la Venezolana de seguros', 13, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(86, 'bien_registrado', 'prueba.qa6@example.com', 'Bien asegurado registrado', 13, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(87, 'cotizacion', 'prueba.qa6@example.com', 'Simulación de seguro', 13, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(88, 'poliza_emitida', 'prueba.qa6@example.com', 'Póliza emitida POL-2026-00013', 13, 13, 'enviado', NULL, '2026-06-20 18:55:08'),
(89, 'factura', 'prueba.qa6@example.com', 'Factura FAC-2026-00013', 13, 13, 'enviado', NULL, '2026-06-20 18:55:08'),
(90, 'bienvenida', 'prueba.qa7@example.com', 'Bienvenido/a a la Venezolana de seguros', 14, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(91, 'cotizacion', 'prueba.qa7@example.com', 'Simulación de seguro', 14, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(92, 'poliza_emitida', 'prueba.qa7@example.com', 'Póliza emitida POL-2026-00014', 14, 14, 'enviado', NULL, '2026-06-20 18:55:08'),
(93, 'factura', 'prueba.qa7@example.com', 'Factura FAC-2026-00014', 14, 14, 'enviado', NULL, '2026-06-20 18:55:08'),
(94, 'bienvenida', 'prueba.qa8@example.com', 'Bienvenido/a a la Venezolana de seguros', 15, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(95, 'cotizacion', 'prueba.qa8@example.com', 'Simulación de seguro', 15, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(96, 'poliza_emitida', 'prueba.qa8@example.com', 'Póliza emitida POL-2026-00015', 15, 15, 'enviado', NULL, '2026-06-20 18:55:08'),
(97, 'factura', 'prueba.qa8@example.com', 'Factura FAC-2026-00015', 15, 15, 'enviado', NULL, '2026-06-20 18:55:08'),
(98, 'bienvenida', 'prueba.qa9@example.com', 'Bienvenido/a a la Venezolana de seguros', 16, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(99, 'cotizacion', 'prueba.qa9@example.com', 'Simulación de seguro', 16, NULL, 'enviado', NULL, '2026-06-20 18:55:08'),
(100, 'poliza_emitida', 'prueba.qa9@example.com', 'Póliza emitida POL-2026-00016', 16, 16, 'enviado', NULL, '2026-06-20 18:56:18'),
(101, 'factura', 'prueba.qa9@example.com', 'Factura FAC-2026-00016', 16, 16, 'enviado', NULL, '2026-06-20 18:56:18'),
(102, 'bienvenida', 'prueba.qa10@example.com', 'Bienvenido/a a la Venezolana de seguros', 17, NULL, 'enviado', NULL, '2026-06-20 18:56:55'),
(103, 'cotizacion', 'prueba.qa10@example.com', 'Simulación de seguro', 17, NULL, 'enviado', NULL, '2026-06-20 18:56:57'),
(104, 'poliza_emitida', 'prueba.qa10@example.com', 'Póliza emitida POL-2026-00017', 17, 17, 'enviado', NULL, '2026-06-20 18:57:01'),
(105, 'factura', 'prueba.qa10@example.com', 'Factura FAC-2026-00017', 17, 17, 'enviado', NULL, '2026-06-20 18:57:01'),
(106, 'bienvenida', 'prueba.qa11@example.com', 'Bienvenido/a a la Venezolana de seguros', 18, NULL, 'enviado', NULL, '2026-06-20 18:57:03'),
(107, 'cotizacion', 'prueba.qa11@example.com', 'Simulación de seguro', 18, NULL, 'enviado', NULL, '2026-06-20 18:57:05'),
(108, 'poliza_emitida', 'prueba.qa11@example.com', 'Póliza emitida POL-2026-00018', 18, 18, 'enviado', NULL, '2026-06-20 18:57:08'),
(109, 'factura', 'prueba.qa11@example.com', 'Factura FAC-2026-00018', 18, 18, 'enviado', NULL, '2026-06-20 18:57:08'),
(110, 'bienvenida', 'prueba.qa12@example.com', 'Bienvenido/a a la Venezolana de seguros', 19, NULL, 'enviado', NULL, '2026-06-20 18:57:10'),
(111, 'cotizacion', 'prueba.qa12@example.com', 'Simulación de seguro', 19, NULL, 'enviado', NULL, '2026-06-20 18:57:12'),
(112, 'poliza_emitida', 'prueba.qa12@example.com', 'Póliza emitida POL-2026-00019', 19, 19, 'enviado', NULL, '2026-06-20 18:57:16'),
(113, 'factura', 'prueba.qa12@example.com', 'Factura FAC-2026-00019', 19, 19, 'enviado', NULL, '2026-06-20 18:57:16'),
(114, 'bienvenida', 'prueba.qa13@example.com', 'Bienvenido/a a la Venezolana de seguros', 20, NULL, 'enviado', NULL, '2026-06-20 18:57:17'),
(115, 'cotizacion', 'prueba.qa13@example.com', 'Simulación de seguro', 20, NULL, 'enviado', NULL, '2026-06-20 18:57:19'),
(116, 'poliza_emitida', 'prueba.qa13@example.com', 'Póliza emitida POL-2026-00020', 20, 20, 'enviado', NULL, '2026-06-20 18:57:23'),
(117, 'factura', 'prueba.qa13@example.com', 'Factura FAC-2026-00020', 20, 20, 'enviado', NULL, '2026-06-20 18:57:23'),
(118, 'bienvenida', 'prueba.qa14@example.com', 'Bienvenido/a a la Venezolana de seguros', 21, NULL, 'enviado', NULL, '2026-06-20 18:57:25'),
(119, 'cotizacion', 'prueba.qa14@example.com', 'Simulación de seguro', 21, NULL, 'enviado', NULL, '2026-06-20 18:57:27'),
(120, 'poliza_emitida', 'prueba.qa14@example.com', 'Póliza emitida POL-2026-00021', 21, 21, 'enviado', NULL, '2026-06-20 18:57:30'),
(121, 'factura', 'prueba.qa14@example.com', 'Factura FAC-2026-00021', 21, 21, 'enviado', NULL, '2026-06-20 18:57:30'),
(122, 'bienvenida', 'prueba.qa15@example.com', 'Bienvenido/a a la Venezolana de seguros', 22, NULL, 'enviado', NULL, '2026-06-20 18:57:32'),
(123, 'cotizacion', 'prueba.qa15@example.com', 'Simulación de seguro', 22, NULL, 'enviado', NULL, '2026-06-20 18:57:34'),
(124, 'poliza_emitida', 'prueba.qa15@example.com', 'Póliza emitida POL-2026-00022', 22, 22, 'enviado', NULL, '2026-06-20 18:57:38'),
(125, 'factura', 'prueba.qa15@example.com', 'Factura FAC-2026-00022', 22, 22, 'enviado', NULL, '2026-06-20 18:57:38'),
(126, 'bienvenida', 'prueba.qa16@example.com', 'Bienvenido/a a la Venezolana de seguros', 23, NULL, 'enviado', NULL, '2026-06-20 18:57:40'),
(127, 'cotizacion', 'prueba.qa16@example.com', 'Simulación de seguro', 23, NULL, 'enviado', NULL, '2026-06-20 18:57:41'),
(128, 'poliza_emitida', 'prueba.qa16@example.com', 'Póliza emitida POL-2026-00023', 23, 23, 'enviado', NULL, '2026-06-20 18:57:45'),
(129, 'factura', 'prueba.qa16@example.com', 'Factura FAC-2026-00023', 23, 23, 'enviado', NULL, '2026-06-20 18:57:45'),
(130, 'bienvenida', 'prueba.qa17@example.com', 'Bienvenido/a a la Venezolana de seguros', 24, NULL, 'enviado', NULL, '2026-06-20 18:57:47'),
(131, 'cotizacion', 'prueba.qa17@example.com', 'Simulación de seguro', 24, NULL, 'enviado', NULL, '2026-06-20 18:57:49'),
(132, 'poliza_emitida', 'prueba.qa17@example.com', 'Póliza emitida POL-2026-00024', 24, 24, 'enviado', NULL, '2026-06-20 18:57:52'),
(133, 'factura', 'prueba.qa17@example.com', 'Factura FAC-2026-00024', 24, 24, 'enviado', NULL, '2026-06-20 18:57:53'),
(134, 'bienvenida', 'prueba.qa18@example.com', 'Bienvenido/a a la Venezolana de seguros', 25, NULL, 'enviado', NULL, '2026-06-20 18:57:54'),
(135, 'cotizacion', 'prueba.qa18@example.com', 'Simulación de seguro', 25, NULL, 'enviado', NULL, '2026-06-20 18:57:56'),
(136, 'poliza_emitida', 'prueba.qa18@example.com', 'Póliza emitida POL-2026-00025', 25, 25, 'enviado', NULL, '2026-06-20 18:58:00'),
(137, 'factura', 'prueba.qa18@example.com', 'Factura FAC-2026-00025', 25, 25, 'enviado', NULL, '2026-06-20 18:58:00'),
(138, 'bienvenida', 'prueba.qa19@example.com', 'Bienvenido/a a la Venezolana de seguros', 26, NULL, 'enviado', NULL, '2026-06-20 18:58:02'),
(139, 'bien_registrado', 'prueba.qa19@example.com', 'Bien asegurado registrado', 26, NULL, 'enviado', NULL, '2026-06-20 18:58:04'),
(140, 'cotizacion', 'prueba.qa19@example.com', 'Simulación de seguro', 26, NULL, 'enviado', NULL, '2026-06-20 18:58:05'),
(141, 'poliza_emitida', 'prueba.qa19@example.com', 'Póliza emitida POL-2026-00026', 26, 26, 'enviado', NULL, '2026-06-20 18:58:09'),
(142, 'factura', 'prueba.qa19@example.com', 'Factura FAC-2026-00026', 26, 26, 'enviado', NULL, '2026-06-20 18:58:09'),
(143, 'bienvenida', 'prueba.qa20@example.com', 'Bienvenido/a a la Venezolana de seguros', 27, NULL, 'enviado', NULL, '2026-06-20 18:58:11'),
(144, 'bien_registrado', 'prueba.qa20@example.com', 'Bien asegurado registrado', 27, NULL, 'enviado', NULL, '2026-06-20 18:58:13'),
(145, 'cotizacion', 'prueba.qa20@example.com', 'Simulación de seguro', 27, NULL, 'enviado', NULL, '2026-06-20 18:58:15'),
(146, 'poliza_emitida', 'prueba.qa20@example.com', 'Póliza emitida POL-2026-00027', 27, 27, 'enviado', NULL, '2026-06-20 18:58:18'),
(147, 'factura', 'prueba.qa20@example.com', 'Factura FAC-2026-00027', 27, 27, 'enviado', NULL, '2026-06-20 18:58:18'),
(148, 'cotizacion', 'prueba.qa1@example.com', 'Simulación de seguro', 8, NULL, 'enviado', NULL, '2026-06-20 22:48:14'),
(149, 'reporte_externo', 'instrumentosyvoz@gmail.com', 'Nuevo Reporte', NULL, NULL, 'enviado', NULL, '2026-06-20 22:55:48'),
(150, 'reporte_externo', 'instrumentosyvoz@gmail.com', 'Nuevo Reporte', NULL, NULL, 'enviado', NULL, '2026-06-21 02:00:22'),
(151, 'bienvenida', 'qa.mascota@example.com', 'Bienvenido/a a la Venezolana de seguros', 29, NULL, 'enviado', NULL, '2026-06-21 08:59:02'),
(152, 'bien_registrado', 'qa.mascota@example.com', 'Bien asegurado registrado', 29, NULL, 'enviado', NULL, '2026-06-21 08:59:02'),
(153, 'cotizacion', 'qa.mascota@example.com', 'Simulación de seguro', 29, NULL, 'enviado', NULL, '2026-06-21 08:59:02'),
(154, 'poliza_emitida', 'qa.mascota@example.com', 'Póliza emitida POL-2026-00028', 29, 28, 'enviado', NULL, '2026-06-21 08:59:02'),
(155, 'factura', 'qa.mascota@example.com', 'Factura FAC-2026-00028', 29, 28, 'enviado', NULL, '2026-06-21 08:59:02'),
(156, 'bien_registrado', 'qa.mascota@example.com', 'Bien asegurado registrado', 29, NULL, 'enviado', NULL, '2026-06-21 08:59:02');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura`
--

CREATE TABLE `factura` (
  `id` bigint UNSIGNED NOT NULL,
  `numero` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `sede` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_factura` date NOT NULL,
  `poliza_id` bigint UNSIGNED NOT NULL,
  `valor` decimal(18,2) NOT NULL DEFAULT '0.00',
  `valor_bs` decimal(18,2) NOT NULL DEFAULT '0.00',
  `forma_pago` varchar(35) COLLATE utf8mb4_unicode_ci NOT NULL,
  `moneda` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `referencia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `usuario_id` bigint UNSIGNED NOT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `factura`
--

INSERT INTO `factura` (`id`, `numero`, `sede`, `fecha_factura`, `poliza_id`, `valor`, `valor_bs`, `forma_pago`, `moneda`, `referencia`, `usuario_id`, `deleted_at`, `created_by`, `updated_by`) VALUES
(1, 'FAC-2026-00004', 'Caracas Principal', '2026-06-19', 4, 290.00, 152789.52, 'Transferencia USD', 'USD', 'asdassw', 5, NULL, 5, 5),
(2, 'FAC-2026-00005', 'Caracas Principal', '2026-06-20', 5, 213.80, 112642.75, 'Transferencia USD', 'USD', 'dsasad2123s', 5, NULL, 5, 5),
(3, 'FAC-2026-00006', 'Caracas Principal', '2026-06-20', 6, 7626.40, 4018048.15, 'Transferencia USD', 'USD', 'gefgderf', 5, NULL, 5, 5),
(5, 'FAC-2026-00008', 'Caracas Principal', '2026-06-20', 8, 120.00, 73491.98, 'Transferencia USD', 'USD', 'QA-REF-1', 4, NULL, 4, 4),
(6, 'FAC-2026-00009', 'Caracas Principal', '2026-06-20', 9, 120.00, 73491.98, 'Transferencia USD', 'USD', 'QA-REF-2', 4, NULL, 4, 4),
(7, 'FAC-2026-00010', 'Caracas Principal', '2026-06-20', 10, 120.00, 73491.98, 'Transferencia USD', 'USD', 'QA-REF-3', 4, NULL, 4, 4),
(8, 'FAC-2026-00011', 'Caracas Principal', '2026-06-20', 11, 250.00, 153108.30, 'Transferencia USD', 'USD', 'QA-REF-4', 4, NULL, 4, 4),
(9, 'FAC-2026-00012', 'Caracas Principal', '2026-06-20', 12, 250.00, 153108.30, 'Transferencia USD', 'USD', 'QA-REF-5', 4, NULL, 4, 4),
(10, 'FAC-2026-00013', 'Caracas Principal', '2026-06-20', 13, 250.00, 153108.30, 'Transferencia USD', 'USD', 'QA-REF-6', 4, NULL, 4, 4),
(11, 'FAC-2026-00014', 'Caracas Principal', '2026-06-20', 14, 400.00, 244973.28, 'Transferencia USD', 'USD', 'QA-REF-7', 4, NULL, 4, 4),
(12, 'FAC-2026-00015', 'Caracas Principal', '2026-06-20', 15, 400.00, 244973.28, 'Transferencia USD', 'USD', 'QA-REF-8', 4, NULL, 4, 4),
(13, 'FAC-2026-00016', 'Caracas Principal', '2026-06-20', 16, 180.00, 110237.98, 'Transferencia USD', 'USD', 'QA-REF-9', 4, NULL, 4, 4),
(14, 'FAC-2026-00017', 'Caracas Principal', '2026-06-20', 17, 250.00, 153108.30, 'Transferencia USD', 'USD', 'QA-REF-10', 4, NULL, 4, 4),
(15, 'FAC-2026-00018', 'Caracas Principal', '2026-06-20', 18, 320.00, 195978.62, 'Transferencia USD', 'USD', 'QA-REF-11', 4, NULL, 4, 4),
(16, 'FAC-2026-00019', 'Caracas Principal', '2026-06-20', 19, 200.00, 122486.64, 'Transferencia USD', 'USD', 'QA-REF-12', 4, NULL, 4, 4),
(17, 'FAC-2026-00020', 'Caracas Principal', '2026-06-20', 20, 280.00, 171481.30, 'Transferencia USD', 'USD', 'QA-REF-13', 4, NULL, 4, 4),
(18, 'FAC-2026-00021', 'Caracas Principal', '2026-06-20', 21, 360.00, 220475.95, 'Transferencia USD', 'USD', 'QA-REF-14', 4, NULL, 4, 4),
(19, 'FAC-2026-00022', 'Caracas Principal', '2026-06-20', 22, 185.00, 113300.14, 'Transferencia USD', 'USD', 'QA-REF-15', 4, NULL, 4, 4),
(20, 'FAC-2026-00023', 'Caracas Principal', '2026-06-20', 23, 185.00, 113300.14, 'Transferencia USD', 'USD', 'QA-REF-16', 4, NULL, 4, 4),
(21, 'FAC-2026-00024', 'Caracas Principal', '2026-06-20', 24, 123.00, 75329.28, 'Transferencia USD', 'USD', 'QA-REF-17', 4, NULL, 4, 4),
(22, 'FAC-2026-00025', 'Caracas Principal', '2026-06-20', 25, 123.00, 75329.28, 'Transferencia USD', 'USD', 'QA-REF-18', 4, NULL, 4, 4),
(23, 'FAC-2026-00026', 'Caracas Principal', '2026-06-20', 26, 300.00, 183729.96, 'Transferencia USD', 'USD', 'QA-REF-19', 4, NULL, 4, 4),
(24, 'FAC-2026-00027', 'Caracas Principal', '2026-06-20', 27, 300.00, 183729.96, 'Transferencia USD', 'USD', 'QA-REF-20', 4, NULL, 4, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `indicador_economico`
--

CREATE TABLE `indicador_economico` (
  `id` int UNSIGNED NOT NULL,
  `tipo` enum('tasa_cambio','unidad_tributaria') COLLATE utf8mb4_unicode_ci NOT NULL,
  `moneda` varchar(5) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  `valor` decimal(18,4) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `indicador_economico`
--

INSERT INTO `indicador_economico` (`id`, `tipo`, `moneda`, `fecha`, `valor`, `fecha_registro`) VALUES
(2, 'unidad_tributaria', NULL, NULL, 9.0000, '2026-05-21 22:09:30'),
(11, 'tasa_cambio', 'USD', '2026-05-25', 526.8624, '2026-05-25 16:48:13'),
(12, 'tasa_cambio', 'EUR', '2026-05-25', 526.8604, '2026-05-25 16:48:13'),
(15, 'tasa_cambio', 'USD', '2026-05-26', 526.8604, '2026-05-26 02:11:32'),
(16, 'tasa_cambio', 'EUR', '2026-05-26', 926.8604, '2026-05-26 02:11:32'),
(17, 'tasa_cambio', 'USD', '2026-06-20', 612.4332, '2026-06-20 18:12:45'),
(18, 'tasa_cambio', 'EUR', '2026-06-20', 702.4241, '2026-06-20 18:12:45');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ip_bloqueada`
--

CREATE TABLE `ip_bloqueada` (
  `id` bigint UNSIGNED NOT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `usuario_id` bigint UNSIGNED DEFAULT NULL,
  `motivo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint UNSIGNED NOT NULL,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` smallint UNSIGNED NOT NULL,
  `reserved_at` int UNSIGNED DEFAULT NULL,
  `available_at` int UNSIGNED NOT NULL,
  `created_at` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs`
--

CREATE TABLE `logs` (
  `id` bigint UNSIGNED NOT NULL,
  `usuario_id` bigint UNSIGNED DEFAULT NULL,
  `accion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `device_fingerprint` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `logs`
--

INSERT INTO `logs` (`id`, `usuario_id`, `accion`, `tabla`, `descripcion`, `ip`, `user_agent`, `device_fingerprint`, `created_at`, `updated_at`) VALUES
(1, NULL, 'login_failed', 'usuarios', 'Intento de inicio de sesi贸n fallido para el nick: admin', '127.0.0.1', NULL, NULL, '2026-05-15 22:51:59', '2026-05-15 22:51:59'),
(2, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 17:09:12', '2026-05-21 17:09:12'),
(3, NULL, 'login_failed', 'usuarios', 'Intento de inicio de sesión fallido para el nick: asdas', '127.0.0.1', NULL, NULL, '2026-05-21 17:11:55', '2026-05-21 17:11:55'),
(4, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 17:15:14', '2026-05-21 17:15:14'),
(5, NULL, 'login_failed', 'usuarios', 'Intento de inicio de sesión fallido para el nick: asdas', '127.0.0.1', NULL, NULL, '2026-05-21 19:26:00', '2026-05-21 19:26:00'),
(6, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 19:26:46', '2026-05-21 19:26:46'),
(7, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 19:29:38', '2026-05-21 19:29:38'),
(8, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 19:35:09', '2026-05-21 19:35:09'),
(9, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 20:06:33', '2026-05-21 20:06:33'),
(10, NULL, 'create', 'poliza', 'Se creó póliza POL-0001', '127.0.0.1', NULL, NULL, NULL, NULL),
(11, NULL, 'create', 'factura', 'Se generó factura F-1002', '127.0.0.1', NULL, NULL, NULL, NULL),
(12, NULL, 'login_failed', 'usuarios', 'Intento de inicio de sesión fallido para el nick: dev_admins', '127.0.0.1', NULL, NULL, '2026-05-21 20:14:47', '2026-05-21 20:14:47'),
(13, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 20:14:51', '2026-05-21 20:14:51'),
(14, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin', '127.0.0.1', NULL, NULL, '2026-05-21 20:59:24', '2026-05-21 20:59:24'),
(15, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin', '127.0.0.1', NULL, NULL, '2026-05-21 20:59:27', '2026-05-21 20:59:27'),
(16, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 21:02:06', '2026-05-21 21:02:06'),
(17, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario vendedor1', '127.0.0.1', NULL, NULL, '2026-05-21 21:02:49', '2026-05-21 21:02:49'),
(18, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario vendedor1', '127.0.0.1', NULL, NULL, '2026-05-21 21:03:53', '2026-05-21 21:03:53'),
(19, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-21 21:03:59', '2026-05-21 21:03:59'),
(20, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-21 21:04:09', '2026-05-21 21:04:09'),
(21, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario admin2', '127.0.0.1', NULL, NULL, '2026-05-21 21:04:19', '2026-05-21 21:04:19'),
(22, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario admin', '127.0.0.1', NULL, NULL, '2026-05-21 21:04:24', '2026-05-21 21:04:24'),
(23, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario super1', '127.0.0.1', NULL, NULL, '2026-05-21 21:04:37', '2026-05-21 21:04:37'),
(24, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario admin', '127.0.0.1', NULL, NULL, '2026-05-21 21:04:49', '2026-05-21 21:04:49'),
(25, 5, 'Creación de Usuario', 'usuarios', 'Se creó el usuario 123213', '127.0.0.1', NULL, NULL, '2026-05-21 21:07:54', '2026-05-21 21:07:54'),
(26, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin', '127.0.0.1', NULL, NULL, '2026-05-21 21:12:56', '2026-05-21 21:12:56'),
(27, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin', '127.0.0.1', NULL, NULL, '2026-05-21 21:13:02', '2026-05-21 21:13:02'),
(28, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 21:35:48', '2026-05-21 21:35:48'),
(29, 5, 'Creación de Usuario', 'usuarios', 'Se creó el usuario dede', '127.0.0.1', NULL, NULL, '2026-05-21 21:37:48', '2026-05-21 21:37:48'),
(30, 10, 'login', 'usuarios', 'Usuario dede ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 21:37:58', '2026-05-21 21:37:58'),
(31, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 21:38:41', '2026-05-21 21:38:41'),
(32, 10, 'login', 'usuarios', 'Usuario dede ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-21 21:39:32', '2026-05-21 21:39:32'),
(33, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-22 13:26:09', '2026-05-22 13:26:09'),
(34, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-22 14:26:50', '2026-05-22 14:26:50'),
(35, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 09:29:19', '2026-05-23 09:29:19'),
(36, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 09:39:09', '2026-05-23 09:39:09'),
(37, 10, 'login', 'usuarios', 'Usuario dede ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 10:58:08', '2026-05-23 10:58:08'),
(38, 10, 'login', 'usuarios', 'Usuario dede ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 10:58:30', '2026-05-23 10:58:30'),
(39, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 10:58:37', '2026-05-23 10:58:37'),
(40, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 11:38:16', '2026-05-23 11:38:16'),
(41, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 11:38:52', '2026-05-23 11:38:52'),
(42, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:08:56', '2026-05-23 12:08:56'),
(43, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:12:08', '2026-05-23 12:12:08'),
(44, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:21:15', '2026-05-23 12:21:15'),
(45, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:21:55', '2026-05-23 12:21:55'),
(46, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 12:26:55', '2026-05-23 12:26:55'),
(47, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:27:02', '2026-05-23 12:27:02'),
(48, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 12:27:19', '2026-05-23 12:27:19'),
(49, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:31:06', '2026-05-23 12:31:06'),
(50, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 12:31:16', '2026-05-23 12:31:16'),
(51, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:31:26', '2026-05-23 12:31:26'),
(52, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 12:31:33', '2026-05-23 12:31:33'),
(53, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:32:42', '2026-05-23 12:32:42'),
(54, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:42:33', '2026-05-23 12:42:33'),
(55, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 12:42:44', '2026-05-23 12:42:44'),
(56, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 12:45:52', '2026-05-23 12:45:52'),
(57, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 12:46:04', '2026-05-23 12:46:04'),
(58, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 13:03:47', '2026-05-23 13:03:47'),
(59, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 13:04:09', '2026-05-23 13:04:09'),
(60, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 13:05:59', '2026-05-23 13:05:59'),
(61, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 13:45:19', '2026-05-23 13:45:19'),
(62, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 13:51:33', '2026-05-23 13:51:33'),
(63, 5, 'login', 'usuarios', 'Usuario dev_admin ha iniciado sesión', '127.0.0.1', NULL, NULL, '2026-05-23 13:51:48', '2026-05-23 13:51:48'),
(64, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', NULL, NULL, '2026-05-23 14:58:26', '2026-05-23 14:58:26'),
(65, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', NULL, NULL, '2026-05-23 14:58:57', '2026-05-23 14:58:57'),
(66, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', NULL, NULL, '2026-05-23 15:17:50', '2026-05-23 15:17:50'),
(67, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', NULL, NULL, '2026-05-23 15:18:20', '2026-05-23 15:18:20'),
(68, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dede', '127.0.0.1', NULL, NULL, '2026-05-23 15:18:44', '2026-05-23 15:18:44'),
(69, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', NULL, NULL, '2026-05-23 15:18:51', '2026-05-23 15:18:51'),
(70, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', NULL, NULL, '2026-05-23 15:19:19', '2026-05-23 15:19:19'),
(71, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario 123213', '127.0.0.1', NULL, NULL, '2026-05-23 15:21:39', '2026-05-23 15:21:39'),
(72, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario 123213', '127.0.0.1', NULL, NULL, '2026-05-23 15:21:44', '2026-05-23 15:21:44'),
(73, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '127.0.0.1', NULL, NULL, '2026-05-23 16:37:30', '2026-05-23 16:37:30'),
(74, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:10:05', '2026-05-23 22:10:05'),
(75, 5, 'Cotización Creada', 'solicitud', 'Cotización #3 para placa 456EERRG', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:11:27', '2026-05-23 22:11:27'),
(76, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #3 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:11:44', '2026-05-23 22:11:44'),
(77, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #2 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:11:45', '2026-05-23 22:11:45'),
(78, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #3 → Emitida', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:11:46', '2026-05-23 22:11:46'),
(79, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #1 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:11:51', '2026-05-23 22:11:51'),
(80, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #1 → Emitida', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:11:59', '2026-05-23 22:11:59'),
(81, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:15:32', '2026-05-23 22:15:32'),
(82, NULL, 'login_blocked', 'usuarios', 'IP bloqueada por bloqueo de cuenta intentó acceder: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:15:51', '2026-05-23 22:15:51'),
(83, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:16:12', '2026-05-23 22:16:12'),
(84, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 22:16:23', '2026-05-23 22:16:23'),
(85, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #3 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 23:27:03', '2026-05-23 23:27:03'),
(86, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00006 emitida para cotización #3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-23 23:27:14', '2026-05-23 23:27:14'),
(87, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #2 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:03:02', '2026-05-24 00:03:02'),
(88, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #1 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:03:04', '2026-05-24 00:03:04'),
(89, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:21:41', '2026-05-24 00:21:41'),
(90, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin2', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:22:49', '2026-05-24 00:22:49'),
(91, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin2', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:22:54', '2026-05-24 00:22:54'),
(92, 5, 'Cotización Creada', 'solicitud', 'Cotización #4 para placa J55EEF', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:25:37', '2026-05-24 00:25:37'),
(93, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #4 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:25:45', '2026-05-24 00:25:45'),
(94, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:26:00', '2026-05-24 00:26:00'),
(95, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:26:21', '2026-05-24 00:26:21'),
(96, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dede', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:26:38', '2026-05-24 00:26:38'),
(97, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:26:43', '2026-05-24 00:26:43'),
(98, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:27:47', '2026-05-24 00:27:47'),
(99, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:03', '2026-05-24 00:28:03'),
(100, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:42', '2026-05-24 00:28:42'),
(101, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:45', '2026-05-24 00:28:45'),
(102, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:47', '2026-05-24 00:28:47'),
(103, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:50', '2026-05-24 00:28:50'),
(104, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:53', '2026-05-24 00:28:53'),
(105, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:28:56', '2026-05-24 00:28:56'),
(106, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:29:02', '2026-05-24 00:29:02'),
(107, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:29:09', '2026-05-24 00:29:09'),
(108, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:29:45', '2026-05-24 00:29:45'),
(109, NULL, 'login_blocked', 'usuarios', 'IP bloqueada por bloqueo de cuenta intentó acceder: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:30:24', '2026-05-24 00:30:24'),
(110, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:30:32', '2026-05-24 00:30:32'),
(111, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 00:30:36', '2026-05-24 00:30:36'),
(112, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 12:04:21', '2026-05-24 12:04:21'),
(113, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 13:26:07', '2026-05-24 13:26:07'),
(114, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 13:26:36', '2026-05-24 13:26:36'),
(115, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 22:43:09', '2026-05-24 22:43:09'),
(116, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 22:51:13', '2026-05-24 22:51:13'),
(117, 5, 'Cotización Creada', 'solicitud', 'Cotización #5 para placa 3ASDS3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 22:53:36', '2026-05-24 22:53:36'),
(118, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00007 emitida para cotización #1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 22:58:41', '2026-05-24 22:58:41'),
(119, 5, 'Cotización Creada', 'solicitud', 'Cotización #6 para placa ASDS22', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 23:01:54', '2026-05-24 23:01:54'),
(120, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #5 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 23:02:06', '2026-05-24 23:02:06'),
(121, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #6 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-24 23:02:24', '2026-05-24 23:02:24'),
(122, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:09:01', '2026-05-25 14:09:01'),
(123, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1 — Intento /3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:33:28', '2026-05-25 14:33:28'),
(124, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:33:36', '2026-05-25 14:33:36'),
(125, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:34:10', '2026-05-25 14:34:10'),
(126, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:37:16', '2026-05-25 14:37:16'),
(127, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:37:32', '2026-05-25 14:37:32'),
(128, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:38:09', '2026-05-25 14:38:09'),
(129, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:38:28', '2026-05-25 14:38:28'),
(130, 5, 'Cotización Creada', 'solicitud', 'Cotización #7 para placa DFG445S', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:43:44', '2026-05-25 14:43:44'),
(131, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #7 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:43:52', '2026-05-25 14:43:52'),
(132, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00008 emitida para cotización #7', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 14:44:11', '2026-05-25 14:44:11'),
(133, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dede', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 18:51:05', '2026-05-25 18:51:05'),
(134, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 18:51:12', '2026-05-25 18:51:12'),
(135, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 19:13:29', '2026-05-25 19:13:29'),
(136, 5, 'Cotización Creada', 'solicitud', 'Cotización #8 para placa ', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 19:16:56', '2026-05-25 19:16:56'),
(137, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #8 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 19:17:02', '2026-05-25 19:17:02'),
(138, 5, 'Cotización Creada', 'solicitud', 'Cotización #9 para placa ASDASD3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 19:18:02', '2026-05-25 19:18:02'),
(139, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #9 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 19:18:08', '2026-05-25 19:18:08'),
(140, 5, 'Cotización Creada', 'solicitud', 'Cotización #10 — cliente #3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:10:36', '2026-05-25 21:10:36'),
(141, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #10 → Aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:11:06', '2026-05-25 21:11:06'),
(142, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00009 emitida para cotización #10', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:11:14', '2026-05-25 21:11:14'),
(143, 5, 'Tarifario Creado', 'tarifario', 'Tarifa #13 — ORO', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:39:11', '2026-05-25 21:39:11'),
(144, 5, 'Tarifario Creado', 'tarifario', 'Tarifa #14 — plata', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:40:00', '2026-05-25 21:40:00'),
(145, 5, 'Tarifario Versionado', 'tarifario', 'Tarifa #14 archivada → nueva versión #15 (v2)', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:40:38', '2026-05-25 21:40:38'),
(146, 5, 'Cotización Creada', 'solicitud', 'Cotización #11 — cliente #3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:41:15', '2026-05-25 21:41:15'),
(147, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #1 — solicitud #11 → aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:41:55', '2026-05-25 21:41:55'),
(148, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00010 emitida para cotización #11', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 21:42:29', '2026-05-25 21:42:29'),
(149, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 23:29:28', '2026-05-25 23:29:28'),
(150, 5, 'Cotización Creada', 'solicitud', 'Cotización #12 — cliente #1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 23:33:54', '2026-05-25 23:33:54'),
(151, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 23:44:56', '2026-05-25 23:44:56'),
(152, 5, 'Cotización Creada', 'solicitud', 'Cotización #13 — MF65HG', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 23:47:33', '2026-05-25 23:47:33'),
(153, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #2 — solicitud #13 → aprobado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 23:48:01', '2026-05-25 23:48:01'),
(154, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00011 emitida para cotización #13', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-25 23:48:17', '2026-05-25 23:48:17'),
(155, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1 — Intento /3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:14:58', '2026-05-26 00:14:58'),
(156, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:15:31', '2026-05-26 00:15:31'),
(157, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se desactivó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:15:52', '2026-05-26 00:15:52'),
(158, NULL, 'login_blocked', 'usuarios', 'IP bloqueada intentó acceder: 127.0.0.1', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:16:12', '2026-05-26 00:16:12'),
(159, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:16:56', '2026-05-26 00:16:56'),
(160, 5, 'Cambio de Estado de Usuario', 'usuarios', 'Se activó al usuario admin', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:17:25', '2026-05-26 00:17:25'),
(161, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:23:12', '2026-05-26 00:23:12'),
(162, NULL, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 127.0.0.1 — Intento /3', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:23:25', '2026-05-26 00:23:25'),
(163, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:23:29', '2026-05-26 00:23:29'),
(164, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:26:13', '2026-05-26 00:26:13'),
(165, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #12 → Rechazado', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 00:26:29', '2026-05-26 00:26:29'),
(166, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-05-26 10:20:03', '2026-05-26 10:20:03'),
(167, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 19:30:13', '2026-06-16 19:30:13'),
(168, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:38:24', '2026-06-16 20:38:24'),
(169, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:38:27', '2026-06-16 20:38:27'),
(170, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:38:31', '2026-06-16 20:38:31'),
(171, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:38:34', '2026-06-16 20:38:34'),
(172, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:38:56', '2026-06-16 20:38:56'),
(173, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:41:08', '2026-06-16 20:41:08'),
(174, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:41:43', '2026-06-16 20:41:43'),
(175, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:43:24', '2026-06-16 20:43:24'),
(176, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:43:29', '2026-06-16 20:43:29'),
(177, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:44:06', '2026-06-16 20:44:06'),
(178, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:44:36', '2026-06-16 20:44:36'),
(179, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:44:44', '2026-06-16 20:44:44'),
(180, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:44:49', '2026-06-16 20:44:49'),
(181, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:44:52', '2026-06-16 20:44:52'),
(182, 5, 'login_bloqueado', 'usuarios', 'Intento de sesión doble bloqueado para dev_admin desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:46:05', '2026-06-16 20:46:05'),
(183, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.8', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:46:59', '2026-06-16 20:46:59'),
(184, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:46:59', '2026-06-16 20:46:59'),
(185, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:49:50', '2026-06-16 20:49:50'),
(186, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:49:57', '2026-06-16 20:49:57'),
(187, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:50:03', '2026-06-16 20:50:03'),
(188, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:50:54', '2026-06-16 20:50:54'),
(189, 5, 'Cotización Creada', 'solicitud', 'Cotización #14 — Carlos Ramírez', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:52:09', '2026-06-16 20:52:09'),
(190, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #3 — solicitud #14 → observado', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:52:22', '2026-06-16 20:52:22'),
(191, 5, 'Cotización Creada', 'solicitud', 'Cotización #15 — Carlos Ramírez', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-16 20:53:34', '2026-06-16 20:53:34'),
(192, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:21:24', '2026-06-17 16:21:24'),
(193, 5, 'Cotización Creada', 'solicitud', 'Cotización #16 — Carlos Ramírez', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:21:37', '2026-06-17 16:21:37'),
(194, 5, 'Cotización Creada', 'solicitud', 'Cotización #17 — Carlos Ramírez', '172.20.0.8', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:23:56', '2026-06-17 16:23:56'),
(195, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #17 → rechazado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:33:37', '2026-06-17 16:33:37'),
(196, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #16 → aprobado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:33:39', '2026-06-17 16:33:39'),
(197, 5, 'Cotización Creada', 'solicitud', 'Cotización #18 — Carlos Ramírez', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:34:08', '2026-06-17 16:34:08'),
(198, 5, 'Cotización Creada', 'solicitud', 'Cotización #19 — Carlos Ramírez', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:39:17', '2026-06-17 16:39:17'),
(199, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #19 → rechazado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:43:14', '2026-06-17 16:43:14'),
(200, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #4 — solicitud #18 → aprobado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:47:27', '2026-06-17 16:47:27'),
(201, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #5 — solicitud #18 → observado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:48:49', '2026-06-17 16:48:49'),
(202, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #15 → rechazado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:53:59', '2026-06-17 16:53:59'),
(203, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #8 — solicitud #14 → aprobado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 16:54:17', '2026-06-17 16:54:17'),
(204, 5, 'Cotización Actualizada', 'solicitud', 'Cotización #18 actualizada', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 17:05:39', '2026-06-17 17:05:39'),
(205, 5, 'Cotización Creada', 'solicitud', 'Cotización #20 — Carlos Ramírez', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 17:05:59', '2026-06-17 17:05:59'),
(206, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.9', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 17:16:15', '2026-06-17 17:16:15'),
(207, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 17:16:15', '2026-06-17 17:16:15'),
(208, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.9', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 17:28:28', '2026-06-17 17:28:28'),
(209, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 17:28:28', '2026-06-17 17:28:28'),
(210, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.9', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 19:08:02', '2026-06-17 19:08:02'),
(211, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 19:08:02', '2026-06-17 19:08:02'),
(212, 5, 'Cotización Creada', 'solicitud', 'Cotización #21 — Carlos Ramírez', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 19:31:26', '2026-06-17 19:31:26'),
(213, 5, 'Cotización Creada', 'solicitud', 'Cotización #4 — Carlos Ramírez', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 19:40:34', '2026-06-17 19:40:34'),
(214, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #10 — solicitud #4 → aprobado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 19:40:55', '2026-06-17 19:40:55'),
(215, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dede', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-17 19:59:05', '2026-06-17 19:59:05'),
(216, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 13:32:21', '2026-06-19 13:32:21'),
(217, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 13:42:27', '2026-06-19 13:42:27'),
(218, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 13:42:29', '2026-06-19 13:42:29'),
(219, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.9', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 13:43:18', '2026-06-19 13:43:18'),
(220, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 13:43:18', '2026-06-19 13:43:18'),
(221, 5, 'Cotización Creada', 'solicitud', 'Cotización #5 — ODILA ELVIRA GONZALEZ DE CAMACHO', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:00:46', '2026-06-19 14:00:46'),
(222, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #11 — solicitud #5 → aprobado', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:00:50', '2026-06-19 14:00:50'),
(223, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00004 emitida para cotización #5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:00:58', '2026-06-19 14:00:58'),
(224, 4, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 172.20.0.9 — Intento 1/3', '172.20.0.9', 'curl/8.18.0', NULL, '2026-06-19 14:13:19', '2026-06-19 14:13:19'),
(225, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.9', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:19:34', '2026-06-19 14:19:34'),
(226, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:19:34', '2026-06-19 14:19:34'),
(227, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:19:54', '2026-06-19 14:19:54'),
(228, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:19:58', '2026-06-19 14:19:58'),
(229, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:49:40', '2026-06-19 14:49:40'),
(230, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 14:49:42', '2026-06-19 14:49:42');
INSERT INTO `logs` (`id`, `usuario_id`, `accion`, `tabla`, `descripcion`, `ip`, `user_agent`, `device_fingerprint`, `created_at`, `updated_at`) VALUES
(231, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:07:15', '2026-06-19 15:07:15'),
(232, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dev_admin', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:07:49', '2026-06-19 15:07:49'),
(233, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario dede', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:08:13', '2026-06-19 15:08:13'),
(234, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario admin2', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:16:42', '2026-06-19 15:16:42'),
(235, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario vendedor1', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:16:53', '2026-06-19 15:16:53'),
(236, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario super1', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:17:03', '2026-06-19 15:17:03'),
(237, 5, 'Edición de Usuario', 'usuarios', 'Se actualizó el usuario 123213', '172.20.0.9', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 15:17:14', '2026-06-19 15:17:14'),
(238, 5, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 172.20.0.1 — Intento 1/3', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-19 17:32:52', '2026-06-19 17:32:52'),
(239, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 18:44:13', '2026-06-19 18:44:13'),
(240, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 18:44:15', '2026-06-19 18:44:15'),
(241, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 19:21:32', '2026-06-19 19:21:32'),
(242, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.1', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 19:21:36', '2026-06-19 19:21:36'),
(243, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 19:21:36', '2026-06-19 19:21:36'),
(244, NULL, 'actualizar_bien', NULL, 'Bien ID 1 actualizado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 01:44:06', '2026-06-20 01:44:06'),
(245, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 02:03:16', '2026-06-20 02:03:16'),
(246, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 02:03:19', '2026-06-20 02:03:19'),
(247, 5, 'Cotización Creada', 'solicitud', 'Cotización #8 — Juan perez', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 02:06:44', '2026-06-20 02:06:44'),
(248, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #12 — solicitud #8 → aprobado', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 02:07:18', '2026-06-20 02:07:18'),
(249, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00005 emitida para cotización #8', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 02:07:35', '2026-06-20 02:07:35'),
(250, 5, 'Cotización Creada', 'solicitud', 'Cotización #9 — ODILA ELVIRA GONZALEZ DE CAMACHO', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:22:27', '2026-06-19 22:22:27'),
(251, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #13 — solicitud #9 → aprobado', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:22:43', '2026-06-19 22:22:43'),
(252, 5, 'Tarifario Creado', 'tarifario', 'Tarifa #16 — tf1', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:26:11', '2026-06-19 22:26:11'),
(253, NULL, 'editar_cliente', 'persona', 'Cliente ODILA ELVIRA GONZALEZ DE CAMACHO — Teléfono: \'02432321122\' → \'04129998888\'', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-19 22:29:45', '2026-06-19 22:29:45'),
(254, NULL, 'Edición de Usuario', 'usuarios', 'Usuario qaaudit — sin cambios en los datos', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-19 22:30:03', '2026-06-19 22:30:03'),
(255, NULL, 'Edición de Usuario', 'usuarios', 'Usuario qaaudit — cargo: Coordinador QA TEST2 → Coordinador QA FINAL', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-19 22:32:09', '2026-06-19 22:32:09'),
(256, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:44:18', '2026-06-19 22:44:18'),
(257, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:44:20', '2026-06-19 22:44:20'),
(258, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:48:57', '2026-06-19 22:48:57'),
(259, 10, 'login_failed', 'usuarios', 'Credenciales inválidas desde IP: 172.20.0.1 — Intento 1/3', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:49:01', '2026-06-19 22:49:01'),
(260, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-19 22:49:04', '2026-06-19 22:49:04'),
(261, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:58:15', '2026-06-20 06:58:15'),
(262, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:58:18', '2026-06-20 06:58:18'),
(263, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:58:25', '2026-06-20 06:58:25'),
(264, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:58:28', '2026-06-20 06:58:28'),
(265, 5, 'Edición de Usuario', 'usuarios', 'Usuario dede — permisos: {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"],\"vehiculos\":[\"view\"],\"cotizaciones\":[\"view\",\"create\"],\"config\":[\"view\"]} → {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"],\"vehiculos\":[\"view\",\"view_poliza\",\"view_docs\"],\"config\":[\"view\"]}', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:59:09', '2026-06-20 06:59:09'),
(266, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:59:13', '2026-06-20 06:59:13'),
(267, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:59:16', '2026-06-20 06:59:16'),
(268, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 06:59:47', '2026-06-20 06:59:47'),
(269, NULL, 'crear_cliente', 'persona', 'Cliente Cliente De QA Vendedor A (CI V-99887766) registrado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 07:28:55', '2026-06-20 07:28:55'),
(270, NULL, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 4', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 07:30:25', '2026-06-20 07:30:25'),
(271, NULL, 'Edición de Usuario', 'usuarios', 'Usuario qatarget — permisos: — → {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\"],\"cotizaciones\"…', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 07:36:45', '2026-06-20 07:36:45'),
(272, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 07:55:00', '2026-06-20 07:55:00'),
(273, 5, 'Cotización Creada', 'solicitud', 'Cotización #10 — ODILA ELVIRA GONZALEZ DE CAMACHO', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 07:56:08', '2026-06-20 07:56:08'),
(274, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #14 — solicitud #10 → aprobado', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 07:56:13', '2026-06-20 07:56:13'),
(275, 5, 'Tarifario Creado', 'tarifario', 'Tarifa #18 — Muebles', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:22:47', '2026-06-20 08:22:47'),
(276, 5, 'Cotización Creada', 'solicitud', 'Cotización #11 — ODILA ELVIRA GONZALEZ DE CAMACHO', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:24:02', '2026-06-20 08:24:02'),
(277, 5, 'Underwriting Creado', 'underwriting', 'Evaluación #15 — solicitud #11 → aprobado', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:24:11', '2026-06-20 08:24:11'),
(278, 5, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00006 emitida para cotización #11', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:24:39', '2026-06-20 08:24:39'),
(279, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:29:46', '2026-06-20 08:29:46'),
(280, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:29:49', '2026-06-20 08:29:49'),
(281, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:30:05', '2026-06-20 08:30:05'),
(282, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:30:08', '2026-06-20 08:30:08'),
(283, 5, 'Edición de Usuario', 'usuarios', 'Usuario dede — permisos: {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"]… → {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"]…', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:30:59', '2026-06-20 08:30:59'),
(284, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:31:09', '2026-06-20 08:31:09'),
(285, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:31:12', '2026-06-20 08:31:12'),
(286, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:31:26', '2026-06-20 08:31:26'),
(287, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:31:28', '2026-06-20 08:31:28'),
(288, 5, 'Edición de Usuario', 'usuarios', 'Usuario dede — permisos: {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"]… → {\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"]…', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:33:22', '2026-06-20 08:33:22'),
(289, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:33:27', '2026-06-20 08:33:27'),
(290, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:33:31', '2026-06-20 08:33:31'),
(291, NULL, 'crear_bien', NULL, 'Bien [inmueble] registrado — ID 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36', NULL, '2026-06-20 08:33:50', '2026-06-20 08:33:50'),
(292, NULL, 'Cotización Creada', 'solicitud', 'Cotización #12 — PEDRO JOSE SALAZAR', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36', NULL, '2026-06-20 08:33:50', '2026-06-20 08:33:50'),
(293, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:34:40', '2026-06-20 08:34:40'),
(294, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 08:34:42', '2026-06-20 08:34:42'),
(295, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 11:15:24', '2026-06-20 11:15:24'),
(296, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 11:15:26', '2026-06-20 11:15:26'),
(297, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 11:16:23', '2026-06-20 11:16:23'),
(298, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 11:16:29', '2026-06-20 11:16:29'),
(299, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 14:02:19', '2026-06-20 14:02:19'),
(300, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 14:14:33', '2026-06-20 14:14:33'),
(301, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 14:14:36', '2026-06-20 14:14:36'),
(302, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 14:14:52', '2026-06-20 14:14:52'),
(303, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 14:14:55', '2026-06-20 14:14:55'),
(304, 5, 'Producto Despublicado', 'producto', 'Producto \"Accidentes Personales\" ocultado del portal público', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 15:58:01', '2026-06-20 15:58:01'),
(305, 5, 'Producto Publicado', 'producto', 'Producto \"Accidentes Personales\" publicado en el portal público', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 15:58:02', '2026-06-20 15:58:02'),
(306, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 15:58:24', '2026-06-20 15:58:24'),
(307, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 15:58:27', '2026-06-20 15:58:27'),
(308, 5, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 6', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 17:36:51', '2026-06-20 17:36:51'),
(309, 5, 'Bien Agregado a Póliza', 'poliza', 'Póliza SEF-2026-VEH-00845 — bien #6 agregado con certificado SEF-2026-VEH-00845-02', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 17:37:09', '2026-06-20 17:37:09'),
(310, 5, 'Bien Quitado de Póliza', 'poliza', 'Póliza SEF-2026-VEH-00845 — bien #6 quitado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 17:37:32', '2026-06-20 17:37:32'),
(311, 5, 'eliminar_bien', NULL, 'Bien ID 6 eliminado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-20 17:37:41', '2026-06-20 17:37:41'),
(312, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 17:43:04', '2026-06-20 17:43:04'),
(313, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 17:43:07', '2026-06-20 17:43:07'),
(314, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 17:43:41', '2026-06-20 17:43:41'),
(315, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 17:43:45', '2026-06-20 17:43:45'),
(316, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA TEST (CI V-90009999) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:52:15', '2026-06-20 18:52:15'),
(317, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 7', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:52:16', '2026-06-20 18:52:16'),
(318, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 01 C4CA4 (CI V-90000001) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(319, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 8', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(320, 4, 'Cotización Creada', 'solicitud', 'Cotización #13 — PRUEBA QA 01 C4CA4', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(321, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #16 — solicitud #13 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(322, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00008 emitida para cotización #13', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(323, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 02 C81E7 (CI V-90000002) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(324, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 9', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(325, 4, 'Cotización Creada', 'solicitud', 'Cotización #14 — PRUEBA QA 02 C81E7', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(326, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #17 — solicitud #14 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(327, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00009 emitida para cotización #14', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(328, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 03 ECCBC (CI V-90000003) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(329, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 10', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(330, 4, 'Cotización Creada', 'solicitud', 'Cotización #15 — PRUEBA QA 03 ECCBC', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(331, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #18 — solicitud #15 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(332, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00010 emitida para cotización #15', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(333, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 04 A87FF (CI V-90000004) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(334, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 11', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(335, 4, 'Cotización Creada', 'solicitud', 'Cotización #16 — PRUEBA QA 04 A87FF', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(336, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #19 — solicitud #16 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(337, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00011 emitida para cotización #16', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(338, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 05 E4DA3 (CI V-90000005) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(339, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 12', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(340, 4, 'Cotización Creada', 'solicitud', 'Cotización #17 — PRUEBA QA 05 E4DA3', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(341, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #20 — solicitud #17 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(342, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00012 emitida para cotización #17', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(343, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 06 16790 (CI V-90000006) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(344, 4, 'crear_bien', NULL, 'Bien [vehiculo] registrado — ID 13', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(345, 4, 'Cotización Creada', 'solicitud', 'Cotización #18 — PRUEBA QA 06 16790', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(346, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #21 — solicitud #18 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(347, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00013 emitida para cotización #18', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(348, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 07 8F14E (CI V-90000007) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(349, 4, 'Cotización Creada', 'solicitud', 'Cotización #19 — PRUEBA QA 07 8F14E', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(350, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #22 — solicitud #19 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(351, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00014 emitida para cotización #19', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(352, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 08 C9F0F (CI V-90000008) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(353, 4, 'Cotización Creada', 'solicitud', 'Cotización #20 — PRUEBA QA 08 C9F0F', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(354, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #23 — solicitud #20 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(355, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00015 emitida para cotización #20', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(356, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 09 45C48 (CI V-90000009) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(357, 4, 'Cotización Creada', 'solicitud', 'Cotización #21 — PRUEBA QA 09 45C48', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(358, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #24 — solicitud #21 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(359, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00016 emitida para cotización #21', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:56:18', '2026-06-20 18:56:18'),
(360, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 10 D3D94 (CI V-90000010) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:56:55', '2026-06-20 18:56:55'),
(361, 4, 'Cotización Creada', 'solicitud', 'Cotización #22 — PRUEBA QA 10 D3D94', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:56:57', '2026-06-20 18:56:57'),
(362, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #25 — solicitud #22 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:56:59', '2026-06-20 18:56:59'),
(363, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00017 emitida para cotización #22', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:01', '2026-06-20 18:57:01'),
(364, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 11 6512B (CI V-90000011) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:03', '2026-06-20 18:57:03'),
(365, 4, 'Cotización Creada', 'solicitud', 'Cotización #23 — PRUEBA QA 11 6512B', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:05', '2026-06-20 18:57:05'),
(366, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #26 — solicitud #23 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:06', '2026-06-20 18:57:06'),
(367, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00018 emitida para cotización #23', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:08', '2026-06-20 18:57:08'),
(368, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 12 C20AD (CI V-90000012) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:10', '2026-06-20 18:57:10'),
(369, 4, 'Cotización Creada', 'solicitud', 'Cotización #24 — PRUEBA QA 12 C20AD', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:12', '2026-06-20 18:57:12'),
(370, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #27 — solicitud #24 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:14', '2026-06-20 18:57:14'),
(371, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00019 emitida para cotización #24', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:16', '2026-06-20 18:57:16'),
(372, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 13 C51CE (CI V-90000013) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:17', '2026-06-20 18:57:17'),
(373, 4, 'Cotización Creada', 'solicitud', 'Cotización #25 — PRUEBA QA 13 C51CE', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:19', '2026-06-20 18:57:19'),
(374, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #28 — solicitud #25 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:21', '2026-06-20 18:57:21'),
(375, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00020 emitida para cotización #25', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:23', '2026-06-20 18:57:23'),
(376, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 14 AAB32 (CI V-90000014) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:25', '2026-06-20 18:57:25'),
(377, 4, 'Cotización Creada', 'solicitud', 'Cotización #26 — PRUEBA QA 14 AAB32', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:27', '2026-06-20 18:57:27'),
(378, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #29 — solicitud #26 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:29', '2026-06-20 18:57:29'),
(379, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00021 emitida para cotización #26', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:30', '2026-06-20 18:57:30'),
(380, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 15 9BF31 (CI V-90000015) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:32', '2026-06-20 18:57:32'),
(381, 4, 'Cotización Creada', 'solicitud', 'Cotización #27 — PRUEBA QA 15 9BF31', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:34', '2026-06-20 18:57:34'),
(382, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #30 — solicitud #27 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:36', '2026-06-20 18:57:36'),
(383, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00022 emitida para cotización #27', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:38', '2026-06-20 18:57:38'),
(384, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 16 C74D9 (CI V-90000016) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:40', '2026-06-20 18:57:40'),
(385, 4, 'Cotización Creada', 'solicitud', 'Cotización #28 — PRUEBA QA 16 C74D9', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:41', '2026-06-20 18:57:41'),
(386, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #31 — solicitud #28 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:43', '2026-06-20 18:57:43'),
(387, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00023 emitida para cotización #28', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:45', '2026-06-20 18:57:45'),
(388, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 17 70EFD (CI V-90000017) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:47', '2026-06-20 18:57:47'),
(389, 4, 'Cotización Creada', 'solicitud', 'Cotización #29 — PRUEBA QA 17 70EFD', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:49', '2026-06-20 18:57:49'),
(390, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #32 — solicitud #29 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:51', '2026-06-20 18:57:51'),
(391, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00024 emitida para cotización #29', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:52', '2026-06-20 18:57:52'),
(392, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 18 6F492 (CI V-90000018) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:54', '2026-06-20 18:57:54'),
(393, 4, 'Cotización Creada', 'solicitud', 'Cotización #30 — PRUEBA QA 18 6F492', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:56', '2026-06-20 18:57:56'),
(394, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #33 — solicitud #30 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:57:58', '2026-06-20 18:57:58'),
(395, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00025 emitida para cotización #30', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:00', '2026-06-20 18:58:00'),
(396, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 19 1F0E3 (CI V-90000019) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:02', '2026-06-20 18:58:02'),
(397, 4, 'crear_bien', NULL, 'Bien [inmueble] registrado — ID 14', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:04', '2026-06-20 18:58:04'),
(398, 4, 'Cotización Creada', 'solicitud', 'Cotización #31 — PRUEBA QA 19 1F0E3', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:05', '2026-06-20 18:58:05'),
(399, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #34 — solicitud #31 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:07', '2026-06-20 18:58:07'),
(400, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00026 emitida para cotización #31', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:09', '2026-06-20 18:58:09'),
(401, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA 20 98F13 (CI V-90000020) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:11', '2026-06-20 18:58:11'),
(402, 4, 'crear_bien', NULL, 'Bien [inmueble] registrado — ID 15', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:13', '2026-06-20 18:58:13'),
(403, 4, 'Cotización Creada', 'solicitud', 'Cotización #32 — PRUEBA QA 20 98F13', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:15', '2026-06-20 18:58:15'),
(404, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #35 — solicitud #32 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:16', '2026-06-20 18:58:16'),
(405, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00027 emitida para cotización #32', '::1', 'GuzzleHttp/7', NULL, '2026-06-20 18:58:18', '2026-06-20 18:58:18'),
(406, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 19:11:00', '2026-06-20 19:11:00'),
(407, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 19:11:03', '2026-06-20 19:11:03'),
(408, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 19:11:53', '2026-06-20 19:11:53'),
(409, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 19:21:58', '2026-06-20 19:21:58'),
(410, 5, 'logout', 'usuarios', 'Usuario dev_admin ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:46:58', '2026-06-20 22:46:58'),
(411, 10, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 10', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:47:01', '2026-06-20 22:47:01'),
(412, 10, 'logout', 'usuarios', 'Usuario dede ha cerrado sesión', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:47:33', '2026-06-20 22:47:33'),
(413, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:47:36', '2026-06-20 22:47:36'),
(414, 5, 'Cotización Creada', 'solicitud', 'Cotización #34 — PRUEBA QA 01 C4CA4', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:48:13', '2026-06-20 22:48:13'),
(415, 5, 'Producto Despublicado', 'producto', 'Producto \"Accidentes Personales\" ocultado del portal público', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:50:37', '2026-06-20 22:50:37'),
(416, 5, 'Producto Publicado', 'producto', 'Producto \"Accidentes Personales\" publicado en el portal público', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 22:50:46', '2026-06-20 22:50:46'),
(417, 5, 'Bien Agregado a Póliza', 'poliza', 'Póliza POL-2026-00006 — bien #1 agregado con certificado POL-2026-00006-01', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-20 23:05:14', '2026-06-20 23:05:14'),
(418, 4, 'Producto Creado', 'producto', 'Producto \"Seguro de Mascotas QA\" creado', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:01', '2026-06-21 08:59:01'),
(419, 4, 'Tarifario Creado', 'tarifario', 'Tarifa #20 — Tarifa Estándar', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(420, 4, 'crear_cliente', 'persona', 'Cliente PRUEBA QA MASCOTA (CI V-90011001) registrado', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(421, 4, 'crear_bien', NULL, 'Bien [mascota] registrado — ID 16', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(422, 4, 'Cotización Creada', 'solicitud', 'Cotización #35 — PRUEBA QA MASCOTA', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(423, 4, 'Underwriting Creado', 'underwriting', 'Evaluación #36 — solicitud #35 → aprobado', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(424, 4, 'Póliza Emitida', 'poliza', 'Póliza POL-2026-00028 emitida para cotización #35', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(425, 4, 'crear_bien', NULL, 'Bien [mascota] registrado — ID 17', '::1', 'GuzzleHttp/7', NULL, '2026-06-21 08:59:02', '2026-06-21 08:59:02'),
(426, 5, 'sesion_forzada', 'usuarios', 'Sesión anterior cerrada forzosamente para dev_admin — nueva sesión desde IP: 172.20.0.1', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-21 09:04:46', '2026-06-21 09:04:46'),
(427, 5, 'login', 'usuarios', 'Inicio de sesión exitoso — ID: 5', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', NULL, '2026-06-21 09:04:46', '2026-06-21 09:04:46'),
(428, 4, 'Producto Creado', 'producto', 'Producto \"TEST Vida Familiar\" creado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-21 09:26:19', '2026-06-21 09:26:19'),
(429, 4, 'Tarifario Creado', 'tarifario', 'Tarifa #21 — Plan Básico', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-21 09:26:27', '2026-06-21 09:26:27'),
(430, 4, 'Producto Creado', 'producto', 'Producto \"TEST Puppeteer Por Plan 4\" creado', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36', NULL, '2026-06-21 09:35:26', '2026-06-21 09:35:26'),
(431, 4, 'Tarifario Creado', 'tarifario', 'Tarifa #22 — Plan Básico Puppeteer', '172.20.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/149.0.0.0 Safari/537.36', NULL, '2026-06-21 09:35:26', '2026-06-21 09:35:26'),
(432, 4, 'Producto Eliminado', 'producto', 'Producto \"TEST Vida Familiar\" eliminado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-21 09:36:37', '2026-06-21 09:36:37'),
(433, 4, 'Producto Eliminado', 'producto', 'Producto \"TEST Puppeteer Por Plan 4\" eliminado', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-21 09:36:37', '2026-06-21 09:36:37'),
(434, 4, 'Tarifario Versionado', 'tarifario', 'Tarifa #10 archivada → nueva versión #23 (v2)', '172.20.0.1', 'curl/8.18.0', NULL, '2026-06-21 11:12:29', '2026-06-21 11:12:29');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int UNSIGNED NOT NULL,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_05_11_140001_create_persona_table', 1),
(5, '2026_05_11_140002_create_indicador_economico_table', 1),
(6, '2026_05_11_140003_create_tipos_carros_table', 1),
(7, '2026_05_11_140004_create_producto_table', 1),
(8, '2026_05_11_140005_create_apov_table', 1),
(9, '2026_05_11_140006_create_apov_cobertura_table', 1),
(10, '2026_05_11_140007_create_ec_ep_table', 1),
(11, '2026_05_11_140008_create_otros_table', 1),
(12, '2026_05_11_140009_create_modelo_vehiculo_table', 1),
(13, '2026_05_11_140010_create_opc_vehiculos_uso_table', 1),
(14, '2026_05_11_140011_create_rcv_table', 1),
(15, '2026_05_11_140013_create_cliente_table', 1),
(16, '2026_05_11_140014_create_vehiculo_table', 1),
(17, '2026_05_11_140015_create_conductor_table', 1),
(18, '2026_05_11_140016_create_tomador_table', 1),
(19, '2026_05_11_140017_create_beneficios_table', 1),
(20, '2026_05_11_140018_create_categorias_table', 1),
(21, '2026_05_11_140019_create_solicitud_table', 1),
(22, '2026_05_11_140020_create_solicitud_apov_table', 1),
(23, '2026_05_11_140021_create_poliza_table', 1),
(24, '2026_05_11_140022_create_poliza_apov_table', 1),
(25, '2026_05_11_140023_create_poliza_rcv_table', 1),
(26, '2026_05_11_140024_create_factura_table', 1),
(27, '2026_05_11_140025_create_venta_table', 1),
(28, '2026_05_11_150000_create_logs_table', 1),
(29, '2026_05_12_202428_add_api_token_to_usuarios_table', 1),
(30, '2026_05_15_192607_add_permisos_to_usuarios_table', 1),
(31, '2026_05_16_200000_add_moneda_fecha_to_indicador_economico_table', 1),
(32, '2026_05_16_210000_add_activo_to_cliente_table', 1),
(33, '2026_05_19_175136_optimize_apov_tables', 1),
(34, '2026_05_19_192749_optimize_rcv_tables', 1),
(35, '2026_05_20_165711_optimize_vehiculo_tables', 1),
(36, '2026_05_20_180501_optimize_ecep_and_traceability', 1),
(37, '2026_05_21_215841_add_genero_to_usuarios_table', 1),
(38, '2026_05_21_220951_add_motivo_bloqueo_to_usuarios_table', 1),
(39, '2026_05_23_000001_add_token_expira_en_to_usuarios_table', 1),
(40, '2026_05_23_000002_add_token_created_at_to_usuarios_table', 1),
(41, '2026_05_23_172013_expand_sede_poliza_column', 1),
(42, '2026_05_23_200001_create_ip_bloqueada_table', 1),
(43, '2026_05_23_200002_add_user_agent_to_logs_table', 1),
(44, '2026_05_23_210001_extend_solicitud_for_cotizaciones', 1),
(45, '2026_05_24_000001_add_documento_path_to_producto_table', 1),
(46, '2026_05_24_000002_make_producto_id_nullable_in_poliza', 1),
(47, '2026_05_24_000003_add_tasas_to_producto_table', 1),
(48, '2026_05_24_000004_add_documentos_to_producto_table', 1),
(49, '2026_05_24_100001_add_tipo_to_producto_table', 1),
(50, '2026_05_25_000001_extend_producto_for_tarifario', 1),
(51, '2026_05_25_000002_create_tarifario_table', 1),
(52, '2026_05_25_000003_extend_solicitud_for_nuevo_flujo', 1),
(53, '2026_05_25_000004_extend_poliza_for_asegurado', 1),
(54, '2026_05_25_000005_create_beneficiarios_table', 1),
(55, '2026_05_25_000006_drop_legacy_tables', 1),
(56, '2026_05_25_000006_drop_legacy_tables', 2),
(57, '2026_05_25_100001_create_cliente_documentos_table', 1),
(58, '2026_05_25_100002_add_documentos_requeridos_to_producto_table', 1),
(59, '2026_05_25_200001_db_audit_fixes', 1),
(60, '2026_05_25_210001_phase1_integrity', 1),
(61, '2026_05_25_220001_tarifario_versioning', 1),
(62, '2026_05_25_230001_underwriting_and_poliza_snapshot', 1),
(63, '2026_05_26_204122_make_cliente_id_nullable_in_solicitud', 1),
(64, '2026_05_27_000001_remove_cliente_table', 1),
(65, '2026_05_29_000001_add_parent_id_to_productos_table', 1),
(66, '2026_05_30_000001_add_device_fingerprint_to_logs', 1),
(67, '2026_05_30_100001_create_bien_asegurado_table', 1),
(68, '2026_05_30_100002_create_bien_persona_rol_table', 1),
(69, '2026_05_30_100003_migrate_vehiculo_to_bien_asegurado', 1),
(70, '2026_05_30_100004_extend_producto_tipo_bien', 1),
(71, '2026_05_30_100005_drop_vehiculo_tables', 1),
(72, '2026_05_31_000001_add_tasa_emision_moneda_to_poliza_factura', 1),
(73, '2026_05_31_000002_add_tasa_emision_eur_to_poliza', 1),
(74, '2026_05_31_000003_add_motivo_bloqueo_to_persona', 1),
(75, '2026_05_31_100001_create_email_log_table', 1),
(76, '2026_05_31_200001_add_frecuencia_pago_to_poliza', 1),
(77, '2026_05_31_200002_add_nro_venezolana_to_poliza', 1),
(78, '2026_06_01_000001_add_performance_indexes', 1),
(79, '2026_06_02_100000_create_solicitudes_renovacion_qr_table', 1),
(80, '2026_06_02_110000_refactor_solicitudes_renovacion_qr_pagos', 1),
(81, '2026_06_03_000001_create_reportes_tables', 3),
(82, '2026_06_19_000001_create_solicitudes_contacto_table', 4),
(83, '2026_06_19_100000_add_publicado_to_producto_table', 5),
(84, '2026_06_19_110000_create_reportes_destinatarios_tables', 6),
(85, '2026_06_20_000001_add_vendedor_id_to_persona_table', 7),
(86, '2026_06_20_120000_add_contenido_y_adjuntos_a_programaciones', 8),
(87, '2026_06_20_130000_add_ultimo_visto_to_usuarios_table', 9),
(88, '2026_06_20_140000_create_poliza_bienes_table', 10),
(89, '2026_06_20_140100_backfill_poliza_bienes_existentes', 11),
(90, '2026_06_20_150000_fix_tipo_bien_rcv_apov', 12),
(91, '2026_06_21_100000_add_config_bienes_beneficiarios_to_producto', 13),
(92, '2026_06_21_110000_add_iva_mensualidad_to_producto', 14);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id` bigint UNSIGNED NOT NULL,
  `vendedor_id` bigint UNSIGNED DEFAULT NULL,
  `cedula` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefono` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `celular` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `direccion` text COLLATE utf8mb4_unicode_ci,
  `codigo_postal` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nacionalidad` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `estado` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ciudad` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nacimiento` date DEFAULT NULL,
  `sexo` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `condicion` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `profesion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actividad` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `archivo` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `motivo_bloqueo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `persona`
--

INSERT INTO `persona` (`id`, `vendedor_id`, `cedula`, `nombre`, `telefono`, `celular`, `correo`, `direccion`, `codigo_postal`, `nacionalidad`, `estado`, `ciudad`, `nacimiento`, `sexo`, `condicion`, `profesion`, `actividad`, `archivo`, `activo`, `motivo_bloqueo`, `fecha_creacion`, `deleted_at`) VALUES
(1, 6, 'V-4961881', 'ODILA ELVIRA GONZALEZ DE CAMACHO', '04129998888', '04268440836', 'odilaelvirag@gmail.com', 'PAMPAN ESTADO TRUJILLO', NULL, 'Venezolano', 'TRUJILLO', 'BOCONO', '1957-01-25', 'Femenino', NULL, NULL, NULL, NULL, 1, NULL, '2026-05-27 19:42:05', NULL),
(2, 9, 'V-12345678', 'PEDRO JOSE SALAZAR', '02129998877', '04121234567', 'pedros@gmail.com', 'AV. FRANCISCO DE MIRANDA, CHACAO', NULL, 'Venezolano', 'MIRANDA', 'CARACAS', '1985-05-12', 'Masculino', NULL, NULL, NULL, NULL, 1, NULL, '2026-05-27 19:42:17', NULL),
(3, 7, 'V-87654321', 'ANA MARIA SUAREZ', '02418887766', '04147654321', 'anas@gmail.com', 'AV. BOLIVAR NORTE, VALENCIA', NULL, 'Venezolano', 'CARABOBO', 'VALENCIA', '1990-09-20', 'Femenino', NULL, NULL, NULL, NULL, 1, NULL, '2026-05-27 19:42:17', NULL),
(5, 5, 'V-2098564332', 'Juan perez', '0782439269', NULL, 'instrumentosyvoz@gmail.com', 'Pung Muragl 3', NULL, 'Venezolano/a', 'Distrito Capital', 'Samedan', '1999-07-15', 'Masculino', 'Casado/a', NULL, NULL, NULL, 1, NULL, '2026-06-20 02:06:36', NULL),
(8, 4, 'V-90000001', 'PRUEBA QA 01 C4CA4', '0212-5550001', NULL, 'prueba.qa1@example.com', 'Av. Prueba QA #1, Sector Ficticio', NULL, 'Venezolana', 'Distrito Capital', 'Caracas', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:07', NULL),
(9, 4, 'V-90000002', 'PRUEBA QA 02 C81E7', '0212-5550002', NULL, 'prueba.qa2@example.com', 'Av. Prueba QA #2, Sector Ficticio', NULL, 'Venezolana', 'Miranda', 'Los Teques', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:07', NULL),
(10, 4, 'V-90000003', 'PRUEBA QA 03 ECCBC', '0212-5550003', NULL, 'prueba.qa3@example.com', 'Av. Prueba QA #3, Sector Ficticio', NULL, 'Venezolana', 'Carabobo', 'Valencia', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:07', NULL),
(11, 4, 'V-90000004', 'PRUEBA QA 04 A87FF', '0212-5550004', NULL, 'prueba.qa4@example.com', 'Av. Prueba QA #4, Sector Ficticio', NULL, 'Venezolana', 'Zulia', 'Maracaibo', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:07', NULL),
(12, 4, 'V-90000005', 'PRUEBA QA 05 E4DA3', '0212-5550005', NULL, 'prueba.qa5@example.com', 'Av. Prueba QA #5, Sector Ficticio', NULL, 'Venezolana', 'Aragua', 'Maracay', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:07', NULL),
(13, 4, 'V-90000006', 'PRUEBA QA 06 16790', '0212-5550006', NULL, 'prueba.qa6@example.com', 'Av. Prueba QA #6, Sector Ficticio', NULL, 'Venezolana', 'Distrito Capital', 'Caracas', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:08', NULL),
(14, 4, 'V-90000007', 'PRUEBA QA 07 8F14E', '0212-5550007', NULL, 'prueba.qa7@example.com', 'Av. Prueba QA #7, Sector Ficticio', NULL, 'Venezolana', 'Miranda', 'Los Teques', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:08', NULL),
(15, 4, 'V-90000008', 'PRUEBA QA 08 C9F0F', '0212-5550008', NULL, 'prueba.qa8@example.com', 'Av. Prueba QA #8, Sector Ficticio', NULL, 'Venezolana', 'Carabobo', 'Valencia', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:08', NULL),
(16, 4, 'V-90000009', 'PRUEBA QA 09 45C48', '0212-5550009', NULL, 'prueba.qa9@example.com', 'Av. Prueba QA #9, Sector Ficticio', NULL, 'Venezolana', 'Zulia', 'Maracaibo', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:55:08', NULL),
(17, 4, 'V-90000010', 'PRUEBA QA 10 D3D94', '0212-5550010', NULL, 'prueba.qa10@example.com', 'Av. Prueba QA #10, Sector Ficticio', NULL, 'Venezolana', 'Distrito Capital', 'Caracas', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:56:55', NULL),
(18, 4, 'V-90000011', 'PRUEBA QA 11 6512B', '0212-5550011', NULL, 'prueba.qa11@example.com', 'Av. Prueba QA #11, Sector Ficticio', NULL, 'Venezolana', 'Miranda', 'Los Teques', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:03', NULL),
(19, 4, 'V-90000012', 'PRUEBA QA 12 C20AD', '0212-5550012', NULL, 'prueba.qa12@example.com', 'Av. Prueba QA #12, Sector Ficticio', NULL, 'Venezolana', 'Carabobo', 'Valencia', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:10', NULL),
(20, 4, 'V-90000013', 'PRUEBA QA 13 C51CE', '0212-5550013', NULL, 'prueba.qa13@example.com', 'Av. Prueba QA #13, Sector Ficticio', NULL, 'Venezolana', 'Zulia', 'Maracaibo', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:17', NULL),
(21, 4, 'V-90000014', 'PRUEBA QA 14 AAB32', '0212-5550014', NULL, 'prueba.qa14@example.com', 'Av. Prueba QA #14, Sector Ficticio', NULL, 'Venezolana', 'Aragua', 'Maracay', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:25', NULL),
(22, 4, 'V-90000015', 'PRUEBA QA 15 9BF31', '0212-5550015', NULL, 'prueba.qa15@example.com', 'Av. Prueba QA #15, Sector Ficticio', NULL, 'Venezolana', 'Distrito Capital', 'Caracas', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:32', NULL),
(23, 4, 'V-90000016', 'PRUEBA QA 16 C74D9', '0212-5550016', NULL, 'prueba.qa16@example.com', 'Av. Prueba QA #16, Sector Ficticio', NULL, 'Venezolana', 'Miranda', 'Los Teques', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:40', NULL),
(24, 4, 'V-90000017', 'PRUEBA QA 17 70EFD', '0212-5550017', NULL, 'prueba.qa17@example.com', 'Av. Prueba QA #17, Sector Ficticio', NULL, 'Venezolana', 'Carabobo', 'Valencia', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:47', NULL),
(25, 4, 'V-90000018', 'PRUEBA QA 18 6F492', '0212-5550018', NULL, 'prueba.qa18@example.com', 'Av. Prueba QA #18, Sector Ficticio', NULL, 'Venezolana', 'Zulia', 'Maracaibo', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:57:54', NULL),
(26, 4, 'V-90000019', 'PRUEBA QA 19 1F0E3', '0212-5550019', NULL, 'prueba.qa19@example.com', 'Av. Prueba QA #19, Sector Ficticio', NULL, 'Venezolana', 'Aragua', 'Maracay', '1990-01-15', 'M', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:58:02', NULL),
(27, 4, 'V-90000020', 'PRUEBA QA 20 98F13', '0212-5550020', NULL, 'prueba.qa20@example.com', 'Av. Prueba QA #20, Sector Ficticio', NULL, 'Venezolana', 'Distrito Capital', 'Caracas', '1990-01-15', 'F', 'Natural', NULL, NULL, NULL, 1, NULL, '2026-06-20 22:58:11', NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poliza`
--

CREATE TABLE `poliza` (
  `id` bigint UNSIGNED NOT NULL,
  `nro_contrato` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nro_venezolana` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `solicitud_id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED DEFAULT NULL,
  `total` decimal(18,2) NOT NULL DEFAULT '0.00',
  `total_bs` decimal(18,2) NOT NULL DEFAULT '0.00',
  `tasa_emision` decimal(18,4) NOT NULL DEFAULT '1.0000',
  `tasa_emision_eur` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `cobertura_dolares` decimal(18,2) NOT NULL DEFAULT '0.00',
  `cobertura_bs` decimal(18,2) NOT NULL DEFAULT '0.00',
  `pago` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia_pago` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Anual',
  `moneda` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `asegurado_nombre` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asegurado_ci` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `snapshot_datos` json DEFAULT NULL,
  `tarifario_version_id` bigint UNSIGNED DEFAULT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `papeleria` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vendedor_id` bigint UNSIGNED DEFAULT NULL,
  `sede_poliza` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVA',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `poliza`
--

INSERT INTO `poliza` (`id`, `nro_contrato`, `nro_venezolana`, `solicitud_id`, `producto_id`, `total`, `total_bs`, `tasa_emision`, `tasa_emision_eur`, `cobertura_dolares`, `cobertura_bs`, `pago`, `frecuencia_pago`, `moneda`, `tipo`, `asegurado_nombre`, `asegurado_ci`, `snapshot_datos`, `tarifario_version_id`, `fecha_emision`, `fecha_vencimiento`, `papeleria`, `vendedor_id`, `sede_poliza`, `status`, `deleted_at`, `created_by`, `updated_by`) VALUES
(1, 'SEF-2026-VEH-00845', NULL, 1, 1, 487.00, 256524.37, 526.7459, 0.0000, 15000.00, 7902750.00, 'Contado', 'Anual', 'USD', 'Individual', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', '{\"placa\": \"AA111BB\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Básico\"}, \"total_bs\": 256524.37, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"total_usd\": 487}', NULL, '2026-06-02', '2027-06-02', NULL, 6, 'Maracaibo', 'ACTIVA', NULL, 6, 50),
(2, 'SEF-2026-VEH-00844', NULL, 2, 1, 350.00, 184402.05, 526.8630, 0.0000, 15000.00, 7902945.00, 'Contado', 'Anual', 'USD', 'Individual', 'PEDRO JOSE SALAZAR', 'V-12345678', '{\"placa\": \"CC222DD\", \"tomador\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Bu00e1sico\"}, \"total_bs\": 184402.05, \"asegurado\": {\"ci\": \"V-12345678\", \"nombre\": \"PEDRO JOSE SALAZAR\"}, \"total_usd\": 350}', NULL, '2026-06-05', '2027-06-05', NULL, 9, 'Valencia', 'ANULADA', NULL, 9, 9),
(3, 'SEF-2026-VEH-00846', NULL, 3, 2, 1240.00, 653307.84, 526.8612, 0.0000, 25000.00, 13171530.00, 'Financiado', 'Anual', 'USD', 'Individual', 'ANA MARIA SUAREZ', 'V-87654321', '{\"placa\": \"EE333FF\", \"tomador\": {\"ci\": \"V-87654321\", \"nombre\": \"ANA MARIA SUAREZ\"}, \"producto\": {\"id\": 2, \"tipo\": \"apov\", \"nombre\": \"APOV Oro\"}, \"total_bs\": 653307.84, \"asegurado\": {\"ci\": \"V-87654321\", \"nombre\": \"ANA MARIA SUAREZ\"}, \"total_usd\": 1240}', NULL, '2026-06-10', '2027-06-10', NULL, 7, 'Caracas', 'ACTIVA', NULL, 7, 7),
(4, 'POL-2026-00004', NULL, 5, 2, 290.00, 152789.52, 526.8604, 926.8604, 10000.00, 5268604.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": \"290\", \"moneda\": \"USD\", \"referencia\": \"asdassw\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 2, \"tipo\": \"apov\", \"nombre\": \"APOV Oro\", \"cobertura\": \"10000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 526.8604, \"total_bs\": 152789.52, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"tarifario\": {\"id\": 11, \"datos\": {\"categoria\": \"Accidentes Personales\", \"prima_anual\": 250, \"suma_persona\": 10000, \"prima_persona\": 250}, \"nombre\": \"Tarifa APOV Oro\", \"version\": 1}, \"total_usd\": 290, \"coberturas\": {\"iva\": 40, \"total\": 290, \"tarifa\": {\"id\": 11, \"datos\": {\"categoria\": \"Accidentes Personales\", \"prima_anual\": 250, \"suma_persona\": 10000, \"prima_persona\": 250}, \"nombre\": \"Tarifa APOV Oro\"}, \"tasaBCV\": 526.8604, \"subtotal\": 250, \"total_bs\": 152789.516, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0, \"valor_declarado\": 0, \"documentos_requeridos\": []}, \"tasa_emision\": 526.8604, \"fecha_emision\": \"2026-06-19\", \"tasa_emision_eur\": 926.8604}', 11, '2026-06-19', '2027-06-19', NULL, 5, 'Caracas Principal', 'ACTIVA', NULL, 5, 5),
(5, 'POL-2026-00005', NULL, 8, 8, 213.80, 112642.75, 526.8604, 926.8604, 15000.00, 7902906.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'Juan perez', '2098564332', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": \"213.80\", \"moneda\": \"USD\", \"referencia\": \"dsasad2123s\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"2098564332\", \"nombre\": \"Juan perez\"}, \"producto\": {\"id\": 8, \"tipo\": \"accidentes\", \"nombre\": \"Accidentes Personales\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 526.8604, \"total_bs\": 112642.75, \"asegurado\": {\"ci\": \"2098564332\", \"nombre\": \"Juan perez\"}, \"tarifario\": {\"id\": 8, \"datos\": {\"categoria\": \"Estándar\", \"prima_anual\": 180, \"suma_persona\": 15000, \"prima_persona\": 180}, \"nombre\": \"Tarifa Estándar\", \"version\": 1}, \"total_usd\": 213.8, \"coberturas\": {\"iva\": 28.8, \"total\": 213.8, \"tarifa\": {\"id\": 8, \"datos\": {\"categoria\": \"Estándar\", \"prima_anual\": 180, \"suma_persona\": 15000, \"prima_persona\": 180}, \"nombre\": \"Tarifa Estándar\"}, \"tasaBCV\": 526.8604, \"subtotal\": 180, \"total_bs\": 112642.75352, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 5, \"valor_declarado\": 0, \"documentos_requeridos\": []}, \"tasa_emision\": 526.8604, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 926.8604}', 8, '2026-06-20', '2027-06-20', NULL, 5, 'Caracas Principal', 'ACTIVA', NULL, 5, 5),
(6, 'POL-2026-00006', NULL, 11, 11, 7626.40, 4018048.15, 526.8604, 926.8604, 15000.00, 7902906.00, 'Transferencia USD', 'Mensual', 'USD', 'Individual', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": \"7626.40\", \"moneda\": \"USD\", \"referencia\": \"gefgderf\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"producto\": {\"id\": 11, \"tipo\": \"hogar\", \"nombre\": \"Poliza Muebles\", \"cobertura\": \"20000.00\", \"tipo_calculo\": \"por_valor\"}, \"tasa_bcv\": 526.8604, \"total_bs\": 4018048.15, \"asegurado\": {\"ci\": \"V-4961881\", \"nombre\": \"ODILA ELVIRA GONZALEZ DE CAMACHO\"}, \"tarifario\": {\"id\": 18, \"datos\": {\"tasa_pct\": 27, \"prima_minima\": 200, \"cobertura_max\": 2000}, \"nombre\": \"Muebles\", \"version\": 1}, \"total_usd\": 7626.4, \"coberturas\": {\"iva\": 86.4, \"total\": 7626.4, \"tarifa\": {\"id\": 18, \"datos\": {\"tasa_pct\": 27, \"prima_minima\": 200, \"cobertura_max\": 2000}, \"nombre\": \"Muebles\"}, \"tasaBCV\": 526.8604, \"subtotal\": 540, \"total_bs\": 4018048.15456, \"tipo_calculo\": \"por_valor\", \"valor_mercado\": 15000, \"derecho_poliza\": 7000, \"valor_declarado\": 2000, \"documentos_requeridos\": [{\"nombre\": \"Cédula de Identidad\", \"obligatorio\": true}, {\"nombre\": \"RIF\", \"obligatorio\": true}, {\"nombre\": \"Declaración Jurada\", \"obligatorio\": true}, {\"nombre\": \"Inventario de Bienes\", \"obligatorio\": true}, {\"nombre\": \"Factura del Bien\", \"obligatorio\": true}]}, \"tasa_emision\": 526.8604, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 926.8604}', 18, '2026-06-20', '2027-06-20', NULL, 5, 'Caracas Principal', 'ACTIVA', NULL, 5, 5),
(8, 'POL-2026-00008', NULL, 13, 1, 120.00, 73491.98, 612.4332, 612.4332, 5000.00, 3062166.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 01 C4CA4', 'V-90000001', '{\"bien\": {\"id\": 8, \"tipo\": \"vehiculo\", \"atributos\": {\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Blanco\", \"marca\": \"Toyota\", \"placa\": \"QA001AB\", \"modelo\": \"Corolla\", \"valor_mercado\": 15000}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 120, \"moneda\": \"USD\", \"referencia\": \"QA-REF-1\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000001\", \"nombre\": \"PRUEBA QA 01 C4CA4\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Básico\", \"cobertura\": \"5000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 73491.98, \"asegurado\": {\"ci\": \"V-90000001\", \"nombre\": \"PRUEBA QA 01 C4CA4\"}, \"tarifario\": {\"id\": 10, \"datos\": {\"categoria\": \"Responsabilidad Civil\", \"suma_cosa\": 5000, \"prima_cosa\": 120, \"prima_anual\": 120}, \"nombre\": \"Tarifa RCV Básico\", \"version\": 1}, \"total_usd\": 120, \"coberturas\": {\"iva\": 0, \"total\": 120, \"tasaBCV\": 612.4332, \"subtotal\": 120, \"total_bs\": 73491.98, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 10, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(9, 'POL-2026-00009', NULL, 14, 1, 120.00, 73491.98, 612.4332, 612.4332, 5000.00, 3062166.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 02 C81E7', 'V-90000002', '{\"bien\": {\"id\": 9, \"tipo\": \"vehiculo\", \"atributos\": {\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Negro\", \"marca\": \"Chevrolet\", \"placa\": \"QA002AB\", \"modelo\": \"Aveo\", \"valor_mercado\": 15000}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 120, \"moneda\": \"USD\", \"referencia\": \"QA-REF-2\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000002\", \"nombre\": \"PRUEBA QA 02 C81E7\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Básico\", \"cobertura\": \"5000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 73491.98, \"asegurado\": {\"ci\": \"V-90000002\", \"nombre\": \"PRUEBA QA 02 C81E7\"}, \"tarifario\": {\"id\": 10, \"datos\": {\"categoria\": \"Responsabilidad Civil\", \"suma_cosa\": 5000, \"prima_cosa\": 120, \"prima_anual\": 120}, \"nombre\": \"Tarifa RCV Básico\", \"version\": 1}, \"total_usd\": 120, \"coberturas\": {\"iva\": 0, \"total\": 120, \"tasaBCV\": 612.4332, \"subtotal\": 120, \"total_bs\": 73491.98, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 10, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(10, 'POL-2026-00010', NULL, 15, 1, 120.00, 73491.98, 612.4332, 612.4332, 5000.00, 3062166.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 03 ECCBC', 'V-90000003', '{\"bien\": {\"id\": 10, \"tipo\": \"vehiculo\", \"atributos\": {\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Gris\", \"marca\": \"Ford\", \"placa\": \"QA003AB\", \"modelo\": \"Fiesta\", \"valor_mercado\": 15000}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 120, \"moneda\": \"USD\", \"referencia\": \"QA-REF-3\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000003\", \"nombre\": \"PRUEBA QA 03 ECCBC\"}, \"producto\": {\"id\": 1, \"tipo\": \"rcv\", \"nombre\": \"RCV Básico\", \"cobertura\": \"5000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 73491.98, \"asegurado\": {\"ci\": \"V-90000003\", \"nombre\": \"PRUEBA QA 03 ECCBC\"}, \"tarifario\": {\"id\": 10, \"datos\": {\"categoria\": \"Responsabilidad Civil\", \"suma_cosa\": 5000, \"prima_cosa\": 120, \"prima_anual\": 120}, \"nombre\": \"Tarifa RCV Básico\", \"version\": 1}, \"total_usd\": 120, \"coberturas\": {\"iva\": 0, \"total\": 120, \"tasaBCV\": 612.4332, \"subtotal\": 120, \"total_bs\": 73491.98, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 10, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(11, 'POL-2026-00011', NULL, 16, 2, 250.00, 153108.30, 612.4332, 612.4332, 10000.00, 6124332.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 04 A87FF', 'V-90000004', '{\"bien\": {\"id\": 11, \"tipo\": \"vehiculo\", \"atributos\": {\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Azul\", \"marca\": \"Hyundai\", \"placa\": \"QA004AB\", \"modelo\": \"Accent\", \"valor_mercado\": 15000}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 250, \"moneda\": \"USD\", \"referencia\": \"QA-REF-4\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000004\", \"nombre\": \"PRUEBA QA 04 A87FF\"}, \"producto\": {\"id\": 2, \"tipo\": \"apov\", \"nombre\": \"APOV Oro\", \"cobertura\": \"10000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 153108.3, \"asegurado\": {\"ci\": \"V-90000004\", \"nombre\": \"PRUEBA QA 04 A87FF\"}, \"tarifario\": {\"id\": 11, \"datos\": {\"categoria\": \"Accidentes Personales\", \"prima_anual\": 250, \"suma_persona\": 10000, \"prima_persona\": 250}, \"nombre\": \"Tarifa APOV Oro\", \"version\": 1}, \"total_usd\": 250, \"coberturas\": {\"iva\": 0, \"total\": 250, \"tasaBCV\": 612.4332, \"subtotal\": 250, \"total_bs\": 153108.3, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 11, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(12, 'POL-2026-00012', NULL, 17, 2, 250.00, 153108.30, 612.4332, 612.4332, 10000.00, 6124332.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 05 E4DA3', 'V-90000005', '{\"bien\": {\"id\": 12, \"tipo\": \"vehiculo\", \"atributos\": {\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Rojo\", \"marca\": \"Kia\", \"placa\": \"QA005AB\", \"modelo\": \"Rio\", \"valor_mercado\": 15000}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 250, \"moneda\": \"USD\", \"referencia\": \"QA-REF-5\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000005\", \"nombre\": \"PRUEBA QA 05 E4DA3\"}, \"producto\": {\"id\": 2, \"tipo\": \"apov\", \"nombre\": \"APOV Oro\", \"cobertura\": \"10000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 153108.3, \"asegurado\": {\"ci\": \"V-90000005\", \"nombre\": \"PRUEBA QA 05 E4DA3\"}, \"tarifario\": {\"id\": 11, \"datos\": {\"categoria\": \"Accidentes Personales\", \"prima_anual\": 250, \"suma_persona\": 10000, \"prima_persona\": 250}, \"nombre\": \"Tarifa APOV Oro\", \"version\": 1}, \"total_usd\": 250, \"coberturas\": {\"iva\": 0, \"total\": 250, \"tasaBCV\": 612.4332, \"subtotal\": 250, \"total_bs\": 153108.3, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 11, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(13, 'POL-2026-00013', NULL, 18, 2, 250.00, 153108.30, 612.4332, 612.4332, 10000.00, 6124332.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 06 16790', 'V-90000006', '{\"bien\": {\"id\": 13, \"tipo\": \"vehiculo\", \"atributos\": {\"uso\": \"Particular\", \"anio\": \"2022\", \"color\": \"Blanco\", \"marca\": \"Renault\", \"placa\": \"QA006AB\", \"modelo\": \"Sandero\", \"valor_mercado\": 15000}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 250, \"moneda\": \"USD\", \"referencia\": \"QA-REF-6\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000006\", \"nombre\": \"PRUEBA QA 06 16790\"}, \"producto\": {\"id\": 2, \"tipo\": \"apov\", \"nombre\": \"APOV Oro\", \"cobertura\": \"10000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 153108.3, \"asegurado\": {\"ci\": \"V-90000006\", \"nombre\": \"PRUEBA QA 06 16790\"}, \"tarifario\": {\"id\": 11, \"datos\": {\"categoria\": \"Accidentes Personales\", \"prima_anual\": 250, \"suma_persona\": 10000, \"prima_persona\": 250}, \"nombre\": \"Tarifa APOV Oro\", \"version\": 1}, \"total_usd\": 250, \"coberturas\": {\"iva\": 0, \"total\": 250, \"tasaBCV\": 612.4332, \"subtotal\": 250, \"total_bs\": 153108.3, \"tipo_calculo\": \"fijo\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 11, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(14, 'POL-2026-00014', NULL, 19, 3, 400.00, 244973.28, 612.4332, 612.4332, 20000.00, 12248664.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 07 8F14E', 'V-90000007', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 400, \"moneda\": \"USD\", \"referencia\": \"QA-REF-7\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000007\", \"nombre\": \"PRUEBA QA 07 8F14E\"}, \"producto\": {\"id\": 3, \"tipo\": \"ec\", \"nombre\": \"EC/EP Premium\", \"cobertura\": \"20000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 244973.28, \"asegurado\": {\"ci\": \"V-90000007\", \"nombre\": \"PRUEBA QA 07 8F14E\"}, \"tarifario\": {\"id\": 12, \"datos\": {\"categoria\": \"Cobertura Extendida\", \"suma_cosa\": 20000, \"prima_cosa\": 400, \"prima_anual\": 400}, \"nombre\": \"Tarifa EC/EP Premium\", \"version\": 1}, \"total_usd\": 400, \"coberturas\": {\"iva\": 0, \"total\": 400, \"tasaBCV\": 612.4332, \"subtotal\": 400, \"total_bs\": 244973.28, \"tipo_calculo\": \"fijo\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 12, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(15, 'POL-2026-00015', NULL, 20, 3, 400.00, 244973.28, 612.4332, 612.4332, 20000.00, 12248664.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 08 C9F0F', 'V-90000008', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 400, \"moneda\": \"USD\", \"referencia\": \"QA-REF-8\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000008\", \"nombre\": \"PRUEBA QA 08 C9F0F\"}, \"producto\": {\"id\": 3, \"tipo\": \"ec\", \"nombre\": \"EC/EP Premium\", \"cobertura\": \"20000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 244973.28, \"asegurado\": {\"ci\": \"V-90000008\", \"nombre\": \"PRUEBA QA 08 C9F0F\"}, \"tarifario\": {\"id\": 12, \"datos\": {\"categoria\": \"Cobertura Extendida\", \"suma_cosa\": 20000, \"prima_cosa\": 400, \"prima_anual\": 400}, \"nombre\": \"Tarifa EC/EP Premium\", \"version\": 1}, \"total_usd\": 400, \"coberturas\": {\"iva\": 0, \"total\": 400, \"tasaBCV\": 612.4332, \"subtotal\": 400, \"total_bs\": 244973.28, \"tipo_calculo\": \"fijo\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 12, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(16, 'POL-2026-00016', NULL, 21, 5, 180.00, 110237.98, 612.4332, 612.4332, 50000.00, 30621660.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 09 45C48', 'V-90000009', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 180, \"moneda\": \"USD\", \"referencia\": \"QA-REF-9\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000009\", \"nombre\": \"PRUEBA QA 09 45C48\"}, \"producto\": {\"id\": 5, \"tipo\": \"vida\", \"nombre\": \"Seguro de Vida Individual\", \"cobertura\": \"50000.00\", \"tipo_calculo\": \"por_plan\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 110237.98, \"asegurado\": {\"ci\": \"V-90000009\", \"nombre\": \"PRUEBA QA 09 45C48\"}, \"tarifario\": {\"id\": 1, \"datos\": {\"gastos_sepelio\": {\"suma\": 2000, \"prima\": 20}, \"invalidez_total\": {\"suma\": 20000, \"prima\": 60}, \"muerte_accidental\": {\"suma\": 20000, \"prima\": 80}}, \"nombre\": \"Plan Básico\", \"version\": 1}, \"total_usd\": 180, \"coberturas\": {\"iva\": 0, \"total\": 180, \"tasaBCV\": 612.4332, \"subtotal\": 180, \"total_bs\": 110237.98, \"tipo_calculo\": \"por_plan\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 1, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(17, 'POL-2026-00017', NULL, 22, 5, 250.00, 153108.30, 612.4332, 612.4332, 50000.00, 30621660.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 10 D3D94', 'V-90000010', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 250, \"moneda\": \"USD\", \"referencia\": \"QA-REF-10\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000010\", \"nombre\": \"PRUEBA QA 10 D3D94\"}, \"producto\": {\"id\": 5, \"tipo\": \"vida\", \"nombre\": \"Seguro de Vida Individual\", \"cobertura\": \"50000.00\", \"tipo_calculo\": \"por_plan\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 153108.3, \"asegurado\": {\"ci\": \"V-90000010\", \"nombre\": \"PRUEBA QA 10 D3D94\"}, \"tarifario\": {\"id\": 2, \"datos\": {\"gastos_sepelio\": {\"suma\": 3000, \"prima\": 30}, \"invalidez_total\": {\"suma\": 50000, \"prima\": 120}, \"muerte_accidental\": {\"suma\": 50000, \"prima\": 150}, \"renta_hospitalaria\": {\"suma\": 500, \"prima\": 40}}, \"nombre\": \"Plan Estándar\", \"version\": 1}, \"total_usd\": 250, \"coberturas\": {\"iva\": 0, \"total\": 250, \"tasaBCV\": 612.4332, \"subtotal\": 250, \"total_bs\": 153108.3, \"tipo_calculo\": \"por_plan\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 2, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(18, 'POL-2026-00018', NULL, 23, 5, 320.00, 195978.62, 612.4332, 612.4332, 50000.00, 30621660.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 11 6512B', 'V-90000011', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 320, \"moneda\": \"USD\", \"referencia\": \"QA-REF-11\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000011\", \"nombre\": \"PRUEBA QA 11 6512B\"}, \"producto\": {\"id\": 5, \"tipo\": \"vida\", \"nombre\": \"Seguro de Vida Individual\", \"cobertura\": \"50000.00\", \"tipo_calculo\": \"por_plan\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 195978.62, \"asegurado\": {\"ci\": \"V-90000011\", \"nombre\": \"PRUEBA QA 11 6512B\"}, \"tarifario\": {\"id\": 3, \"datos\": {\"gastos_sepelio\": {\"suma\": 5000, \"prima\": 50}, \"invalidez_total\": {\"suma\": 100000, \"prima\": 200}, \"muerte_accidental\": {\"suma\": 100000, \"prima\": 250}, \"renta_hospitalaria\": {\"suma\": 1000, \"prima\": 70}, \"enfermedades_graves\": {\"suma\": 50000, \"prima\": 100}}, \"nombre\": \"Plan Premium\", \"version\": 1}, \"total_usd\": 320, \"coberturas\": {\"iva\": 0, \"total\": 320, \"tasaBCV\": 612.4332, \"subtotal\": 320, \"total_bs\": 195978.62, \"tipo_calculo\": \"por_plan\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 3, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(19, 'POL-2026-00019', NULL, 24, 6, 200.00, 122486.64, 612.4332, 612.4332, 100000.00, 61243320.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 12 C20AD', 'V-90000012', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 200, \"moneda\": \"USD\", \"referencia\": \"QA-REF-12\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000012\", \"nombre\": \"PRUEBA QA 12 C20AD\"}, \"producto\": {\"id\": 6, \"tipo\": \"salud\", \"nombre\": \"HCM — Hospitalización y Maternidad\", \"cobertura\": \"100000.00\", \"tipo_calculo\": \"por_nivel\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 122486.64, \"asegurado\": {\"ci\": \"V-90000012\", \"nombre\": \"PRUEBA QA 12 C20AD\"}, \"tarifario\": {\"id\": 4, \"datos\": {\"suma\": 30000, \"nivel\": \"Nivel I\", \"prima\": 800}, \"nombre\": \"Nivel I\", \"version\": 1}, \"total_usd\": 200, \"coberturas\": {\"iva\": 0, \"total\": 200, \"tasaBCV\": 612.4332, \"subtotal\": 200, \"total_bs\": 122486.64, \"tipo_calculo\": \"por_nivel\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 4, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(20, 'POL-2026-00020', NULL, 25, 6, 280.00, 171481.30, 612.4332, 612.4332, 100000.00, 61243320.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 13 C51CE', 'V-90000013', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 280, \"moneda\": \"USD\", \"referencia\": \"QA-REF-13\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000013\", \"nombre\": \"PRUEBA QA 13 C51CE\"}, \"producto\": {\"id\": 6, \"tipo\": \"salud\", \"nombre\": \"HCM — Hospitalización y Maternidad\", \"cobertura\": \"100000.00\", \"tipo_calculo\": \"por_nivel\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 171481.3, \"asegurado\": {\"ci\": \"V-90000013\", \"nombre\": \"PRUEBA QA 13 C51CE\"}, \"tarifario\": {\"id\": 5, \"datos\": {\"suma\": 60000, \"nivel\": \"Nivel II\", \"prima\": 1300}, \"nombre\": \"Nivel II\", \"version\": 1}, \"total_usd\": 280, \"coberturas\": {\"iva\": 0, \"total\": 280, \"tasaBCV\": 612.4332, \"subtotal\": 280, \"total_bs\": 171481.3, \"tipo_calculo\": \"por_nivel\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 5, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(21, 'POL-2026-00021', NULL, 26, 6, 360.00, 220475.95, 612.4332, 612.4332, 100000.00, 61243320.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 14 AAB32', 'V-90000014', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 360, \"moneda\": \"USD\", \"referencia\": \"QA-REF-14\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000014\", \"nombre\": \"PRUEBA QA 14 AAB32\"}, \"producto\": {\"id\": 6, \"tipo\": \"salud\", \"nombre\": \"HCM — Hospitalización y Maternidad\", \"cobertura\": \"100000.00\", \"tipo_calculo\": \"por_nivel\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 220475.95, \"asegurado\": {\"ci\": \"V-90000014\", \"nombre\": \"PRUEBA QA 14 AAB32\"}, \"tarifario\": {\"id\": 6, \"datos\": {\"suma\": 100000, \"nivel\": \"Nivel III\", \"prima\": 2000}, \"nombre\": \"Nivel III\", \"version\": 1}, \"total_usd\": 360, \"coberturas\": {\"iva\": 0, \"total\": 360, \"tasaBCV\": 612.4332, \"subtotal\": 360, \"total_bs\": 220475.95, \"tipo_calculo\": \"por_nivel\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 6, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(22, 'POL-2026-00022', NULL, 27, 8, 185.00, 113300.14, 612.4332, 612.4332, 15000.00, 9186498.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 15 9BF31', 'V-90000015', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 185, \"moneda\": \"USD\", \"referencia\": \"QA-REF-15\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000015\", \"nombre\": \"PRUEBA QA 15 9BF31\"}, \"producto\": {\"id\": 8, \"tipo\": \"accidentes\", \"nombre\": \"Accidentes Personales\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 113300.14, \"asegurado\": {\"ci\": \"V-90000015\", \"nombre\": \"PRUEBA QA 15 9BF31\"}, \"tarifario\": {\"id\": 8, \"datos\": {\"categoria\": \"Estándar\", \"prima_anual\": 180, \"suma_persona\": 15000, \"prima_persona\": 180}, \"nombre\": \"Tarifa Estándar\", \"version\": 1}, \"total_usd\": 185, \"coberturas\": {\"iva\": 0, \"total\": 185, \"tasaBCV\": 612.4332, \"subtotal\": 185, \"total_bs\": 113300.14, \"tipo_calculo\": \"fijo\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 8, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(23, 'POL-2026-00023', NULL, 28, 8, 185.00, 113300.14, 612.4332, 612.4332, 15000.00, 9186498.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 16 C74D9', 'V-90000016', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 185, \"moneda\": \"USD\", \"referencia\": \"QA-REF-16\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000016\", \"nombre\": \"PRUEBA QA 16 C74D9\"}, \"producto\": {\"id\": 8, \"tipo\": \"accidentes\", \"nombre\": \"Accidentes Personales\", \"cobertura\": \"15000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 113300.14, \"asegurado\": {\"ci\": \"V-90000016\", \"nombre\": \"PRUEBA QA 16 C74D9\"}, \"tarifario\": {\"id\": 8, \"datos\": {\"categoria\": \"Estándar\", \"prima_anual\": 180, \"suma_persona\": 15000, \"prima_persona\": 180}, \"nombre\": \"Tarifa Estándar\", \"version\": 1}, \"total_usd\": 185, \"coberturas\": {\"iva\": 0, \"total\": 185, \"tasaBCV\": 612.4332, \"subtotal\": 185, \"total_bs\": 113300.14, \"tipo_calculo\": \"fijo\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 8, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(24, 'POL-2026-00024', NULL, 29, 9, 123.00, 75329.28, 612.4332, 612.4332, 3000.00, 1837299.60, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 17 70EFD', 'V-90000017', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 123, \"moneda\": \"USD\", \"referencia\": \"QA-REF-17\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000017\", \"nombre\": \"PRUEBA QA 17 70EFD\"}, \"producto\": {\"id\": 9, \"tipo\": \"funeraria\", \"nombre\": \"Póliza de Asistencia Funeraria\", \"cobertura\": \"3000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 75329.28, \"asegurado\": {\"ci\": \"V-90000017\", \"nombre\": \"PRUEBA QA 17 70EFD\"}, \"tarifario\": {\"id\": 9, \"datos\": {\"categoria\": \"Individual\", \"prima_anual\": 120, \"suma_persona\": 3000, \"prima_persona\": 120}, \"nombre\": \"Tarifa Individual\", \"version\": 1}, \"total_usd\": 123, \"coberturas\": {\"iva\": 0, \"total\": 123, \"tasaBCV\": 612.4332, \"subtotal\": 123, \"total_bs\": 75329.28, \"tipo_calculo\": \"fijo\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 9, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(25, 'POL-2026-00025', NULL, 30, 9, 123.00, 75329.28, 612.4332, 612.4332, 3000.00, 1837299.60, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 18 6F492', 'V-90000018', '{\"bien\": null, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 123, \"moneda\": \"USD\", \"referencia\": \"QA-REF-18\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000018\", \"nombre\": \"PRUEBA QA 18 6F492\"}, \"producto\": {\"id\": 9, \"tipo\": \"funeraria\", \"nombre\": \"Póliza de Asistencia Funeraria\", \"cobertura\": \"3000.00\", \"tipo_calculo\": \"fijo\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 75329.28, \"asegurado\": {\"ci\": \"V-90000018\", \"nombre\": \"PRUEBA QA 18 6F492\"}, \"tarifario\": {\"id\": 9, \"datos\": {\"categoria\": \"Individual\", \"prima_anual\": 120, \"suma_persona\": 3000, \"prima_persona\": 120}, \"nombre\": \"Tarifa Individual\", \"version\": 1}, \"total_usd\": 123, \"coberturas\": {\"iva\": 0, \"total\": 123, \"tasaBCV\": 612.4332, \"subtotal\": 123, \"total_bs\": 75329.28, \"tipo_calculo\": \"fijo\", \"valor_mercado\": null, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 9, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(26, 'POL-2026-00026', NULL, 31, 11, 300.00, 183729.96, 612.4332, 612.4332, 15000.00, 9186498.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 19 1F0E3', 'V-90000019', '{\"bien\": {\"id\": 14, \"tipo\": \"inmueble\", \"atributos\": {\"subtipo\": \"Apartamento\", \"direccion\": \"Av. Prueba QA #19, Sector Ficticio\"}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 300, \"moneda\": \"USD\", \"referencia\": \"QA-REF-19\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000019\", \"nombre\": \"PRUEBA QA 19 1F0E3\"}, \"producto\": {\"id\": 11, \"tipo\": \"hogar\", \"nombre\": \"Poliza Muebles\", \"cobertura\": \"20000.00\", \"tipo_calculo\": \"por_valor\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 183729.96, \"asegurado\": {\"ci\": \"V-90000019\", \"nombre\": \"PRUEBA QA 19 1F0E3\"}, \"tarifario\": {\"id\": 18, \"datos\": {\"tasa_pct\": 27, \"prima_minima\": 200, \"cobertura_max\": 2000}, \"nombre\": \"Muebles\", \"version\": 1}, \"total_usd\": 300, \"coberturas\": {\"iva\": 0, \"total\": 300, \"tasaBCV\": 612.4332, \"subtotal\": 300, \"total_bs\": 183729.96, \"tipo_calculo\": \"por_valor\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 18, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4),
(27, 'POL-2026-00027', NULL, 32, 11, 300.00, 183729.96, 612.4332, 612.4332, 15000.00, 9186498.00, 'Transferencia USD', 'Anual', 'USD', 'Individual', 'PRUEBA QA 20 98F13', 'V-90000020', '{\"bien\": {\"id\": 15, \"tipo\": \"inmueble\", \"atributos\": {\"subtipo\": \"Apartamento\", \"direccion\": \"Av. Prueba QA #20, Sector Ficticio\"}}, \"pagos\": [{\"forma\": \"Transferencia\", \"monto\": 300, \"moneda\": \"USD\", \"referencia\": \"QA-REF-20\"}], \"moneda\": \"USD\", \"tomador\": {\"ci\": \"V-90000020\", \"nombre\": \"PRUEBA QA 20 98F13\"}, \"producto\": {\"id\": 11, \"tipo\": \"hogar\", \"nombre\": \"Poliza Muebles\", \"cobertura\": \"20000.00\", \"tipo_calculo\": \"por_valor\"}, \"tasa_bcv\": 612.4332, \"total_bs\": 183729.96, \"asegurado\": {\"ci\": \"V-90000020\", \"nombre\": \"PRUEBA QA 20 98F13\"}, \"tarifario\": {\"id\": 18, \"datos\": {\"tasa_pct\": 27, \"prima_minima\": 200, \"cobertura_max\": 2000}, \"nombre\": \"Muebles\", \"version\": 1}, \"total_usd\": 300, \"coberturas\": {\"iva\": 0, \"total\": 300, \"tasaBCV\": 612.4332, \"subtotal\": 300, \"total_bs\": 183729.96, \"tipo_calculo\": \"por_valor\", \"valor_mercado\": 15000, \"derecho_poliza\": 0}, \"tasa_emision\": 612.4332, \"fecha_emision\": \"2026-06-20\", \"tasa_emision_eur\": 612.4332}', 18, '2026-06-20', '2027-06-20', NULL, 4, 'Caracas Principal', 'ACTIVA', NULL, 4, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poliza_bienes`
--

CREATE TABLE `poliza_bienes` (
  `id` bigint UNSIGNED NOT NULL,
  `poliza_id` bigint UNSIGNED NOT NULL,
  `bien_asegurado_id` bigint UNSIGNED NOT NULL,
  `certificado` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'NULL = cubierto bajo el nro_contrato de la póliza',
  `cobertura_dolares` decimal(18,2) DEFAULT NULL,
  `cobertura_bs` decimal(18,2) DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `poliza_bienes`
--

INSERT INTO `poliza_bienes` (`id`, `poliza_id`, `bien_asegurado_id`, `certificado`, `cobertura_dolares`, `cobertura_bs`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 1, 1, NULL, 15000.00, 7902750.00, NULL, '2026-06-20 17:36:11', '2026-06-20 17:36:11'),
(2, 2, 2, NULL, 15000.00, 7902945.00, NULL, '2026-06-20 17:36:11', '2026-06-20 17:36:11'),
(3, 3, 3, NULL, 25000.00, 13171530.00, NULL, '2026-06-20 17:36:11', '2026-06-20 17:36:11'),
(5, 8, 8, NULL, 5000.00, 3062166.00, 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(6, 9, 9, NULL, 5000.00, 3062166.00, 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(7, 10, 10, NULL, 5000.00, 3062166.00, 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(8, 11, 11, NULL, 10000.00, 6124332.00, 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(9, 12, 12, NULL, 10000.00, 6124332.00, 4, '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(10, 13, 13, NULL, 10000.00, 6124332.00, 4, '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(11, 26, 14, NULL, 15000.00, 9186498.00, 4, '2026-06-20 18:58:09', '2026-06-20 18:58:09'),
(12, 27, 15, NULL, 15000.00, 9186498.00, 4, '2026-06-20 18:58:18', '2026-06-20 18:58:18'),
(13, 6, 1, 'POL-2026-00006-01', NULL, NULL, 5, '2026-06-20 23:05:14', '2026-06-20 23:05:14');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `id` bigint UNSIGNED NOT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `codigo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publicado` tinyint(1) NOT NULL DEFAULT '1',
  `tipo` enum('rcv','apov','alpd','ec','ep','vida','salud','hogar','accidentes','funeraria','otro') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'otro',
  `categoria` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_bien` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ninguno' COMMENT 'vehiculo|inmueble|vida|bien|ninguno',
  `permite_multiples_bienes` tinyint(1) NOT NULL DEFAULT '0',
  `max_bienes` int UNSIGNED DEFAULT NULL,
  `aplica_beneficiarios` tinyint(1) NOT NULL DEFAULT '0',
  `min_beneficiarios` int UNSIGNED DEFAULT NULL,
  `max_beneficiarios` int UNSIGNED DEFAULT NULL,
  `tipo_calculo` enum('fijo','por_plan','por_nivel','por_valor') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fijo',
  `derecho_poliza` decimal(10,2) NOT NULL DEFAULT '0.00',
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `cobertura` decimal(18,2) NOT NULL DEFAULT '0.00',
  `prima` decimal(18,2) NOT NULL DEFAULT '0.00',
  `moneda` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USD',
  `iva_aplica` tinyint(1) NOT NULL DEFAULT '0',
  `iva_porcentaje` decimal(5,2) DEFAULT NULL,
  `permite_mensualidades` tinyint(1) NOT NULL DEFAULT '0',
  `recargo_mensual_pct` decimal(5,2) DEFAULT NULL,
  `documento_path` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `documentos` longtext COLLATE utf8mb4_unicode_ci,
  `documentos_requeridos` longtext COLLATE utf8mb4_unicode_ci,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`id`, `parent_id`, `codigo`, `nombre`, `publicado`, `tipo`, `categoria`, `tipo_bien`, `permite_multiples_bienes`, `max_bienes`, `aplica_beneficiarios`, `min_beneficiarios`, `max_beneficiarios`, `tipo_calculo`, `derecho_poliza`, `descripcion`, `cobertura`, `prima`, `moneda`, `iva_aplica`, `iva_porcentaje`, `permite_mensualidades`, `recargo_mensual_pct`, `documento_path`, `documentos`, `documentos_requeridos`, `deleted_at`, `created_by`, `updated_by`) VALUES
(1, NULL, NULL, 'RCV Básico', 1, 'rcv', NULL, 'vehiculo', 1, NULL, 0, NULL, NULL, 'fijo', 0.00, 'Responsabilidad civil vehicular básica', 5000.00, 120.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, NULL, NULL, 'APOV Oro', 1, 'apov', NULL, 'vehiculo', 1, NULL, 0, NULL, NULL, 'fijo', 0.00, 'Accidentes personales vehículo plan oro', 10000.00, 250.00, 'USD', 0, NULL, 0, NULL, 'productos/2/documento.pdf', NULL, NULL, NULL, NULL, 5),
(3, NULL, NULL, 'EC/EP Premium', 1, 'ec', NULL, 'ninguno', 0, NULL, 0, NULL, NULL, 'fijo', 0.00, 'Cobertura completa extendida', 20000.00, 400.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, NULL, NULL, 'Seguro de Vida Individual', 1, 'vida', 'Vida', 'ninguno', 0, NULL, 1, NULL, NULL, 'por_plan', 5.00, 'Cobertura por muerte accidental, invalidez total y gastos de sepelio', 50000.00, 0.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(6, NULL, NULL, 'HCM — Hospitalización y Maternidad', 1, 'salud', 'Salud', 'ninguno', 0, NULL, 0, NULL, NULL, 'por_nivel', 5.00, 'Hospitalización, cirugía, maternidad y emergencias médicas', 100000.00, 0.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(7, NULL, NULL, 'Seguro de Hogar', 1, 'hogar', 'Propiedad', 'ninguno', 0, NULL, 0, NULL, NULL, 'por_valor', 5.00, 'Protección estructural, contenido e incendio para inmuebles residenciales', 0.00, 0.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, '2026-06-19 22:29:58', NULL, NULL),
(8, NULL, NULL, 'Accidentes Personales', 1, 'accidentes', 'Personal', 'ninguno', 0, NULL, 0, NULL, NULL, 'fijo', 5.00, 'Cobertura individual por accidentes sin vínculo a vehículo', 15000.00, 180.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, 5),
(9, NULL, NULL, 'Póliza de Asistencia Funeraria', 1, 'funeraria', 'Vida', 'ninguno', 0, NULL, 0, NULL, NULL, 'fijo', 3.00, 'Asistencia exequial y gastos de sepelio para el titular y su grupo familiar', 3000.00, 120.00, 'USD', 0, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(10, NULL, 'PPP', 'producto prueba', 1, 'otro', 'bienes', 'ninguno', 0, NULL, 0, NULL, NULL, 'fijo', 12222222.00, 'asdasdsasd', 12312311233.00, 211123.00, 'EUR', 0, NULL, 0, NULL, NULL, NULL, '[{\"nombre\":\"C\\u00e9dula de Identidad\",\"obligatorio\":true},{\"nombre\":\"RIF\",\"obligatorio\":true}]', '2026-06-20 01:07:57', 5, 5),
(11, NULL, 'PM', 'Poliza Muebles', 1, 'hogar', 'bienes', 'inmueble', 0, NULL, 0, NULL, NULL, 'por_valor', 7000.00, 'prueba', 20000.00, 10000.00, 'EUR', 0, NULL, 0, NULL, NULL, NULL, '[{\"nombre\":\"C\\u00e9dula de Identidad\",\"obligatorio\":true},{\"nombre\":\"RIF\",\"obligatorio\":true},{\"nombre\":\"Declaraci\\u00f3n Jurada\",\"obligatorio\":true},{\"nombre\":\"Inventario de Bienes\",\"obligatorio\":true},{\"nombre\":\"Factura del Bien\",\"obligatorio\":true}]', NULL, 5, 39),
(13, NULL, NULL, 'TEST Vida Familiar', 0, 'vida', 'personas', 'vida', 0, NULL, 0, NULL, NULL, 'por_plan', 15.00, 'Producto de prueba IVA/mensualidad', 0.00, 0.00, 'USD', 1, 16.00, 1, 5.00, NULL, NULL, '[]', '2026-06-21 09:36:37', 4, 4),
(14, NULL, NULL, 'TEST Puppeteer Por Plan 4', 1, 'vida', 'personas', 'vida', 0, NULL, 0, NULL, NULL, 'por_plan', 0.00, 'Producto creado por prueba automatizada Puppeteer', 20000.00, 80.00, 'USD', 1, 16.00, 1, NULL, NULL, NULL, '[]', '2026-06-21 09:36:37', 4, 4);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_externos_destinatarios`
--

CREATE TABLE `reportes_externos_destinatarios` (
  `id` bigint UNSIGNED NOT NULL,
  `programacion_id` bigint UNSIGNED NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'diario',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultimo_envio` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_externos_destinatarios`
--

INSERT INTO `reportes_externos_destinatarios` (`id`, `programacion_id`, `email`, `frecuencia`, `activo`, `ultimo_envio`, `created_at`, `updated_at`) VALUES
(4, 4, 'instrumentosyvoz@gmail.com', 'diario', 1, '2026-06-21 02:00:22', '2026-06-20 00:53:12', '2026-06-21 02:00:22');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_externos_historial`
--

CREATE TABLE `reportes_externos_historial` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre_reporte` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_generacion` datetime NOT NULL,
  `archivo_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_externos_historial`
--

INSERT INTO `reportes_externos_historial` (`id`, `nombre_reporte`, `fecha_generacion`, `archivo_path`, `size`, `created_at`, `updated_at`) VALUES
(1, 'Reporte Externo Mayo 2026', '2026-05-01 08:00:00', 'reportes_externos/reporte_ext_20260501_0800.xlsx', 24576, '2026-05-01 08:00:00', '2026-05-01 08:00:00'),
(2, 'Reporte Externo Mayo 2026', '2026-05-08 08:00:00', 'reportes_externos/reporte_ext_20260508_0800.xlsx', 25600, '2026-05-08 08:00:00', '2026-05-08 08:00:00'),
(3, 'Reporte Externo Mayo 2026', '2026-05-15 08:00:00', 'reportes_externos/reporte_ext_20260515_0800.xlsx', 26112, '2026-05-15 08:00:00', '2026-05-15 08:00:00'),
(4, 'Reporte Externo Junio 2026', '2026-06-01 08:00:00', 'reportes_externos/reporte_ext_20260601_0800.xlsx', 27648, '2026-06-01 08:00:00', '2026-06-01 08:00:00'),
(5, 'Reporte Externo Junio 2026', '2026-06-08 08:00:00', 'reportes_externos/reporte_ext_20260608_0800.xlsx', 28160, '2026-06-08 08:00:00', '2026-06-08 08:00:00'),
(6, 'Reporte Externo Junio 2026', '2026-06-15 08:00:00', 'reportes_externos/reporte_ext_20260615_0800.xlsx', 29184, '2026-06-15 08:00:00', '2026-06-15 08:00:00'),
(7, 'Reporte Diario — 17/06/2026 20:06', '2026-06-17 20:06:42', 'reportes_externos/reporte_externo_20260617_200642.xlsx', 8221, '2026-06-17 20:06:42', '2026-06-17 20:06:42'),
(8, 'Reporte Mensual — 17/06/2026 21:15', '2026-06-17 21:15:15', 'reportes_externos/reporte_externo_20260617_211514.xlsx', 8222, '2026-06-17 21:15:15', '2026-06-17 21:15:15'),
(9, 'Reporte Mensual — 17/06/2026 21:15', '2026-06-17 21:15:22', 'reportes_externos/reporte_externo_20260617_211522.xlsx', 8222, '2026-06-17 21:15:22', '2026-06-17 21:15:22'),
(10, 'Reporte Mensual — 17/06/2026 21:15', '2026-06-17 21:15:28', 'reportes_externos/reporte_externo_20260617_211528.xlsx', 8222, '2026-06-17 21:15:28', '2026-06-17 21:15:28'),
(13, 'Nuevo Reporte — 20/06/2026 00:53', '2026-06-20 00:53:20', 'reportes_externos/reporte_externo_20260620_005320.xlsx', 8421, '2026-06-20 00:53:20', '2026-06-20 00:53:20'),
(14, 'Nuevo Reporte — 19/06/2026 22:15', '2026-06-19 22:15:06', 'reportes_externos/reporte_externo_20260619_221506.xlsx', 8671, '2026-06-19 22:15:06', '2026-06-19 22:15:06'),
(15, 'Nuevo Reporte — 20/06/2026 02:00', '2026-06-20 02:00:30', 'reportes_externos/reporte_externo_20260620_020030.xlsx', 8670, '2026-06-20 02:00:30', '2026-06-20 02:00:30'),
(16, 'Nuevo Reporte — 20/06/2026 22:55', '2026-06-20 22:55:45', 'reportes_externos/reporte_externo_20260620_225545.xlsx', 12578, '2026-06-20 22:55:45', '2026-06-20 22:55:45'),
(17, 'Nuevo Reporte — 21/06/2026 02:00', '2026-06-21 02:00:20', 'reportes_externos/reporte_externo_20260621_020020.xlsx', 12577, '2026-06-21 02:00:20', '2026-06-21 02:00:20');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_externos_programaciones`
--

CREATE TABLE `reportes_externos_programaciones` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '08:00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `documentos_adicionales` json DEFAULT NULL,
  `cliente_documento_ids` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_externos_programaciones`
--

INSERT INTO `reportes_externos_programaciones` (`id`, `nombre`, `hora`, `activo`, `documentos_adicionales`, `cliente_documento_ids`, `created_at`, `updated_at`) VALUES
(4, 'Nuevo Reporte', '02:00', 1, NULL, NULL, '2026-06-20 00:53:12', '2026-06-20 00:53:12');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_internos_destinatarios`
--

CREATE TABLE `reportes_internos_destinatarios` (
  `id` bigint UNSIGNED NOT NULL,
  `programacion_id` bigint UNSIGNED NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'diario',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultimo_envio` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_internos_historial`
--

CREATE TABLE `reportes_internos_historial` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre_reporte` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_generacion` datetime NOT NULL,
  `archivo_path` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_internos_historial`
--

INSERT INTO `reportes_internos_historial` (`id`, `nombre_reporte`, `fecha_generacion`, `archivo_path`, `size`, `created_at`, `updated_at`) VALUES
(1, 'Reporte de Ventas Diarias', '2026-06-10 08:00:00', 'reportes_internos/ventas_20260610_0800.xlsx', 18432, '2026-06-10 08:00:00', '2026-06-10 08:00:00'),
(2, 'Reporte de Ventas Diarias', '2026-06-11 08:00:00', 'reportes_internos/ventas_20260611_0800.xlsx', 19456, '2026-06-11 08:00:00', '2026-06-11 08:00:00'),
(3, 'Reporte de Pólizas Activas', '2026-06-09 09:00:00', 'reportes_internos/polizas_20260609_0900.xlsx', 22528, '2026-06-09 09:00:00', '2026-06-09 09:00:00'),
(4, 'Reporte SUDEASEG Mensual', '2026-06-01 00:00:00', 'reportes_internos/sudeaseg_20260601_0000.xlsx', 35840, '2026-06-01 00:00:00', '2026-06-01 00:00:00'),
(5, 'Informe Quincenal Comisiones', '2026-06-15 10:00:00', 'reportes_internos/comisiones_20260615_1000.xlsx', 28672, '2026-06-15 10:00:00', '2026-06-15 10:00:00'),
(6, 'Reporte de Ventas Diarias', '2026-06-12 08:00:00', 'reportes_internos/ventas_20260612_0800.xlsx', 20480, '2026-06-12 08:00:00', '2026-06-12 08:00:00'),
(7, 'Reporte de Usuarios Activos', '2026-06-09 07:00:00', 'reportes_internos/usuarios_20260609_0700.xlsx', 15360, '2026-06-09 07:00:00', '2026-06-09 07:00:00'),
(8, 'Reporte de Ventas Diarias', '2026-06-13 08:00:00', 'reportes_internos/ventas_20260613_0800.xlsx', 21504, '2026-06-13 08:00:00', '2026-06-13 08:00:00'),
(9, 'Reporte de Ventas Diarias — 20/06/2026 00:59', '2026-06-20 00:59:02', 'reportes_internos/reporte_interno_20260620_005902.xlsx', 8304, '2026-06-20 00:59:02', '2026-06-20 00:59:02'),
(10, 'Reporte de Ventas Diarias — 20/06/2026 00:59', '2026-06-20 00:59:28', 'reportes_internos/reporte_interno_20260620_005928.xlsx', 8305, '2026-06-20 00:59:28', '2026-06-20 00:59:28'),
(11, 'Reporte de Ventas Diarias — 19/06/2026 22:15', '2026-06-19 22:15:09', 'reportes_internos/reporte_interno_20260619_221509.xlsx', 8392, '2026-06-19 22:15:09', '2026-06-19 22:15:09'),
(12, 'Reporte de Ventas Diarias — 20/06/2026 08:00', '2026-06-20 08:00:11', 'reportes_internos/reporte_interno_20260620_080011.xlsx', 8391, '2026-06-20 08:00:11', '2026-06-20 08:00:11'),
(13, 'Reporte de Ventas Diarias — 20/06/2026 11:32', '2026-06-20 11:32:01', 'reportes_internos/reporte_interno_20260620_113201.xlsx', 8462, '2026-06-20 11:32:01', '2026-06-20 11:32:01');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `reportes_internos_programaciones`
--

CREATE TABLE `reportes_internos_programaciones` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `hora` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '08:00',
  `tipo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ventas',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `documentos_adicionales` json DEFAULT NULL,
  `cliente_documento_ids` json DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('001K3B8VG2xQN2LZkGPb9O25YwQZVkR854c72R7K', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJPWXh3WDlOU1JmbU1KcjhWZkc2NEt3blJjZ0tJdHdHMmgzeko5YVpMIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779543162),
('1bJOyySsK4cGInC2l4542rRGRby1DWB92G5LH5EG', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJwYmVlSTBLU1NTMHVJdWdUTVE3eGZnNHpDOEpyS2dsTGhOOTc2QzJPIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779586232),
('2XCsygfQlxx7rW6yLhvBjzGDkLIlqT0SPWdCL18k', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJucmo2cDQ5RFdyR2pDTk0yTEEzOERGNlJlOVRsT0V3RFhVTFZMZUc2IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779542822),
('7zXiw9rvTnSpJZrxzXomi59jhOww6pCxrhUargvz', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJsU2ZkT1h0Q24wTkFDMmJDdlFZZFNYVzRLNjllODhlZmxPR2tLbWFCIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779543086),
('AfHbpM6zec5CMrydNcNn33uTc6FrgQxxU4jybBv7', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJHTTh0RVVXcE1sUXRVOE9SaVR6ZDBSWUNyZjNpT3ByU1VKS2VPTXA5IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779545049),
('dXTJQ9y39BaBclQ7veyrhdFaRYWgHAvWhjrE9CD8', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiIxWWE3Ynhwd3RZVHRnWnAwSllPVDA0YUZDbFgzUTZxTzM5WHhJODg4IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779723508),
('EprJO12aI6YvI2ZNhN2Y5blmbU8NAi1qAAsNmG1y', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJ3WUZXVlBYQUF2c0Y2RjhNOERsSHZrMzRvQkpHQm1uU3JHSDRSbGVTIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779542475),
('FfliTHbYTF3SS5gj8djZeEP5wPW0fWUqNT9h9Z14', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiIxWTlvRnJEMTRVdFZJdFVKdlRYYVhFdWh1aVNXYzRNcUJHNnlZVUh1IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779547519),
('Fr1FuALnVzzczQWCb58G4lSCWuRSp5EcHRr7FKTj', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJtQmVaeEVMaTN6azN1VWJWc2NCRU5ja1lwSmg4MGtXb3ZmeUpEM3ZIIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779627861),
('hM1HFHZxUMjO6j9jkrf1eCeSQfP70xdElPOYY6Sk', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJhNnE1MEZyWW5Ka1d5SHpVbUNyRHQxalpoYzNRUVN4Rmt4bWVzTDY1IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779553159),
('I5qb5f0lH4m8fi14DQpF1vgtKHWFQohkQYhEIKyA', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJJMDM3UEhiWm1RMGlMemh5V0JYZXIzdDNOYmFUd2NPbGZmVlJ1RE1mIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779758773),
('JzWLGvMDlhYsGLtBvZP9Xrk5Zbt13tBRqpA6RHJM', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJXeWdlNk9YN3gzTDhpU1hIcVhpUVREM0pVWER3Y2ZPMW9uU2d2aXYxIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779541928),
('KJaq7UdjFIYkWvkOL0seLrPOtNijZHrTNGv5QUh9', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJGWVpaaDRkTnU2WGJzSk5sSUI4V1F5b3VUOXhrYWJ3aU5Qc21UcVFIIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779578172),
('KuhoGiBF20W6J9OLyrIJ4nePV4lGiryKlGTAAOei', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJsQ3NTcTB6cEc3MmdqT1M5cEtZYk4xWmRtMDdKem8zckRTOUo5Z2FDIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779547908),
('mgEWatZpCvZZostAyky0LPQjFlmUmFGlVVV1ZRRj', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJ6eGNTU2pYMmZtOUE2QlNxazd1NDd2eU8yWUVDRmdjaHp5Z0hCZ0l5IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779541736),
('NonGdkMexn9uS4NzYZjpwlje0XkrTvgGtCXJws3I', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJkQ2RlTHNwVlI5dDFnVDdyaGV3RmhadjU0YldFeHNlUGRGZjNWekRLIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779543753),
('nV2egAca3VdBvOpSRPq3Wbni7PJ8hRkPaE52clka', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJ5dXNkVUh2ZVFtdmFseDVUNmw1dnk5OVFZY0NKR2NVWGpUUXhjYkdEIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779666673),
('OieUQ0KQswSXKBRpNOBw0UxBBW6xwvkwh0ODltUb', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiIzS3lKUkJwb3piRnVaeGlod0E5NkRaazhTeFdaVVRIaDlsNkM2MlJtIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779545027),
('RIP12RqxRI5crQshmYr0ynbjPzfyT06EjTM0dHu7', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJuaUdYdGIxanNtV0VJelF1VWlnakY5UXozdHhwcnNhZE5QeU8yN2xSIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779740009),
('RVblpt1rKyVzizqtcAfSCRzdVsSOgyoNmRJgdTP5', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJOWVpoMVpMbjhYTEN0eHpJeUp3cGV6VzhwN0VCT1lFYlEycEpsTlR2IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779542515),
('sps3hdVxHgCuK7QDbzkuyS6xPHrPNDJDl4AufOCh', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJIY05aUGhleGZLR3hzZk9HSTJIeGM4Z1UyRkFrVDdMWWdhdm1raFQ0IiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779545159),
('wFqdPWxMvgCI3jeTZVO6AuZO2judOOCbwJkTtMRp', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJIclpKS2FQWFczZFVFaHFIcEM3MU44c2Rod2h2blVzNG9VbFpKR0FyIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779543952),
('XoMOZyupDnGNxaj044bPBhFzUnr5RtssQSpGFmkt', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiIwNmgzTzVnNm5qNDcyb3V1ZEJDNGNSMXVlMU5LbEpzOVhDMGg0V1ZqIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779543066),
('ZaWKdPmG51d60Ht0v4ow3O6L2ufgsFxCdEBOvGHM', NULL, '127.0.0.1', 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJ2S09rUnVVQVNUZVo2SGFuVmZiQVNhaGVEb0paRlF1M21hM1o2WkMwIiwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119fQ==', 1779794403);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud`
--

CREATE TABLE `solicitud` (
  `id` bigint UNSIGNED NOT NULL,
  `persona_id` bigint UNSIGNED DEFAULT NULL,
  `bien_asegurado_id` bigint UNSIGNED DEFAULT NULL,
  `fuente` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'interno' COMMENT 'portal | interno',
  `producto_id` bigint UNSIGNED DEFAULT NULL,
  `tarifario_id` bigint UNSIGNED DEFAULT NULL,
  `total` decimal(18,2) NOT NULL DEFAULT '0.00',
  `total_bs` decimal(18,2) NOT NULL DEFAULT '0.00',
  `suma_cobertura_bs` decimal(18,2) NOT NULL DEFAULT '0.00',
  `suma_prima_bs` decimal(18,2) NOT NULL DEFAULT '0.00',
  `fecha_solicitud` date NOT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'En Revisión',
  `vendedor_id` bigint UNSIGNED DEFAULT NULL,
  `coberturas` longtext COLLATE utf8mb4_unicode_ci,
  `nombre_tomador` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ci_tomador` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asegurado_nombre` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `asegurado_ci` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_by` bigint UNSIGNED DEFAULT NULL,
  `updated_by` bigint UNSIGNED DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `solicitud`
--

INSERT INTO `solicitud` (`id`, `persona_id`, `bien_asegurado_id`, `fuente`, `producto_id`, `tarifario_id`, `total`, `total_bs`, `suma_cobertura_bs`, `suma_prima_bs`, `fecha_solicitud`, `status`, `vendedor_id`, `coberturas`, `nombre_tomador`, `ci_tomador`, `asegurado_nombre`, `asegurado_ci`, `deleted_at`, `created_by`, `updated_by`) VALUES
(1, 1, 1, 'interno', 1, 10, 487.00, 256524.37, 7902900.00, 256524.37, '2026-06-01', 'emitida', 6, NULL, 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', NULL, NULL, NULL),
(2, 2, 2, 'interno', 1, 10, 350.00, 184402.05, 7902900.00, 184402.05, '2026-06-04', 'emitida', 9, NULL, 'PEDRO JOSE SALAZAR', 'V-12345678', 'PEDRO JOSE SALAZAR', 'V-12345678', NULL, NULL, NULL),
(3, 3, 3, 'interno', 2, 11, 1240.00, 653307.84, 13171500.00, 653307.84, '2026-06-09', 'emitida', 7, NULL, 'ANA MARIA SUAREZ', 'V-87654321', 'ANA MARIA SUAREZ', 'V-87654321', NULL, NULL, NULL),
(5, 1, NULL, 'interno', 2, 11, 290.00, 152789.52, 0.00, 0.00, '2026-06-19', 'emitida', 5, '{\"tasaBCV\":526.8604,\"subtotal\":250,\"iva\":40,\"derecho_poliza\":0,\"total\":290,\"total_bs\":152789.516,\"tipo_calculo\":\"fijo\",\"documentos_requeridos\":[],\"valor_mercado\":15000,\"valor_declarado\":0,\"tarifa\":{\"id\":11,\"nombre\":\"Tarifa APOV Oro\",\"datos\":{\"categoria\":\"Accidentes Personales\",\"suma_persona\":10000,\"prima_persona\":250,\"prima_anual\":250}}}', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', NULL, NULL, NULL, 5, 5),
(6, NULL, NULL, 'interno', NULL, NULL, 100.00, 5000.00, 0.00, 0.00, '2026-06-19', 'en_revision', NULL, '[]', 'Cliente De V1', NULL, NULL, NULL, '2026-06-19 18:48:46', NULL, NULL),
(7, NULL, NULL, 'interno', NULL, NULL, 200.00, 10000.00, 0.00, 0.00, '2026-06-19', 'en_revision', NULL, '[]', 'Cliente De V2', NULL, NULL, NULL, '2026-06-19 18:48:46', NULL, NULL),
(8, 5, NULL, 'interno', 8, 8, 213.80, 112642.75, 0.00, 0.00, '2026-06-20', 'emitida', 5, '{\"tasaBCV\":526.8604,\"subtotal\":180,\"iva\":28.8,\"derecho_poliza\":5,\"total\":213.8,\"total_bs\":112642.75352000001,\"tipo_calculo\":\"fijo\",\"documentos_requeridos\":[],\"valor_mercado\":15000,\"valor_declarado\":0,\"tarifa\":{\"id\":8,\"nombre\":\"Tarifa Est\\u00e1ndar\",\"datos\":{\"categoria\":\"Est\\u00e1ndar\",\"suma_persona\":15000,\"prima_persona\":180,\"prima_anual\":180}}}', 'Juan perez', '2098564332', NULL, NULL, NULL, 5, 5),
(9, 1, NULL, 'interno', 7, NULL, 0.00, 0.00, 0.00, 0.00, '2026-06-20', 'aprobado', 5, '{\"tasaBCV\":526.8604,\"subtotal\":0,\"iva\":0,\"derecho_poliza\":5,\"total\":0,\"total_bs\":0,\"tipo_calculo\":\"por_valor\",\"documentos_requeridos\":[],\"valor_mercado\":15000,\"valor_declarado\":50000,\"tarifa\":null}', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', NULL, NULL, '2026-06-19 22:23:28', 5, 5),
(10, 1, NULL, 'interno', 8, 8, 213.80, 112642.75, 0.00, 0.00, '2026-06-20', 'aprobado', 5, '{\"tasaBCV\":526.8604,\"subtotal\":180,\"iva\":28.8,\"derecho_poliza\":5,\"total\":213.8,\"total_bs\":112642.75352000001,\"tipo_calculo\":\"fijo\",\"documentos_requeridos\":[],\"valor_mercado\":15000,\"valor_declarado\":null,\"tarifa\":{\"id\":8,\"nombre\":\"Tarifa Est\\u00e1ndar\",\"datos\":{\"categoria\":\"Est\\u00e1ndar\",\"suma_persona\":15000,\"prima_persona\":180,\"prima_anual\":180}}}', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', NULL, NULL, '2026-06-20 08:21:48', 5, 5),
(11, 1, NULL, 'interno', 11, 18, 7626.40, 4018048.15, 0.00, 0.00, '2026-06-20', 'emitida', 5, '{\"tasaBCV\":526.8604,\"subtotal\":540,\"iva\":86.4,\"derecho_poliza\":7000,\"total\":7626.4,\"total_bs\":4018048.15456,\"tipo_calculo\":\"por_valor\",\"documentos_requeridos\":[{\"nombre\":\"C\\u00e9dula de Identidad\",\"obligatorio\":true},{\"nombre\":\"RIF\",\"obligatorio\":true},{\"nombre\":\"Declaraci\\u00f3n Jurada\",\"obligatorio\":true},{\"nombre\":\"Inventario de Bienes\",\"obligatorio\":true},{\"nombre\":\"Factura del Bien\",\"obligatorio\":true}],\"valor_mercado\":15000,\"valor_declarado\":2000,\"tarifa\":{\"id\":18,\"nombre\":\"Muebles\",\"datos\":{\"tasa_pct\":27,\"prima_minima\":200,\"cobertura_max\":2000}}}', 'ODILA ELVIRA GONZALEZ DE CAMACHO', 'V-4961881', NULL, NULL, NULL, 5, 5),
(13, 8, 8, 'interno', 1, 10, 120.00, 73491.98, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":120,\"iva\":0,\"derecho_poliza\":0,\"total\":120,\"total_bs\":73491.98,\"tipo_calculo\":\"fijo\",\"valor_mercado\":15000}', 'PRUEBA QA 01 C4CA4', 'V-90000001', NULL, NULL, NULL, 4, 4),
(14, 9, 9, 'interno', 1, 10, 120.00, 73491.98, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":120,\"iva\":0,\"derecho_poliza\":0,\"total\":120,\"total_bs\":73491.98,\"tipo_calculo\":\"fijo\",\"valor_mercado\":15000}', 'PRUEBA QA 02 C81E7', 'V-90000002', NULL, NULL, NULL, 4, 4),
(15, 10, 10, 'interno', 1, 10, 120.00, 73491.98, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":120,\"iva\":0,\"derecho_poliza\":0,\"total\":120,\"total_bs\":73491.98,\"tipo_calculo\":\"fijo\",\"valor_mercado\":15000}', 'PRUEBA QA 03 ECCBC', 'V-90000003', NULL, NULL, NULL, 4, 4),
(16, 11, 11, 'interno', 2, 11, 250.00, 153108.30, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":250,\"iva\":0,\"derecho_poliza\":0,\"total\":250,\"total_bs\":153108.3,\"tipo_calculo\":\"fijo\",\"valor_mercado\":15000}', 'PRUEBA QA 04 A87FF', 'V-90000004', NULL, NULL, NULL, 4, 4),
(17, 12, 12, 'interno', 2, 11, 250.00, 153108.30, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":250,\"iva\":0,\"derecho_poliza\":0,\"total\":250,\"total_bs\":153108.3,\"tipo_calculo\":\"fijo\",\"valor_mercado\":15000}', 'PRUEBA QA 05 E4DA3', 'V-90000005', NULL, NULL, NULL, 4, 4),
(18, 13, 13, 'interno', 2, 11, 250.00, 153108.30, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":250,\"iva\":0,\"derecho_poliza\":0,\"total\":250,\"total_bs\":153108.3,\"tipo_calculo\":\"fijo\",\"valor_mercado\":15000}', 'PRUEBA QA 06 16790', 'V-90000006', NULL, NULL, NULL, 4, 4),
(19, 14, NULL, 'interno', 3, 12, 400.00, 244973.28, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":400,\"iva\":0,\"derecho_poliza\":0,\"total\":400,\"total_bs\":244973.28,\"tipo_calculo\":\"fijo\",\"valor_mercado\":null}', 'PRUEBA QA 07 8F14E', 'V-90000007', NULL, NULL, NULL, 4, 4),
(20, 15, NULL, 'interno', 3, 12, 400.00, 244973.28, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":400,\"iva\":0,\"derecho_poliza\":0,\"total\":400,\"total_bs\":244973.28,\"tipo_calculo\":\"fijo\",\"valor_mercado\":null}', 'PRUEBA QA 08 C9F0F', 'V-90000008', NULL, NULL, NULL, 4, 4),
(21, 16, NULL, 'interno', 5, 1, 180.00, 110237.98, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":180,\"iva\":0,\"derecho_poliza\":0,\"total\":180,\"total_bs\":110237.98,\"tipo_calculo\":\"por_plan\",\"valor_mercado\":null}', 'PRUEBA QA 09 45C48', 'V-90000009', NULL, NULL, NULL, 4, 4),
(22, 17, NULL, 'interno', 5, 2, 250.00, 153108.30, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":250,\"iva\":0,\"derecho_poliza\":0,\"total\":250,\"total_bs\":153108.3,\"tipo_calculo\":\"por_plan\",\"valor_mercado\":null}', 'PRUEBA QA 10 D3D94', 'V-90000010', NULL, NULL, NULL, 4, 4),
(23, 18, NULL, 'interno', 5, 3, 320.00, 195978.62, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":320,\"iva\":0,\"derecho_poliza\":0,\"total\":320,\"total_bs\":195978.62,\"tipo_calculo\":\"por_plan\",\"valor_mercado\":null}', 'PRUEBA QA 11 6512B', 'V-90000011', NULL, NULL, NULL, 4, 4),
(24, 19, NULL, 'interno', 6, 4, 200.00, 122486.64, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":200,\"iva\":0,\"derecho_poliza\":0,\"total\":200,\"total_bs\":122486.64,\"tipo_calculo\":\"por_nivel\",\"valor_mercado\":null}', 'PRUEBA QA 12 C20AD', 'V-90000012', NULL, NULL, NULL, 4, 4),
(25, 20, NULL, 'interno', 6, 5, 280.00, 171481.30, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":280,\"iva\":0,\"derecho_poliza\":0,\"total\":280,\"total_bs\":171481.3,\"tipo_calculo\":\"por_nivel\",\"valor_mercado\":null}', 'PRUEBA QA 13 C51CE', 'V-90000013', NULL, NULL, NULL, 4, 4),
(26, 21, NULL, 'interno', 6, 6, 360.00, 220475.95, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":360,\"iva\":0,\"derecho_poliza\":0,\"total\":360,\"total_bs\":220475.95,\"tipo_calculo\":\"por_nivel\",\"valor_mercado\":null}', 'PRUEBA QA 14 AAB32', 'V-90000014', NULL, NULL, NULL, 4, 4),
(27, 22, NULL, 'interno', 8, 8, 185.00, 113300.14, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":185,\"iva\":0,\"derecho_poliza\":0,\"total\":185,\"total_bs\":113300.14,\"tipo_calculo\":\"fijo\",\"valor_mercado\":null}', 'PRUEBA QA 15 9BF31', 'V-90000015', NULL, NULL, NULL, 4, 4),
(28, 23, NULL, 'interno', 8, 8, 185.00, 113300.14, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":185,\"iva\":0,\"derecho_poliza\":0,\"total\":185,\"total_bs\":113300.14,\"tipo_calculo\":\"fijo\",\"valor_mercado\":null}', 'PRUEBA QA 16 C74D9', 'V-90000016', NULL, NULL, NULL, 4, 4),
(29, 24, NULL, 'interno', 9, 9, 123.00, 75329.28, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":123,\"iva\":0,\"derecho_poliza\":0,\"total\":123,\"total_bs\":75329.28,\"tipo_calculo\":\"fijo\",\"valor_mercado\":null}', 'PRUEBA QA 17 70EFD', 'V-90000017', NULL, NULL, NULL, 4, 4),
(30, 25, NULL, 'interno', 9, 9, 123.00, 75329.28, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":123,\"iva\":0,\"derecho_poliza\":0,\"total\":123,\"total_bs\":75329.28,\"tipo_calculo\":\"fijo\",\"valor_mercado\":null}', 'PRUEBA QA 18 6F492', 'V-90000018', NULL, NULL, NULL, 4, 4),
(31, 26, 14, 'interno', 11, 18, 300.00, 183729.96, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":300,\"iva\":0,\"derecho_poliza\":0,\"total\":300,\"total_bs\":183729.96,\"tipo_calculo\":\"por_valor\",\"valor_mercado\":15000}', 'PRUEBA QA 19 1F0E3', 'V-90000019', NULL, NULL, NULL, 4, 4),
(32, 27, 15, 'interno', 11, 18, 300.00, 183729.96, 0.00, 0.00, '2026-06-20', 'emitida', 4, '{\"tasaBCV\":612.4332,\"subtotal\":300,\"iva\":0,\"derecho_poliza\":0,\"total\":300,\"total_bs\":183729.96,\"tipo_calculo\":\"por_valor\",\"valor_mercado\":15000}', 'PRUEBA QA 20 98F13', 'V-90000020', NULL, NULL, NULL, 4, 4),
(34, 8, NULL, 'interno', 8, 8, 213.80, 130938.22, 0.00, 0.00, '2026-06-21', 'en_revision', 5, '{\"tasaBCV\":612.4332,\"subtotal\":180,\"iva\":28.8,\"derecho_poliza\":5,\"total\":213.8,\"total_bs\":130938.21816000002,\"tipo_calculo\":\"fijo\",\"documentos_requeridos\":[],\"valor_mercado\":15000,\"valor_declarado\":null,\"tarifa\":{\"id\":8,\"nombre\":\"Tarifa Est\\u00e1ndar\",\"datos\":{\"categoria\":\"Est\\u00e1ndar\",\"suma_persona\":15000,\"prima_persona\":180,\"prima_anual\":180}}}', 'PRUEBA QA 01 C4CA4', 'V-90000001', NULL, NULL, NULL, 5, 5);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes_contacto`
--

CREATE TABLE `solicitudes_contacto` (
  `id` bigint UNSIGNED NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `motivo` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `destino` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitudes_renovacion_qr`
--

CREATE TABLE `solicitudes_renovacion_qr` (
  `id` bigint UNSIGNED NOT NULL,
  `poliza_id` bigint UNSIGNED NOT NULL,
  `nro_contrato` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pagos` json NOT NULL,
  `total_usd_estimado` decimal(18,2) DEFAULT NULL,
  `status` enum('PENDIENTE','AUTORIZADA','RECHAZADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDIENTE',
  `nota_agente` text COLLATE utf8mb4_unicode_ci,
  `procesado_por` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tarifario`
--

CREATE TABLE `tarifario` (
  `id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtipo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `datos` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `version` smallint UNSIGNED NOT NULL DEFAULT '1',
  `vigencia_desde` date DEFAULT NULL,
  `vigencia_hasta` date DEFAULT NULL,
  `parent_id` bigint UNSIGNED DEFAULT NULL,
  `estado` enum('borrador','vigente','archivado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vigente',
  `creado_por` bigint UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `tarifario`
--

INSERT INTO `tarifario` (`id`, `producto_id`, `nombre`, `subtipo`, `datos`, `activo`, `version`, `vigencia_desde`, `vigencia_hasta`, `parent_id`, `estado`, `creado_por`, `created_at`, `updated_at`) VALUES
(1, 5, 'Plan Básico', 'basico', '{\"muerte_accidental\":{\"suma\":20000,\"prima\":80},\"invalidez_total\":{\"suma\":20000,\"prima\":60},\"gastos_sepelio\":{\"suma\":2000,\"prima\":20}}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(2, 5, 'Plan Estándar', 'estandar', '{\"muerte_accidental\":{\"suma\":50000,\"prima\":150},\"invalidez_total\":{\"suma\":50000,\"prima\":120},\"gastos_sepelio\":{\"suma\":3000,\"prima\":30},\"renta_hospitalaria\":{\"suma\":500,\"prima\":40}}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(3, 5, 'Plan Premium', 'premium', '{\"muerte_accidental\":{\"suma\":100000,\"prima\":250},\"invalidez_total\":{\"suma\":100000,\"prima\":200},\"enfermedades_graves\":{\"suma\":50000,\"prima\":100},\"gastos_sepelio\":{\"suma\":5000,\"prima\":50},\"renta_hospitalaria\":{\"suma\":1000,\"prima\":70}}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(4, 6, 'Nivel I', 'nivel1', '{\"nivel\":\"Nivel I\",\"suma\":30000,\"prima\":800}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(5, 6, 'Nivel II', 'nivel2', '{\"nivel\":\"Nivel II\",\"suma\":60000,\"prima\":1300}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(6, 6, 'Nivel III', 'nivel3', '{\"nivel\":\"Nivel III\",\"suma\":100000,\"prima\":2000}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(7, 7, 'Tarifa General', NULL, '{\"tasa_pct\":0.8}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(8, 8, 'Tarifa Estándar', NULL, '{\"categoria\":\"Estándar\",\"suma_persona\":15000,\"prima_persona\":180,\"prima_anual\":180}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(9, 9, 'Tarifa Individual', NULL, '{\"categoria\":\"Individual\",\"suma_persona\":3000,\"prima_persona\":120,\"prima_anual\":120}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(10, 1, 'Tarifa RCV Básico', NULL, '{\"categoria\":\"Responsabilidad Civil\",\"suma_cosa\":5000,\"prima_cosa\":120,\"prima_anual\":120}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, '2026-06-21 11:13:51'),
(11, 2, 'Tarifa APOV Oro', NULL, '{\"categoria\":\"Accidentes Personales\",\"suma_persona\":10000,\"prima_persona\":250,\"prima_anual\":250}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(12, 3, 'Tarifa EC/EP Premium', NULL, '{\"categoria\":\"Cobertura Extendida\",\"suma_cosa\":20000,\"prima_cosa\":400,\"prima_anual\":400}', 1, 1, '2026-05-25', NULL, NULL, 'vigente', NULL, NULL, NULL),
(18, 11, 'Muebles', 'mb', '{\"tasa_pct\":27,\"prima_minima\":200,\"cobertura_max\":2000}', 1, 1, NULL, NULL, NULL, 'vigente', NULL, '2026-06-20 08:22:47', '2026-06-20 08:22:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `underwriting_evaluaciones`
--

CREATE TABLE `underwriting_evaluaciones` (
  `id` bigint UNSIGNED NOT NULL,
  `solicitud_id` bigint UNSIGNED NOT NULL,
  `evaluador_id` bigint UNSIGNED DEFAULT NULL,
  `tipo` enum('manual','automatica') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'manual',
  `resultado` enum('pendiente','aprobado','rechazado','observado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pendiente',
  `score` decimal(5,2) DEFAULT NULL,
  `observaciones` text COLLATE utf8mb4_unicode_ci,
  `motivo_rechazo` text COLLATE utf8mb4_unicode_ci,
  `requiere_inspeccion` tinyint(1) NOT NULL DEFAULT '0',
  `reglas_aplicadas` json DEFAULT NULL,
  `fecha_evaluacion` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `underwriting_evaluaciones`
--

INSERT INTO `underwriting_evaluaciones` (`id`, `solicitud_id`, `evaluador_id`, `tipo`, `resultado`, `score`, `observaciones`, `motivo_rechazo`, `requiere_inspeccion`, `reglas_aplicadas`, `fecha_evaluacion`, `created_at`, `updated_at`) VALUES
(11, 5, 5, 'manual', 'aprobado', NULL, NULL, NULL, 0, NULL, '2026-06-19 14:00:50', '2026-06-19 14:00:50', '2026-06-19 14:00:50'),
(12, 8, 5, 'manual', 'aprobado', 70.00, 'Prueba Cliente y Reportes', NULL, 1, NULL, '2026-06-20 02:07:18', '2026-06-20 02:07:18', '2026-06-20 02:07:18'),
(13, 9, 5, 'manual', 'aprobado', NULL, NULL, NULL, 0, NULL, '2026-06-19 22:22:43', '2026-06-19 22:22:43', '2026-06-19 22:22:43'),
(14, 10, 5, 'manual', 'aprobado', NULL, NULL, NULL, 0, NULL, '2026-06-20 07:56:13', '2026-06-20 07:56:13', '2026-06-20 07:56:13'),
(15, 11, 5, 'manual', 'aprobado', 10.00, NULL, NULL, 1, NULL, '2026-06-20 08:24:11', '2026-06-20 08:24:11', '2026-06-20 08:24:11'),
(16, 13, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(17, 14, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(18, 15, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(19, 16, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(20, 17, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:07', '2026-06-20 18:55:07', '2026-06-20 18:55:07'),
(21, 18, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(22, 19, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(23, 20, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(24, 21, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:55:08', '2026-06-20 18:55:08', '2026-06-20 18:55:08'),
(25, 22, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:56:59', '2026-06-20 18:56:59', '2026-06-20 18:56:59'),
(26, 23, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:06', '2026-06-20 18:57:06', '2026-06-20 18:57:06'),
(27, 24, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:14', '2026-06-20 18:57:14', '2026-06-20 18:57:14'),
(28, 25, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:21', '2026-06-20 18:57:21', '2026-06-20 18:57:21'),
(29, 26, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:29', '2026-06-20 18:57:29', '2026-06-20 18:57:29'),
(30, 27, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:36', '2026-06-20 18:57:36', '2026-06-20 18:57:36'),
(31, 28, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:43', '2026-06-20 18:57:43', '2026-06-20 18:57:43'),
(32, 29, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:51', '2026-06-20 18:57:51', '2026-06-20 18:57:51'),
(33, 30, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:57:58', '2026-06-20 18:57:58', '2026-06-20 18:57:58'),
(34, 31, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:58:07', '2026-06-20 18:58:07', '2026-06-20 18:58:07'),
(35, 32, 4, 'manual', 'aprobado', 90.00, 'Evaluacion QA automatizada - datos de prueba', NULL, 0, NULL, '2026-06-20 18:58:16', '2026-06-20 18:58:16', '2026-06-20 18:58:16');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `genero` enum('M','F') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'M',
  `cargo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nick` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `api_token` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_expira_en` timestamp NULL DEFAULT NULL,
  `ultimo_visto` timestamp NULL DEFAULT NULL,
  `token_created_at` timestamp NULL DEFAULT NULL,
  `sede` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nro_sede` int UNSIGNED NOT NULL,
  `tipo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `permisos` longtext COLLATE utf8mb4_unicode_ci,
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `motivo_bloqueo` text COLLATE utf8mb4_unicode_ci,
  `temp` tinyint(1) NOT NULL DEFAULT '0',
  `temp_expira_en` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id`, `nombre`, `email`, `genero`, `cargo`, `nick`, `password`, `api_token`, `token_expira_en`, `ultimo_visto`, `token_created_at`, `sede`, `nro_sede`, `tipo`, `permisos`, `activo`, `motivo_bloqueo`, `temp`, `temp_expira_en`, `fecha_creacion`, `created_at`, `updated_at`) VALUES
(4, 'Juan Garcia', NULL, 'M', 'Oficina', 'admin2', '$2y$12$d2oDZiZ/vdTEOykaa.seDeehrApBYji8kiyZRAM7Rm71kW7bEo7Xa', NULL, NULL, '2026-06-21 11:49:01', NULL, 'Caracas Principal', 1, 'Oficina', NULL, 1, NULL, 0, NULL, '2026-05-12 16:25:05', NULL, NULL),
(5, 'Henry Uribe', NULL, 'M', 'Admin', 'dev_admin', '$2y$10$ZQHdbw92qIQN/wHvvqTpVe4n5a9x6LukpAP6Y/PyxOLaV4p.IOX6S', '6e4d3379cb838395191ccf2be11b9916cd02e4548e76a43f01247eb061a708d7', '2026-06-21 20:12:07', '2026-06-21 12:12:07', '2026-06-21 09:04:46', 'Caracas Principal', 1, 'Admin', NULL, 1, NULL, 0, NULL, '2026-05-18 18:09:01', NULL, NULL),
(6, 'Alfonzo Gutierre', NULL, 'M', 'Vendedor Calle', 'vendedor1', '$2y$12$2F/X9TAn0fcR7b/N5bba..5vnnjuqszcI/6ZzGpOp7ZlyyqCtyGwe', NULL, NULL, '2026-06-20 18:41:25', NULL, 'Caracas Principal', 1, 'Vendedor Calle', NULL, 1, NULL, 0, NULL, '2026-05-21 22:08:44', NULL, NULL),
(7, 'Josefa Ramirez', NULL, 'F', 'Oficina', 'super1', '$2y$12$vAOHhjckwgBf8IkyGuNOH.3SgZq.gKxLk2X9VAXkIcRdYwil0a0PG', NULL, NULL, NULL, NULL, 'Caracas Principal', 1, 'Oficina', NULL, 1, NULL, 0, NULL, '2026-05-21 22:08:44', NULL, NULL),
(9, 'Ruth Rodriguez', NULL, 'F', 'Vendedor Calle', '123213', '$2y$12$/s/nwnTFgdbt5px/LZb7uO6ELH3v2et34zunGYqTt7.RF2DGpRXAe', NULL, NULL, '2026-06-20 18:18:54', NULL, 'Maracaibo', 1, 'Vendedor Calle', NULL, 1, NULL, 0, NULL, '2026-05-21 23:07:54', NULL, NULL),
(10, 'Marta Gonzales', NULL, 'F', 'Vendedor Calle', 'dede', '$2y$12$IdM2FMWXoV8DGah/UdTeGee/N4N6g6XyUd.vdWyaIXBMCMSjXvwgS', NULL, NULL, '2026-06-20 22:47:33', NULL, 'Valencia', 1, 'Vendedor Calle', '{\"home\":[\"view\"],\"clientes\":[\"view\",\"create\",\"view_polizas\"],\"vehiculos\":[\"view\",\"view_poliza\",\"view_docs\"],\"cotizaciones\":[\"view\",\"create\"],\"productos\":[\"view\",\"view_cards\",\"view_list\"],\"tasas\":[\"view\",\"view_cards\",\"view_list\"],\"config\":[\"view\",\"change_password\"]}', 1, NULL, 0, NULL, '2026-05-21 23:37:48', NULL, NULL);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta`
--

CREATE TABLE `venta` (
  `id` bigint UNSIGNED NOT NULL,
  `usuario_id` bigint UNSIGNED NOT NULL,
  `producto_id` bigint UNSIGNED NOT NULL,
  `fecha_venta` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `venta`
--

INSERT INTO `venta` (`id`, `usuario_id`, `producto_id`, `fecha_venta`) VALUES
(1, 4, 1, '2026-06-20'),
(2, 4, 1, '2026-06-20'),
(3, 4, 1, '2026-06-20'),
(4, 4, 2, '2026-06-20'),
(5, 4, 2, '2026-06-20'),
(6, 4, 2, '2026-06-20'),
(7, 4, 3, '2026-06-20'),
(8, 4, 3, '2026-06-20'),
(9, 4, 5, '2026-06-20'),
(10, 4, 5, '2026-06-20'),
(11, 4, 5, '2026-06-20'),
(12, 4, 6, '2026-06-20'),
(13, 4, 6, '2026-06-20'),
(14, 4, 6, '2026-06-20'),
(15, 4, 8, '2026-06-20'),
(16, 4, 8, '2026-06-20'),
(17, 4, 9, '2026-06-20'),
(18, 4, 9, '2026-06-20'),
(19, 4, 11, '2026-06-20'),
(20, 4, 11, '2026-06-20');

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
-- Indices de la tabla `beneficiarios`
--
ALTER TABLE `beneficiarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_beneficiarios_poliza` (`poliza_id`);

--
-- Indices de la tabla `beneficios`
--
ALTER TABLE `beneficios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_beneficio_producto_desc` (`producto_id`,`descripcion`);

--
-- Indices de la tabla `bien_asegurado`
--
ALTER TABLE `bien_asegurado`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `idx_bien_placa` (`placa_idx`),
  ADD UNIQUE KEY `idx_bien_serial` (`serial_carroceria_idx`),
  ADD KEY `idx_bien_tipo` (`tipo`),
  ADD KEY `idx_bien_persona` (`persona_id`),
  ADD KEY `fk_bien_created_by` (`created_by`);

--
-- Indices de la tabla `bien_persona_rol`
--
ALTER TABLE `bien_persona_rol`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_bpr_bien_rol` (`bien_asegurado_id`,`rol`),
  ADD KEY `idx_bpr_persona` (`persona_id`);

--
-- Indices de la tabla `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indices de la tabla `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indices de la tabla `cliente_documentos`
--
ALTER TABLE `cliente_documentos`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_cli_docs_persona` (`persona_id`);

--
-- Indices de la tabla `email_log`
--
ALTER TABLE `email_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email_log_tipo_index` (`tipo`),
  ADD KEY `email_log_persona_id_index` (`persona_id`),
  ADD KEY `email_log_sent_at_index` (`sent_at`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_factura` (`numero`,`sede`,`fecha_factura`),
  ADD UNIQUE KEY `uq_factura_numero` (`numero`),
  ADD KEY `fk_factura_usuario` (`usuario_id`),
  ADD KEY `idx_factura_poliza` (`poliza_id`),
  ADD KEY `idx_factura_fecha` (`fecha_factura`);

--
-- Indices de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`);

--
-- Indices de la tabla `indicador_economico`
--
ALTER TABLE `indicador_economico`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_indicador_tipo_moneda_fecha` (`tipo`,`moneda`,`fecha`),
  ADD KEY `idx_indicador_tipo_fecha` (`tipo`,`fecha`);

--
-- Indices de la tabla `ip_bloqueada`
--
ALTER TABLE `ip_bloqueada`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `ip_bloqueada_ip_unique` (`ip`),
  ADD KEY `ip_bloqueada_usuario_id_index` (`usuario_id`);

--
-- Indices de la tabla `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indices de la tabla `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `logs`
--
ALTER TABLE `logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `logs_usuario_id_index` (`usuario_id`),
  ADD KEY `logs_accion_index` (`accion`);

--
-- Indices de la tabla `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indices de la tabla `persona`
--
ALTER TABLE `persona`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_persona_cedula` (`cedula`),
  ADD KEY `idx_persona_nombre` (`nombre`),
  ADD KEY `idx_persona_correo` (`correo`),
  ADD KEY `idx_persona_activo` (`activo`),
  ADD KEY `persona_vendedor_id_foreign` (`vendedor_id`);

--
-- Indices de la tabla `poliza`
--
ALTER TABLE `poliza`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_poliza_nro` (`nro_contrato`),
  ADD KEY `idx_poliza_fecha_emision` (`fecha_emision`),
  ADD KEY `idx_poliza_vencimiento` (`fecha_vencimiento`),
  ADD KEY `idx_poliza_status` (`status`),
  ADD KEY `idx_poliza_tarifario_ver` (`tarifario_version_id`),
  ADD KEY `idx_poliza_solicitud` (`solicitud_id`),
  ADD KEY `idx_poliza_producto` (`producto_id`),
  ADD KEY `idx_poliza_vendedor` (`vendedor_id`);

--
-- Indices de la tabla `poliza_bienes`
--
ALTER TABLE `poliza_bienes`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_polizabien_poliza_bien` (`poliza_id`,`bien_asegurado_id`),
  ADD KEY `idx_polizabien_bien` (`bien_asegurado_id`),
  ADD KEY `fk_polizabien_created_by` (`created_by`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_producto_nombre` (`nombre`),
  ADD KEY `producto_parent_id_foreign` (`parent_id`);

--
-- Indices de la tabla `reportes_externos_destinatarios`
--
ALTER TABLE `reportes_externos_destinatarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reportes_externos_destinatarios_programacion_id_foreign` (`programacion_id`);

--
-- Indices de la tabla `reportes_externos_historial`
--
ALTER TABLE `reportes_externos_historial`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `reportes_externos_programaciones`
--
ALTER TABLE `reportes_externos_programaciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `reportes_internos_destinatarios`
--
ALTER TABLE `reportes_internos_destinatarios`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reportes_internos_destinatarios_programacion_id_foreign` (`programacion_id`);

--
-- Indices de la tabla `reportes_internos_historial`
--
ALTER TABLE `reportes_internos_historial`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `reportes_internos_programaciones`
--
ALTER TABLE `reportes_internos_programaciones`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indices de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_solicitud_fecha` (`fecha_solicitud`),
  ADD KEY `idx_solicitud_vendedor` (`vendedor_id`),
  ADD KEY `idx_solicitud_status` (`status`),
  ADD KEY `fk_solicitud_tarifario` (`tarifario_id`),
  ADD KEY `idx_solicitud_bien` (`bien_asegurado_id`),
  ADD KEY `idx_solicitud_persona` (`persona_id`),
  ADD KEY `idx_solicitud_producto` (`producto_id`);

--
-- Indices de la tabla `solicitudes_contacto`
--
ALTER TABLE `solicitudes_contacto`
  ADD PRIMARY KEY (`id`);

--
-- Indices de la tabla `solicitudes_renovacion_qr`
--
ALTER TABLE `solicitudes_renovacion_qr`
  ADD PRIMARY KEY (`id`),
  ADD KEY `solicitudes_renovacion_qr_procesado_por_foreign` (`procesado_por`),
  ADD KEY `solicitudes_renovacion_qr_status_created_at_index` (`status`,`created_at`),
  ADD KEY `solicitudes_renovacion_qr_poliza_id_index` (`poliza_id`);

--
-- Indices de la tabla `tarifario`
--
ALTER TABLE `tarifario`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tarifario_producto` (`producto_id`),
  ADD KEY `idx_tar_producto_estado` (`producto_id`,`estado`),
  ADD KEY `idx_tar_vigencia` (`vigencia_desde`),
  ADD KEY `fk_tar_parent` (`parent_id`),
  ADD KEY `fk_tar_creado_por` (`creado_por`);

--
-- Indices de la tabla `underwriting_evaluaciones`
--
ALTER TABLE `underwriting_evaluaciones`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_uw_solicitud` (`solicitud_id`),
  ADD KEY `idx_uw_evaluador` (`evaluador_id`),
  ADD KEY `idx_uw_resultado` (`resultado`),
  ADD KEY `idx_uw_fecha` (`created_at`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuarios_nick_unique` (`nick`),
  ADD UNIQUE KEY `usuarios_api_token_unique` (`api_token`),
  ADD UNIQUE KEY `uq_usuarios_email` (`email`);

--
-- Indices de la tabla `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_venta_usuario` (`usuario_id`),
  ADD KEY `idx_venta_fecha` (`fecha_venta`),
  ADD KEY `fk_venta_producto` (`producto_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `audit_log`
--
ALTER TABLE `audit_log`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=211;

--
-- AUTO_INCREMENT de la tabla `beneficiarios`
--
ALTER TABLE `beneficiarios`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `beneficios`
--
ALTER TABLE `beneficios`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT de la tabla `bien_asegurado`
--
ALTER TABLE `bien_asegurado`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `bien_persona_rol`
--
ALTER TABLE `bien_persona_rol`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cliente_documentos`
--
ALTER TABLE `cliente_documentos`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `email_log`
--
ALTER TABLE `email_log`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=157;

--
-- AUTO_INCREMENT de la tabla `factura`
--
ALTER TABLE `factura`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `indicador_economico`
--
ALTER TABLE `indicador_economico`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT de la tabla `ip_bloqueada`
--
ALTER TABLE `ip_bloqueada`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=159;

--
-- AUTO_INCREMENT de la tabla `logs`
--
ALTER TABLE `logs`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=435;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT de la tabla `poliza`
--
ALTER TABLE `poliza`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `poliza_bienes`
--
ALTER TABLE `poliza_bienes`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `reportes_externos_destinatarios`
--
ALTER TABLE `reportes_externos_destinatarios`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `reportes_externos_historial`
--
ALTER TABLE `reportes_externos_historial`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT de la tabla `reportes_externos_programaciones`
--
ALTER TABLE `reportes_externos_programaciones`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT de la tabla `reportes_internos_destinatarios`
--
ALTER TABLE `reportes_internos_destinatarios`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `reportes_internos_historial`
--
ALTER TABLE `reportes_internos_historial`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `reportes_internos_programaciones`
--
ALTER TABLE `reportes_internos_programaciones`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `solicitudes_contacto`
--
ALTER TABLE `solicitudes_contacto`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `solicitudes_renovacion_qr`
--
ALTER TABLE `solicitudes_renovacion_qr`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tarifario`
--
ALTER TABLE `tarifario`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `underwriting_evaluaciones`
--
ALTER TABLE `underwriting_evaluaciones`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=37;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `audit_log`
--
ALTER TABLE `audit_log`
  ADD CONSTRAINT `fk_audit_log_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `beneficiarios`
--
ALTER TABLE `beneficiarios`
  ADD CONSTRAINT `fk_beneficiarios_poliza` FOREIGN KEY (`poliza_id`) REFERENCES `poliza` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `beneficios`
--
ALTER TABLE `beneficios`
  ADD CONSTRAINT `fk_beneficios_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `bien_asegurado`
--
ALTER TABLE `bien_asegurado`
  ADD CONSTRAINT `fk_bien_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bien_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `bien_persona_rol`
--
ALTER TABLE `bien_persona_rol`
  ADD CONSTRAINT `fk_bpr_bien` FOREIGN KEY (`bien_asegurado_id`) REFERENCES `bien_asegurado` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bpr_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `cliente_documentos`
--
ALTER TABLE `cliente_documentos`
  ADD CONSTRAINT `fk_cli_docs_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `factura`
--
ALTER TABLE `factura`
  ADD CONSTRAINT `fk_factura_poliza` FOREIGN KEY (`poliza_id`) REFERENCES `poliza` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_factura_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `ip_bloqueada`
--
ALTER TABLE `ip_bloqueada`
  ADD CONSTRAINT `fk_ip_bloqueada_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `logs`
--
ALTER TABLE `logs`
  ADD CONSTRAINT `fk_logs_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `persona`
--
ALTER TABLE `persona`
  ADD CONSTRAINT `persona_vendedor_id_foreign` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `poliza`
--
ALTER TABLE `poliza`
  ADD CONSTRAINT `fk_poliza_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poliza_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poliza_tarifario_ver` FOREIGN KEY (`tarifario_version_id`) REFERENCES `tarifario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poliza_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `poliza_bienes`
--
ALTER TABLE `poliza_bienes`
  ADD CONSTRAINT `fk_polizabien_bien` FOREIGN KEY (`bien_asegurado_id`) REFERENCES `bien_asegurado` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_polizabien_created_by` FOREIGN KEY (`created_by`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_polizabien_poliza` FOREIGN KEY (`poliza_id`) REFERENCES `poliza` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `producto_parent_id_foreign` FOREIGN KEY (`parent_id`) REFERENCES `producto` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes_externos_destinatarios`
--
ALTER TABLE `reportes_externos_destinatarios`
  ADD CONSTRAINT `reportes_externos_destinatarios_programacion_id_foreign` FOREIGN KEY (`programacion_id`) REFERENCES `reportes_externos_programaciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `reportes_internos_destinatarios`
--
ALTER TABLE `reportes_internos_destinatarios`
  ADD CONSTRAINT `reportes_internos_destinatarios_programacion_id_foreign` FOREIGN KEY (`programacion_id`) REFERENCES `reportes_internos_programaciones` (`id`) ON DELETE CASCADE;

--
-- Filtros para la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD CONSTRAINT `fk_solicitud_bien` FOREIGN KEY (`bien_asegurado_id`) REFERENCES `bien_asegurado` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_solicitud_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_solicitud_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_solicitud_tarifario` FOREIGN KEY (`tarifario_id`) REFERENCES `tarifario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_solicitud_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `solicitudes_renovacion_qr`
--
ALTER TABLE `solicitudes_renovacion_qr`
  ADD CONSTRAINT `solicitudes_renovacion_qr_poliza_id_foreign` FOREIGN KEY (`poliza_id`) REFERENCES `poliza` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `solicitudes_renovacion_qr_procesado_por_foreign` FOREIGN KEY (`procesado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL;

--
-- Filtros para la tabla `tarifario`
--
ALTER TABLE `tarifario`
  ADD CONSTRAINT `fk_tar_creado_por` FOREIGN KEY (`creado_por`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tar_parent` FOREIGN KEY (`parent_id`) REFERENCES `tarifario` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tarifario_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `underwriting_evaluaciones`
--
ALTER TABLE `underwriting_evaluaciones`
  ADD CONSTRAINT `fk_uw_evaluador` FOREIGN KEY (`evaluador_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_uw_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
