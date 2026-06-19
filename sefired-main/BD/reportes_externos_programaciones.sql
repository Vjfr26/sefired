-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Servidor: db:3306
-- Tiempo de generación: 17-06-2026 a las 16:58:34
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
-- Estructura de tabla para la tabla `reportes_externos_programaciones`
--

CREATE TABLE `reportes_externos_programaciones` (
  `id` bigint UNSIGNED NOT NULL,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frecuencia` enum('diario','semanal','mensual') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'diario',
  `hora` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '08:00',
  `activo` tinyint(1) NOT NULL DEFAULT '1',
  `ultimo_envio` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `reportes_externos_programaciones`
--

INSERT INTO `reportes_externos_programaciones` (`id`, `nombre`, `frecuencia`, `hora`, `activo`, `ultimo_envio`, `created_at`, `updated_at`) VALUES
(1, 'Reporte Externo Diario', 'diario', '08:00', 1, '2026-06-02 00:19:25', NULL, NULL),
(2, 'Reporte Externo Semanal', 'semanal', '09:00', 1, '2026-05-28 16:05:31', NULL, NULL),
(3, 'Reporte Externo Mensual', 'mensual', '00:00', 0, NULL, NULL, NULL);

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `reportes_externos_programaciones`
--
ALTER TABLE `reportes_externos_programaciones`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `reportes_externos_programaciones`
--
ALTER TABLE `reportes_externos_programaciones`
  MODIFY `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
