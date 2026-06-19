-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db:3306
-- Tiempo de generación: 17-06-2026 a las 16:58:40
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
-- Estructura de tabla para la tabla `reportes_internos_historial`
--

CREATE TABLE `reportes_internos_historial` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre_reporte` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_generacion` datetime NOT NULL,
  `archivo_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_internos_historial`
--

INSERT INTO `reportes_internos_historial` (`id`, `nombre_reporte`, `fecha_generacion`, `archivo_path`, `size`, `created_at`, `updated_at`) VALUES
(1, 'Ventas diarias', '2026-05-07 08:00:00', 'reportes_internos/reporte_ventas_diarias_20260507.xlsx', 10240, NULL, NULL),
(2, 'Pólizas por vencer', '2026-05-07 09:00:00', 'reportes_internos/reporte_polizas_vencer_20260507.xlsx', 8192, NULL, NULL),
(3, 'Ventas diarias', '2026-05-06 08:00:00', 'reportes_internos/reporte_ventas_diarias_20260506.xlsx', 10210, NULL, NULL),
(4, 'SUDEASEG Mayo', '2026-05-01 00:01:00', 'reportes_internos/reporte_sudeaseg_mayo_20260501.xlsx', 24576, NULL, NULL),
(5, 'Comisiones quincenal', '2026-05-01 00:05:00', 'reportes_internos/reporte_comisiones_quincenal_20260501.xlsx', 12288, NULL, NULL),
(6, 'Reporte diario de ventas', '2026-06-01 22:37:08', 'reportes_internos/reporte_interno_reporte_diario_de_ventas_20260601_223708.xlsx', 6501, '2026-06-01 22:37:08', '2026-06-01 22:37:08'),
(7, 'Reporte diario de ventas', '2026-06-01 23:14:00', 'reportes_internos/reporte_interno_reporte_diario_de_ventas_20260601_231400.xlsx', 6499, '2026-06-01 23:14:00', '2026-06-01 23:14:00'),
(8, 'Reporte diario de ventas', '2026-06-01 23:18:39', 'reportes_internos/reporte_interno_reporte_diario_de_ventas_20260601_231839.xlsx', 6501, '2026-06-01 23:18:39', '2026-06-01 23:18:39');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `reportes_internos_historial`
--
ALTER TABLE `reportes_internos_historial`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `reportes_internos_historial`
--
ALTER TABLE `reportes_internos_historial`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
