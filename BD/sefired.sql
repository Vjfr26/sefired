-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 11-05-2026 a las 16:07:16
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
  `tipo_carro` varchar(30) NOT NULL,
  `tasa` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_muerte_accidental` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_invalidez` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_medicos` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `tasa_funerarios` decimal(10,4) NOT NULL DEFAULT 0.0000,
  `suma_asegurada` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_accidentalbronze` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_accidentalplata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_accidentaloro` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_invalidezbronze` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_invalidezplata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_invalidezoro` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_medicosbronze` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_medicosplata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_medicosoro` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_funerariosbronze` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_funerariosplata` decimal(18,2) NOT NULL DEFAULT 0.00,
  `suma_funerariosoro` decimal(18,2) NOT NULL DEFAULT 0.00,
  `prima` decimal(18,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `beneficios`
--

CREATE TABLE `beneficios` (
  `id_producto` int(10) UNSIGNED NOT NULL,
  `descripcion` varchar(100) NOT NULL,
  `monto` decimal(18,2) NOT NULL DEFAULT 0.00
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
  `cod_cliente` int(10) UNSIGNED NOT NULL,
  `ced` varchar(20) NOT NULL,
  `nombre` varchar(120) NOT NULL,
  `tel` varchar(15) DEFAULT NULL,
  `celular` varchar(15) DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `dir` text DEFAULT NULL,
  `postal_cliente` varchar(10) DEFAULT NULL,
  `file1` varchar(200) DEFAULT NULL,
  `nacionalidad` varchar(30) DEFAULT NULL,
  `estado` varchar(30) DEFAULT NULL,
  `ciudad` varchar(30) DEFAULT NULL,
  `nacimiento` date DEFAULT NULL,
  `sexo` varchar(15) DEFAULT NULL,
  `condicion` varchar(20) DEFAULT NULL,
  `profesion` varchar(50) DEFAULT NULL,
  `actividad` varchar(50) DEFAULT NULL,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `conductor`
--

CREATE TABLE `conductor` (
  `id` int(10) UNSIGNED NOT NULL,
  `placa` varchar(10) NOT NULL,
  `cedulac` varchar(20) NOT NULL,
  `nombrec` varchar(100) NOT NULL,
  `telc` varchar(20) DEFAULT NULL,
  `celc` varchar(30) DEFAULT NULL,
  `correoc` varchar(100) DEFAULT NULL,
  `direccionc` text DEFAULT NULL,
  `filec` varchar(100) DEFAULT NULL,
  `nacionalidadc` varchar(30) DEFAULT NULL,
  `estadoc` varchar(70) DEFAULT NULL,
  `ciudadc` varchar(60) DEFAULT NULL,
  `nacimientoc` date DEFAULT NULL,
  `sexoc` varchar(10) DEFAULT NULL,
  `condicionc` varchar(40) DEFAULT NULL,
  `profesionc` varchar(50) DEFAULT NULL,
  `actividadc` varchar(50) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `ec_ep`
--

CREATE TABLE `ec_ep` (
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
  `numero` int(10) UNSIGNED NOT NULL,
  `sede` varchar(20) NOT NULL,
  `fecha_factura` date NOT NULL,
  `nro_poliza` varchar(30) NOT NULL,
  `valor` decimal(18,2) NOT NULL DEFAULT 0.00,
  `valor_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `forma_pago` varchar(35) NOT NULL,
  `referencia` varchar(50) DEFAULT NULL,
  `nick_usuario` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `modelo_vehiculo`
--

