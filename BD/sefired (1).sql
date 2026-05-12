-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 12-05-2026 a las 19:37:33
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

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
-- Estructura de tabla para la tabla `apov`
--

CREATE TABLE `apov` (
  `id` int(10) UNSIGNED NOT NULL,
  `tipo_carro` varchar(30) NOT NULL,
  `tasa` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `suma_asegurada` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `apov_cobertura`
--

CREATE TABLE `apov_cobertura` (
  `id` int(10) UNSIGNED NOT NULL,
  `apov_id` int(10) UNSIGNED NOT NULL,
  `tipo_cobertura` enum('muerte_accidental','invalidez','medicos','funerarios') NOT NULL,
  `tasa` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `suma_bronze` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_plata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_oro` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `beneficios`
--

CREATE TABLE `beneficios` (
  `id` int(10) UNSIGNED NOT NULL,
  `producto_id` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `monto` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre_producto` varchar(30) NOT NULL,
  `categoria` varchar(50) NOT NULL,
  `dependencia` varchar(50) NOT NULL,
  `tasa` decimal(10,4) NOT NULL DEFAULT 0.0000
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente`
--

CREATE TABLE `cliente` (
  `id` int(10) UNSIGNED NOT NULL,
  `persona_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conductor`
--

CREATE TABLE `conductor` (
  `id` int(10) UNSIGNED NOT NULL,
  `persona_id` int(10) UNSIGNED NOT NULL,
  `vehiculo_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ec_ep`
--

CREATE TABLE `ec_ep` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre_producto` varchar(60) NOT NULL,
  `tipo_carro` varchar(50) NOT NULL,
  `tasa` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `suma_cobertura` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_cobertura` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_plata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_plata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_oro` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_oro` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `factura`
--

CREATE TABLE `factura` (
  `id` int(10) UNSIGNED NOT NULL,
  `numero` varchar(30) NOT NULL,
  `sede` varchar(20) NOT NULL,
  `fecha_factura` date NOT NULL,
  `poliza_id` int(10) UNSIGNED NOT NULL,
  `valor` decimal(18,2) NOT NULL DEFAULT 0.00,
  `valor_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `forma_pago` varchar(35) NOT NULL,
  `referencia` varchar(50) DEFAULT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` text NOT NULL,
  `queue` text NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `indicador_economico`
--

CREATE TABLE `indicador_economico` (
  `id` int(10) UNSIGNED NOT NULL,
  `tipo` enum('tasa_cambio','unidad_tributaria') NOT NULL,
  `valor` decimal(18,4) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `logs`
--

CREATE TABLE `logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED DEFAULT NULL,
  `accion` varchar(255) NOT NULL,
  `tabla` varchar(255) DEFAULT NULL,
  `descripcion` text NOT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
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
(28, '2026_05_11_150000_create_logs_table', 1);

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelo_vehiculo`
--

CREATE TABLE `modelo_vehiculo` (
  `id` int(10) UNSIGNED NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `opc_vehiculos_uso`
--

CREATE TABLE `opc_vehiculos_uso` (
  `id` int(10) UNSIGNED NOT NULL,
  `id_empresa` int(10) UNSIGNED DEFAULT NULL,
  `fecha_registro` timestamp NOT NULL DEFAULT current_timestamp(),
  `uso` varchar(100) NOT NULL,
  `activo` enum('SI','NO') NOT NULL DEFAULT 'SI',
  `eliminado` enum('SI','NO') NOT NULL DEFAULT 'NO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `otros`
--

CREATE TABLE `otros` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre_producto` varchar(30) NOT NULL,
  `tipo_carro` varchar(50) NOT NULL,
  `tasa` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_cobertura` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `suma_cobertura` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_diamante` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_diamante` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `persona`
--

CREATE TABLE `persona` (
  `id` int(10) UNSIGNED NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `celular` varchar(20) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `direccion` text DEFAULT NULL,
  `codigo_postal` varchar(10) DEFAULT NULL,
  `nacionalidad` varchar(30) DEFAULT NULL,
  `estado` varchar(70) DEFAULT NULL,
  `ciudad` varchar(60) DEFAULT NULL,
  `nacimiento` date DEFAULT NULL,
  `sexo` varchar(15) DEFAULT NULL,
  `condicion` varchar(40) DEFAULT NULL,
  `profesion` varchar(50) DEFAULT NULL,
  `actividad` varchar(50) DEFAULT NULL,
  `archivo` varchar(200) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poliza`
--

CREATE TABLE `poliza` (
  `id` int(10) UNSIGNED NOT NULL,
  `nro_contrato` varchar(30) NOT NULL,
  `solicitud_id` int(10) UNSIGNED NOT NULL,
  `producto_id` int(10) UNSIGNED NOT NULL,
  `total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cobertura_dolares` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cobertura_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `pago` varchar(30) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `papeleria` varchar(80) DEFAULT NULL,
  `vendedor_id` int(10) UNSIGNED DEFAULT NULL,
  `sede_poliza` varchar(10) DEFAULT NULL,
  `status` varchar(15) NOT NULL DEFAULT 'ACTIVA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poliza_apov`
--

CREATE TABLE `poliza_apov` (
  `id` int(10) UNSIGNED NOT NULL,
  `vehiculo_id` int(10) UNSIGNED NOT NULL,
  `suma_muerte_accidental` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_invalidez` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_medicos` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_funerarios` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poliza_rcv`
--

CREATE TABLE `poliza_rcv` (
  `id` int(10) UNSIGNED NOT NULL,
  `vehiculo_id` int(10) UNSIGNED NOT NULL,
  `suma_persona` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_persona` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_cosa` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_cosa` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(150) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `cobertura` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima` decimal(18,2) NOT NULL DEFAULT 0.00,
  `moneda` varchar(10) NOT NULL DEFAULT 'USD'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `rcv`
--

CREATE TABLE `rcv` (
  `id` int(10) UNSIGNED NOT NULL,
  `producto` varchar(30) NOT NULL,
  `categoria` varchar(70) NOT NULL,
  `dependencia` varchar(50) NOT NULL,
  `tasa_cosa` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_personas` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_prima` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `suma_persona` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_cosa` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_prima` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima_anual` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` bigint(20) UNSIGNED DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud`
--

CREATE TABLE `solicitud` (
  `id` int(10) UNSIGNED NOT NULL,
  `cliente_id` int(10) UNSIGNED NOT NULL,
  `placa` varchar(20) NOT NULL,
  `producto_id` int(10) UNSIGNED NOT NULL,
  `total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_cobertura_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_prima_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `fecha_solicitud` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_apov`
--

CREATE TABLE `solicitud_apov` (
  `id` int(10) UNSIGNED NOT NULL,
  `vehiculo_id` int(10) UNSIGNED NOT NULL,
  `plan_muerte_accidental` varchar(20) NOT NULL,
  `plan_invalidez` varchar(20) NOT NULL,
  `plan_medicos` varchar(20) NOT NULL,
  `plan_funerarios` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_carros`
--

CREATE TABLE `tipos_carros` (
  `id` int(10) UNSIGNED NOT NULL,
  `tipo_carro` varchar(50) NOT NULL,
  `grupo` varchar(50) NOT NULL,
  `contexto` enum('general','ecep') NOT NULL DEFAULT 'general'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tomador`
--

CREATE TABLE `tomador` (
  `id` int(10) UNSIGNED NOT NULL,
  `persona_id` int(10) UNSIGNED NOT NULL,
  `vehiculo_id` int(10) UNSIGNED NOT NULL,
  `copia` varchar(40) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `cargo` varchar(255) NOT NULL,
  `nick` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `sede` varchar(255) NOT NULL,
  `nro_sede` int(11) NOT NULL,
  `tipo` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `temp` tinyint(1) NOT NULL DEFAULT 0,
  `temp_expira_en` datetime DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculo`
--

CREATE TABLE `vehiculo` (
  `id` int(10) UNSIGNED NOT NULL,
  `cliente_id` int(10) UNSIGNED NOT NULL,
  `placa` varchar(10) NOT NULL,
  `fecha_adquisicion` date DEFAULT NULL,
  `certificado_transito` varchar(20) DEFAULT NULL,
  `certificado_origen` varchar(20) DEFAULT NULL,
  `marca` varchar(100) DEFAULT NULL,
  `modelo` varchar(100) DEFAULT NULL,
  `clase` varchar(80) DEFAULT NULL,
  `tipo` varchar(80) DEFAULT NULL,
  `anio` smallint(5) UNSIGNED DEFAULT NULL,
  `uso` varchar(40) DEFAULT NULL,
  `color` varchar(30) DEFAULT NULL,
  `peso` int(10) UNSIGNED DEFAULT NULL,
  `puestos` tinyint(3) UNSIGNED DEFAULT NULL,
  `aparcamiento` varchar(30) DEFAULT NULL,
  `serial_carroceria` varchar(40) DEFAULT NULL,
  `serial_motor` varchar(40) DEFAULT NULL,
  `titulo` varchar(180) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `venta`
--

CREATE TABLE `venta` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `usuario_id` int(10) UNSIGNED NOT NULL,
  `producto_id` int(10) UNSIGNED NOT NULL,
  `fecha_venta` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `apov`
--
ALTER TABLE `apov`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_apov_tipo_carro` (`tipo_carro`);

--
-- Indices de la tabla `apov_cobertura`
--
ALTER TABLE `apov_cobertura`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_apov_cobertura` (`apov_id`,`tipo_cobertura`);

--
-- Indices de la tabla `beneficios`
--
ALTER TABLE `beneficios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_beneficio_producto_desc` (`producto_id`,`descripcion`);

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
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_categorias` (`nombre_producto`,`categoria`,`dependencia`),
  ADD KEY `idx_categorias_producto` (`nombre_producto`);

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_cliente_persona` (`persona_id`);

--
-- Indices de la tabla `conductor`
--
ALTER TABLE `conductor`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conductor_persona` (`persona_id`),
  ADD KEY `idx_conductor_vehiculo` (`vehiculo_id`);

--
-- Indices de la tabla `ec_ep`
--
ALTER TABLE `ec_ep`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_ec_ep` (`nombre_producto`,`tipo_carro`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_factura` (`numero`,`sede`,`fecha_factura`),
  ADD KEY `idx_factura_fecha` (`fecha_factura`),
  ADD KEY `fk_factura_poliza` (`poliza_id`),
  ADD KEY `fk_factura_usuario` (`usuario_id`);

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
  ADD KEY `idx_indicador_tipo_fecha` (`tipo`,`fecha_registro`);

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
-- Indices de la tabla `modelo_vehiculo`
--
ALTER TABLE `modelo_vehiculo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_marca_modelo` (`marca`,`modelo`),
  ADD KEY `idx_marca` (`marca`);

--
-- Indices de la tabla `opc_vehiculos_uso`
--
ALTER TABLE `opc_vehiculos_uso`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_uso` (`uso`),
  ADD KEY `idx_uso_activo` (`activo`,`eliminado`);

--
-- Indices de la tabla `otros`
--
ALTER TABLE `otros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_otros` (`nombre_producto`,`tipo_carro`);

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
  ADD KEY `idx_persona_correo` (`correo`);

--
-- Indices de la tabla `poliza`
--
ALTER TABLE `poliza`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_poliza` (`nro_contrato`,`solicitud_id`,`producto_id`,`fecha_emision`),
  ADD KEY `idx_poliza_fecha_emision` (`fecha_emision`),
  ADD KEY `idx_poliza_vencimiento` (`fecha_vencimiento`),
  ADD KEY `idx_poliza_status` (`status`),
  ADD KEY `fk_poliza_solicitud` (`solicitud_id`),
  ADD KEY `fk_poliza_producto` (`producto_id`),
  ADD KEY `fk_poliza_vendedor` (`vendedor_id`);

--
-- Indices de la tabla `poliza_apov`
--
ALTER TABLE `poliza_apov`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pol_apov_vehiculo` (`vehiculo_id`);

--
-- Indices de la tabla `poliza_rcv`
--
ALTER TABLE `poliza_rcv`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_pol_rcv_vehiculo` (`vehiculo_id`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_producto_nombre` (`nombre`);

--
-- Indices de la tabla `rcv`
--
ALTER TABLE `rcv`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rcv` (`producto`,`categoria`,`dependencia`),
  ADD KEY `idx_rcv_producto` (`producto`);

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
  ADD UNIQUE KEY `uq_solicitud` (`cliente_id`,`placa`,`producto_id`,`fecha_solicitud`),
  ADD KEY `idx_solicitud_cliente` (`cliente_id`),
  ADD KEY `idx_solicitud_placa` (`placa`),
  ADD KEY `idx_solicitud_fecha` (`fecha_solicitud`),
  ADD KEY `fk_solicitud_producto` (`producto_id`);

--
-- Indices de la tabla `solicitud_apov`
--
ALTER TABLE `solicitud_apov`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sol_apov_vehiculo` (`vehiculo_id`);

--
-- Indices de la tabla `tipos_carros`
--
ALTER TABLE `tipos_carros`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_tipo_grupo_ctx` (`tipo_carro`,`grupo`,`contexto`),
  ADD KEY `idx_tipo_carro` (`tipo_carro`);

--
-- Indices de la tabla `tomador`
--
ALTER TABLE `tomador`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tomador_persona` (`persona_id`),
  ADD KEY `idx_tomador_vehiculo` (`vehiculo_id`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `usuarios_nick_unique` (`nick`);

--
-- Indices de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_vehiculo_placa` (`placa`),
  ADD KEY `idx_vehiculo_cliente` (`cliente_id`);

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
-- AUTO_INCREMENT de la tabla `apov`
--
ALTER TABLE `apov`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `apov_cobertura`
--
ALTER TABLE `apov_cobertura`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `beneficios`
--
ALTER TABLE `beneficios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `conductor`
--
ALTER TABLE `conductor`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `ec_ep`
--
ALTER TABLE `ec_ep`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `factura`
--
ALTER TABLE `factura`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `indicador_economico`
--
ALTER TABLE `indicador_economico`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `logs`
--
ALTER TABLE `logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT de la tabla `modelo_vehiculo`
--
ALTER TABLE `modelo_vehiculo`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `opc_vehiculos_uso`
--
ALTER TABLE `opc_vehiculos_uso`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `otros`
--
ALTER TABLE `otros`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `persona`
--
ALTER TABLE `persona`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `poliza`
--
ALTER TABLE `poliza`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `poliza_apov`
--
ALTER TABLE `poliza_apov`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `poliza_rcv`
--
ALTER TABLE `poliza_rcv`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `rcv`
--
ALTER TABLE `rcv`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `solicitud_apov`
--
ALTER TABLE `solicitud_apov`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tipos_carros`
--
ALTER TABLE `tipos_carros`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tomador`
--
ALTER TABLE `tomador`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `apov_cobertura`
--
ALTER TABLE `apov_cobertura`
  ADD CONSTRAINT `fk_apov_cob_apov` FOREIGN KEY (`apov_id`) REFERENCES `apov` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `beneficios`
--
ALTER TABLE `beneficios`
  ADD CONSTRAINT `fk_beneficios_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD CONSTRAINT `fk_cliente_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `conductor`
--
ALTER TABLE `conductor`
  ADD CONSTRAINT `fk_conductor_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_conductor_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `factura`
--
ALTER TABLE `factura`
  ADD CONSTRAINT `fk_factura_poliza` FOREIGN KEY (`poliza_id`) REFERENCES `poliza` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_factura_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `poliza`
--
ALTER TABLE `poliza`
  ADD CONSTRAINT `fk_poliza_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poliza_solicitud` FOREIGN KEY (`solicitud_id`) REFERENCES `solicitud` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poliza_vendedor` FOREIGN KEY (`vendedor_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `poliza_apov`
--
ALTER TABLE `poliza_apov`
  ADD CONSTRAINT `fk_pol_apov_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `poliza_rcv`
--
ALTER TABLE `poliza_rcv`
  ADD CONSTRAINT `fk_pol_rcv_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD CONSTRAINT `fk_solicitud_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_solicitud_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `solicitud_apov`
--
ALTER TABLE `solicitud_apov`
  ADD CONSTRAINT `fk_sol_apov_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `tomador`
--
ALTER TABLE `tomador`
  ADD CONSTRAINT `fk_tomador_persona` FOREIGN KEY (`persona_id`) REFERENCES `persona` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_tomador_vehiculo` FOREIGN KEY (`vehiculo_id`) REFERENCES `vehiculo` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD CONSTRAINT `fk_vehiculo_cliente` FOREIGN KEY (`cliente_id`) REFERENCES `cliente` (`id`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_producto` FOREIGN KEY (`producto_id`) REFERENCES `producto` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_venta_usuario` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
