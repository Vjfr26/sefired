-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db:3306
-- Tiempo de generación: 17-06-2026 a las 16:58:27
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
-- Estructura de tabla para la tabla `reportes_externos_historial`
--

CREATE TABLE `reportes_externos_historial` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre_reporte` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_generacion` datetime NOT NULL,
  `archivo_path` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `size` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_externos_historial`
--

INSERT INTO `reportes_externos_historial` (`id`, `nombre_reporte`, `fecha_generacion`, `archivo_path`, `size`, `created_at`, `updated_at`) VALUES
(1, 'Generación automática (Diario)', '2026-05-27 19:45:25', 'reportes_externos/reporte_diario_20260527_194525.csv', 757, '2026-05-27 19:45:25', '2026-05-27 19:45:25'),
(2, 'Generación automática (Semanal)', '2026-05-27 19:46:11', 'reportes_externos/reporte_semanal_20260527_194611.csv', 2007, '2026-05-27 19:46:11', '2026-05-27 19:46:11'),
(3, 'Generación automática (Semanal)', '2026-05-28 15:21:31', 'reportes_externos/reporte_semanal_20260528_152131.xlsx', 8204, '2026-05-28 15:21:31', '2026-05-28 15:21:31'),
(4, 'Generación automática (Semanal)', '2026-05-28 15:42:02', 'reportes_externos/reporte_semanal_20260528_154202.xlsx', 9800, '2026-05-28 15:42:02', '2026-05-28 15:42:02'),
(5, 'Generación automática (Semanal)', '2026-05-28 16:05:31', 'reportes_externos/reporte_semanal_20260528_160531.xlsx', 9553, '2026-05-28 16:05:31', '2026-05-28 16:05:31'),
(6, 'Generación automática (Diario)', '2026-06-02 00:19:25', 'reportes_externos/reporte_diario_20260602_001925.xlsx', 8485, '2026-06-02 00:19:25', '2026-06-02 00:19:25');

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `reportes_externos_historial`
--
ALTER TABLE `reportes_externos_historial`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `reportes_externos_historial`
--
ALTER TABLE `reportes_externos_historial`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