CREATE TABLE `modelo_vehiculo` (
  `id` int(10) UNSIGNED NOT NULL,
  `marca` varchar(50) NOT NULL,
  `modelo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `modelo_vehiculo`
--

INSERT INTO `modelo_vehiculo` (`id`, `marca`, `modelo`) VALUES
(1, 'Toyota', 'Corolla');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `opc_vehiculos_uso`
--

CREATE TABLE `opc_vehiculos_uso` (
  `codusovehiculo` int(10) UNSIGNED NOT NULL,
  `idempresa` int(10) UNSIGNED DEFAULT NULL,
  `fechareg` timestamp NOT NULL DEFAULT current_timestamp(),
  `uso` varchar(100) NOT NULL,
  `activo` enum('SI','NO') NOT NULL DEFAULT 'SI',
  `eliminado` enum('SI','NO') NOT NULL DEFAULT 'NO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `otros`
--

CREATE TABLE `otros` (
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
-- Estructura de tabla para la tabla `poliza`
--

CREATE TABLE `poliza` (
  `nro_poliza` int(10) UNSIGNED NOT NULL,
  `nro_contrato` varchar(30) NOT NULL,
  `id_solicitud` int(10) UNSIGNED NOT NULL,
  `id_producto` int(10) UNSIGNED NOT NULL,
  `total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cobertura_dolares` decimal(18,2) NOT NULL DEFAULT 0.00,
  `cobertura_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `pago` varchar(30) NOT NULL,
  `tipo` varchar(20) NOT NULL,
  `fecha_emision` date NOT NULL,
  `fecha_vencimiento` date NOT NULL,
  `papeleria` varchar(80) DEFAULT NULL,
  `vendedor` varchar(80) DEFAULT NULL,
  `sede_poliza` varchar(10) DEFAULT NULL,
  `status` varchar(15) NOT NULL DEFAULT 'ACTIVA'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `poliza_apov`
--

CREATE TABLE `poliza_apov` (
  `placa` varchar(15) NOT NULL,
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
  `placa` varchar(10) NOT NULL,
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
  `id_producto` int(10) UNSIGNED NOT NULL,
  `nombre_producto` varchar(150) NOT NULL,
  `descripcion_producto` text DEFAULT NULL,
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
-- Estructura de tabla para la tabla `solicitud`
--

CREATE TABLE `solicitud` (
  `nro_solicitud` int(10) UNSIGNED NOT NULL,
  `cedula` varchar(20) NOT NULL,
  `placa` varchar(20) NOT NULL,
  `id_producto` int(10) UNSIGNED NOT NULL,
  `total` decimal(18,2) NOT NULL DEFAULT 0.00,
  `total_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `scobertura_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `sprima_bs` decimal(18,2) NOT NULL DEFAULT 0.00,
  `fecha_solicitud` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `solicitud_apov`
--

CREATE TABLE `solicitud_apov` (
  `placa` varchar(20) NOT NULL,
  `plan_muerte_accidental` varchar(20) NOT NULL,
  `plan_invalidez` varchar(20) NOT NULL,
  `plan_medicos` varchar(20) NOT NULL,
  `plan_funerarios` varchar(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tasa_cambio`
--

CREATE TABLE `tasa_cambio` (
  `id` int(10) UNSIGNED NOT NULL,
  `bolivares` decimal(18,4) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_carros`
--

CREATE TABLE `tipos_carros` (
  `tipo_carro` varchar(50) NOT NULL,
  `grupo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tipos_carros_ecep`
--

CREATE TABLE `tipos_carros_ecep` (
  `tipo_carro` varchar(50) NOT NULL,
  `grupo` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `tomador`
--

CREATE TABLE `tomador` (
  `id` int(10) UNSIGNED NOT NULL,
  `cedulat` varchar(20) NOT NULL,
  `placa` varchar(15) NOT NULL,
  `nombret` varchar(100) NOT NULL,
  `correot` varchar(100) DEFAULT NULL,
  `direcciont` text DEFAULT NULL,
  `telt` varchar(20) DEFAULT NULL,
  `celt` varchar(20) DEFAULT NULL,
  `nacimientot` date DEFAULT NULL,
  `nacionalidadt` varchar(25) DEFAULT NULL,
  `estadot` varchar(30) DEFAULT NULL,
  `copiat` varchar(40) DEFAULT NULL,
  `actividadt` varchar(50) DEFAULT NULL,
  `profesiont` varchar(50) DEFAULT NULL,
  `condiciont` varchar(20) DEFAULT NULL,
  `sexot` varchar(20) DEFAULT NULL,
  `file1` varchar(100) DEFAULT NULL,
  `ciudadt` varchar(50) DEFAULT NULL,
  `postal_tomador` varchar(10) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `unidad_tributaria`
--

CREATE TABLE `unidad_tributaria` (
  `id` int(10) UNSIGNED NOT NULL,
  `bolivares` decimal(18,4) NOT NULL,
  `fecha_registro` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuario`
--

CREATE TABLE `usuario` (
  `nro_vendedor` int(10) UNSIGNED NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `cargo` varchar(100) NOT NULL,
  `nick` varchar(100) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `sede` varchar(50) NOT NULL,
  `nro_sede` varchar(15) NOT NULL,
  `tipo` varchar(15) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `fecha_creacion` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `usuario`
--

INSERT INTO `usuario` (`nro_vendedor`, `nombre`, `cargo`, `nick`, `pass`, `sede`, `nro_sede`, `tipo`, `activo`, `fecha_creacion`) VALUES
(1, 'Arturo', 'Oficina', 'artmuji007', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', '0', '0', 'Oficina', 1, '2026-04-21 12:59:20'),
(2, 'gustavo ', '', 'mujicag', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'BA', '0', '', 1, '2026-04-21 12:59:20'),
(3, 'Cristian Fuentes', '', 'cfuentes', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'BA', '0', '', 1, '2026-04-21 12:59:20'),
(5, 'prueba', '', 'prueba', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'MA', '0127', '', 1, '2026-04-21 12:59:20'),
(6, 'fsdsdfsdf', '', 'dasasdasdas', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'GU', '0127', '', 1, '2026-04-21 12:59:20'),
(7, 'usuario de prueba', '', 'sefired', '4c3cc1e198904403324ff57df745cf2c2c62780b', 'ADM', '001', 'Oficina', 1, '2026-04-21 12:59:20'),
(10, 'TEMPORAL', '', 'TEMP-CP', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'CP', '0127', '', 1, '2026-04-21 12:59:20'),
(11, 'LOS TEQUES', '', 'TEMP-LT', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'OM', '006', '', 1, '2026-04-21 12:59:20'),
(12, 'PLAZA LAS AMERICAS', '', 'TEMP-PLA', 'ae1b5a4eeb4d351761b73307bafcb865ca25a315', 'PA', '0124', '', 1, '2026-04-21 12:59:20'),
(13, 'BOLIVAR', '', 'TEMP-BO', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'CB', '009', '', 1, '2026-04-21 12:59:20'),
(14, 'PTO ORDAZ', '', 'TEMP-PO', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'PO', '008', '', 1, '2026-04-21 12:59:20'),
(15, 'BARCELONA', '', 'LUZMARY RODRIGUEZ', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'BA', '001', '', 1, '2026-04-21 12:59:20'),
(16, 'PTO LA CRUZ', '', 'TEMP-PLC', '7c4a8d09ca3762af61e59520943dc26494f8941b', 'PLC', '0016', '', 1, '2026-04-21 12:59:20'),
(17, 'ADMINISTRACION', '', 'TEMP-TRB', 'da39a3ee5e6b4b0d3255bfef95601890afd80709', 'TR', '0115', '', 1, '2026-04-21 12:59:20'),
(24, 'ADMINISTRACION', '', 'GIOVANELA MENDEZ', 'ad3a53e7ad93073427d014a39f8bbd5a146cb8ce', 'BA', '0115', 'Oficina', 1, '2026-04-21 12:59:20'),
(27, 'GUARENAS', '', 'temp-gu', '54de1070d172167d813587b9030df7bc0c06091b', 'GU', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(28, 'Pto la cruz', '', 'PLC', '024dc9086ed26d4f09ccfc4d37bfa3c8036a3374', 'PLC', '0016', 'Vendedor', 1, '2026-04-21 12:59:20'),
(29, 'BOLIVAR', '', 'bolivar', '510a91c75f591b8f0ea94cc3821795d5083ddc29', 'CB', '009', 'Vendedor', 1, '2026-04-21 12:59:20'),
(30, 'sefired-lara', '', 'sefilara', 'da39a3ee5e6b4b0d3255bfef95601890afd80709', 'CH', '0013', 'Vendedor', 1, '2026-04-21 12:59:20'),
(31, 'sefiredla', '', 'sefiredla', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'MA', '0010', 'Vendedor', 1, '2026-04-21 12:59:20'),
(33, 'VANESSA MALL', '', 'TEMP-VAN', 'b28fd7a4fe5de4df0f810051fe41a4efb7d087ea', 'CHB', '0128', 'Vendedor', 1, '2026-04-21 12:59:20'),
(34, 'CHARALLAVE', '', 'TEMP-CHA', 'f42acdd70badd1099ee1fd9943928bb51b457616', 'CH', '0013', 'Vendedor', 1, '2026-04-21 12:59:20'),
(36, 'sefired bolivar', '', 'sefiredbo', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'CB', '009', 'Vendedor', 1, '2026-04-21 12:59:20'),
(37, 'sefired guarenas', '', 'sefiredgu', 'd6c29060934a74a28d06f98f1f1452f123b00212', 'GU', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(39, 'GUARENAS', '', 'guarenas', '906f57babf74b512e73a286cbcb64520b4b1607c', 'GU', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(40, 'BOLEITAVIVA', '', 'BOLEITAVIVA', 'ab570da1009cc4c528378648962a4c5d02561f8d', 'BO', '0115', 'Vendedor', 1, '2026-04-21 12:59:20'),
(41, 'MATURIN CCP', '', 'TEMP-CCP', 'c2c660dd4c1369459c7ad864bd932f279fa87a30', 'MA', '0010', 'Vendedor', 1, '2026-04-21 12:59:20'),
(42, 'TrÃ¡nsito bna', '', 'TRANSITO BNA', 'cc8f22e8fc9922b85365bf47be755dd1633174ae', 'TR', '0115', 'Vendedor', 1, '2026-04-21 12:59:20'),
(43, 'PTO LA CRUZ', '', 'PTO LA CRUZ', 'd3ac27e68c3ef7f9b9f869def0574c04c26dbe0a', 'PLC', '0016', 'Vendedor', 1, '2026-04-21 12:59:20'),
(44, 'Henry', 'Master', 'hry', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'Barcerlona', '001', 'Oficina', 1, '2026-04-21 12:59:20'),
(45, 'TEMP-CCCT', '', 'TEMP-CCCT', '45b5a58e4c3345d982013417d6f728cd129b5df0', 'CCCT', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(46, 'ADOLFO COLINA', '', 'ADOLFO COLINA', '94de0b75436f1e3f74b5158427eaf2d6278e9fc2', 'EX', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(47, 'COFAYCA', '', 'COFAYCA', 'b869db3b58c7b5ca5fa13cbc5371fd21a9d0978a', 'EX', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(48, 'Mauricio Villarroel', 'Vendedor', 'villarroelm', 'd2212321275cdab0df40c60a2e569c3779bcacca', 'EX', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(49, '', '', '', '375c82487877039ad99c32a06955621f9313b14e', '', '', '', 1, '2026-04-21 12:59:20'),
(50, 'Anzotrans', '', 'Anzotrans', '5eddeb67f690bf91724a261c2395d6b208e00719', 'anzt', '', 'vendedor', 1, '2026-04-21 12:59:20'),
(51, 'Alcides Boscan', 'Vendedor', 'boscanalcides', '5a418e351586cc2397b3b6ea9fe724f7e179ab48', 'EX', '', '', 1, '2026-04-21 12:59:20'),
(52, 'YAMILET BOLIVAR', '', 'YAMILET BOLIVAR', '605c55c522a62db1e0ec453ef9876846c3482bdd', 'EX', '005', 'Vendedor', 1, '2026-04-21 12:59:20'),
(53, 'LUIS AZUAJE', '', 'LUIS AZUAJE', 'c1b7b6ec96b2451f82dca81533b62e4cdb3a80de', 'EX', '', 'Vendedor', 1, '2026-04-21 12:59:20'),
(54, 'JESSIKA CARRILLO', '', 'JESSIKA CARRILLO', '4a57ff72a6c848b9d825704c0e786c2d5a0d3684', 'EX', '0115', 'Vendedor', 1, '2026-04-21 12:59:20'),
(55, 'ELIZABETH PEREIRA', '', 'ELIZABETH PEREIRA', 'daf65986636e3744c6f72df734b743cffefdd877', 'EX', '002', 'Vendedor', 1, '2026-04-21 12:59:20'),
(56, 'ALFREDO MARIÑO', '', 'ALFREDO MARIÑO', 'ba74e866e712bb6671adcbb5bb1cc26470e46037', 'EX', '', 'Vendedor', 1, '2026-04-21 12:59:20'),
(57, 'NAZARETH VICUÑA', '', 'NAZARETHV', '4f61dadb8f90a0cc97f5018d73ace2e25c7ec5d9', 'EX', '0115', 'Vendedor', 1, '2026-04-21 12:59:20'),
(58, 'MARYURI URIBE', '', 'MARYURI URIBE', '78e5eb13e8e37ca5af5f56627225e1d394e7d48a', 'EX', '0115', 'Vendedor', 1, '2026-04-21 12:59:20'),
(59, 'Super Admin', 'Master', 'admin', 'd033e22ae348aeb5660fc2140aec35850c4da997', 'ADM', '000', 'Oficina', 1, '2026-04-21 15:27:24'),
(60, 'Oficina_de_prueba', 'Oficina', 'ofipru', '601f1889667efaebb33b8c12572835da3f027f78', 'BA', '0', 'Oficina', 1, '2026-04-21 16:42:46'),
(64, 'Oficina_prueba', 'Oficina', 'pruefi', '7110eda4d09e062aa5e4a390b0a572ac0d2c0220', 'Caracas', '001', 'Oficina', 1, '2026-04-22 14:00:21'),
(66, 'Oficina_prueba', 'Oficina', 'pruofi', '1234', 'Caracas', '001', 'Oficina', 1, '2026-04-22 14:00:44');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `vehiculo`
--

CREATE TABLE `vehiculo` (
  `cod_vehiculo` int(10) UNSIGNED NOT NULL,
  `cedula` varchar(20) NOT NULL,
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
  `nickusuario` varchar(100) NOT NULL,
  `id_producto` int(10) UNSIGNED NOT NULL,
  `fecha_venta` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `apov`
--
ALTER TABLE `apov`
  ADD PRIMARY KEY (`tipo_carro`);

--
-- Indices de la tabla `beneficios`
--
ALTER TABLE `beneficios`
  ADD PRIMARY KEY (`id_producto`,`descripcion`);

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
  ADD PRIMARY KEY (`cod_cliente`),
  ADD UNIQUE KEY `uq_cliente_ced` (`ced`),
  ADD KEY `idx_cliente_nombre` (`nombre`),
  ADD KEY `idx_cliente_correo` (`correo`);

--
-- Indices de la tabla `conductor`
--
ALTER TABLE `conductor`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_conductor_placa` (`placa`),
  ADD KEY `idx_conductor_cedula` (`cedulac`);

--
-- Indices de la tabla `ec_ep`
--
ALTER TABLE `ec_ep`
  ADD PRIMARY KEY (`nombre_producto`,`tipo_carro`);

--
-- Indices de la tabla `factura`
--
ALTER TABLE `factura`
  ADD PRIMARY KEY (`numero`,`sede`,`fecha_factura`),
  ADD KEY `idx_factura_fecha` (`fecha_factura`),
  ADD KEY `idx_factura_poliza` (`nro_poliza`),
  ADD KEY `idx_factura_usuario` (`nick_usuario`);

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
  ADD PRIMARY KEY (`codusovehiculo`),
  ADD UNIQUE KEY `uq_uso` (`uso`),
  ADD KEY `idx_uso_activo` (`activo`,`eliminado`);

--
-- Indices de la tabla `otros`
--
ALTER TABLE `otros`
  ADD PRIMARY KEY (`nombre_producto`,`tipo_carro`);

--
-- Indices de la tabla `poliza`
--
ALTER TABLE `poliza`
  ADD PRIMARY KEY (`nro_contrato`,`id_solicitud`,`id_producto`,`fecha_emision`),
  ADD KEY `idx_poliza_nro` (`nro_poliza`),
  ADD KEY `idx_poliza_fecha_emision` (`fecha_emision`),
  ADD KEY `idx_poliza_vencimiento` (`fecha_vencimiento`),
  ADD KEY `idx_poliza_status` (`status`),
  ADD KEY `idx_poliza_solicitud` (`id_solicitud`),
  ADD KEY `fk_poliza_producto` (`id_producto`);

--
-- Indices de la tabla `poliza_apov`
--
ALTER TABLE `poliza_apov`
  ADD PRIMARY KEY (`placa`);

--
-- Indices de la tabla `poliza_rcv`
--
ALTER TABLE `poliza_rcv`
  ADD PRIMARY KEY (`placa`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `idx_producto_nombre` (`nombre_producto`);

--
-- Indices de la tabla `rcv`
--
ALTER TABLE `rcv`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_rcv` (`producto`,`categoria`,`dependencia`),
  ADD KEY `idx_rcv_producto` (`producto`);

--
-- Indices de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD PRIMARY KEY (`nro_solicitud`),
  ADD UNIQUE KEY `uq_solicitud` (`cedula`,`placa`,`id_producto`,`fecha_solicitud`),
  ADD KEY `idx_solicitud_cedula` (`cedula`),
  ADD KEY `idx_solicitud_placa` (`placa`),
  ADD KEY `idx_solicitud_fecha` (`fecha_solicitud`),
  ADD KEY `fk_solicitud_producto` (`id_producto`);

--
-- Indices de la tabla `solicitud_apov`
--
ALTER TABLE `solicitud_apov`
  ADD PRIMARY KEY (`placa`);

--
-- Indices de la tabla `tasa_cambio`
--
ALTER TABLE `tasa_cambio`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tasa_fecha` (`fecha_registro`);

--
-- Indices de la tabla `tipos_carros`
--
ALTER TABLE `tipos_carros`
  ADD PRIMARY KEY (`tipo_carro`,`grupo`);

--
-- Indices de la tabla `tipos_carros_ecep`
--
ALTER TABLE `tipos_carros_ecep`
  ADD PRIMARY KEY (`tipo_carro`,`grupo`);

--
-- Indices de la tabla `tomador`
--
ALTER TABLE `tomador`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tomador_placa` (`placa`),
  ADD KEY `idx_tomador_cedula` (`cedulat`);

--
-- Indices de la tabla `unidad_tributaria`
--
ALTER TABLE `unidad_tributaria`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_ut_fecha` (`fecha_registro`);

--
-- Indices de la tabla `usuario`
--
ALTER TABLE `usuario`
  ADD PRIMARY KEY (`nro_vendedor`),
  ADD UNIQUE KEY `uq_usuario_nick` (`nick`),
  ADD KEY `idx_usuario_sede` (`sede`);

--
-- Indices de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD PRIMARY KEY (`cod_vehiculo`),
  ADD UNIQUE KEY `uq_vehiculo_placa` (`placa`),
  ADD KEY `idx_vehiculo_cedula` (`cedula`);

--
-- Indices de la tabla `venta`
--
ALTER TABLE `venta`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_venta_usuario` (`nickusuario`),
  ADD KEY `idx_venta_fecha` (`fecha_venta`),
  ADD KEY `idx_venta_producto` (`id_producto`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `categorias`
--
ALTER TABLE `categorias`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `cod_cliente` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32979;

--
-- AUTO_INCREMENT de la tabla `conductor`
--
ALTER TABLE `conductor`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `modelo_vehiculo`
--
ALTER TABLE `modelo_vehiculo`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de la tabla `opc_vehiculos_uso`
--
ALTER TABLE `opc_vehiculos_uso`
  MODIFY `codusovehiculo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `id_producto` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `rcv`
--
ALTER TABLE `rcv`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `solicitud`
--
ALTER TABLE `solicitud`
  MODIFY `nro_solicitud` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=126985;

--
-- AUTO_INCREMENT de la tabla `tasa_cambio`
--
ALTER TABLE `tasa_cambio`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `tomador`
--
ALTER TABLE `tomador`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `unidad_tributaria`
--
ALTER TABLE `unidad_tributaria`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `usuario`
--
ALTER TABLE `usuario`
  MODIFY `nro_vendedor` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=67;

--
-- AUTO_INCREMENT de la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  MODIFY `cod_vehiculo` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43350;

--
-- AUTO_INCREMENT de la tabla `venta`
--
ALTER TABLE `venta`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `beneficios`
--
ALTER TABLE `beneficios`
  ADD CONSTRAINT `fk_beneficios_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `conductor`
--
ALTER TABLE `conductor`
  ADD CONSTRAINT `fk_conductor_vehiculo` FOREIGN KEY (`placa`) REFERENCES `vehiculo` (`placa`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `poliza`
--
ALTER TABLE `poliza`
  ADD CONSTRAINT `fk_poliza_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_poliza_solicitud` FOREIGN KEY (`id_solicitud`) REFERENCES `solicitud` (`nro_solicitud`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `solicitud`
--
ALTER TABLE `solicitud`
  ADD CONSTRAINT `fk_solicitud_cliente` FOREIGN KEY (`cedula`) REFERENCES `cliente` (`ced`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_solicitud_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `vehiculo`
--
ALTER TABLE `vehiculo`
  ADD CONSTRAINT `fk_vehiculo_cliente` FOREIGN KEY (`cedula`) REFERENCES `cliente` (`ced`) ON UPDATE CASCADE;

--
-- Filtros para la tabla `venta`
--
ALTER TABLE `venta`
  ADD CONSTRAINT `fk_venta_producto` FOREIGN KEY (`id_producto`) REFERENCES `producto` (`id_producto`) ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
