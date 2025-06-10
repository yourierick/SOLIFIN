-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mar. 10 juin 2025 à 13:47
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `solifin_db`
--

--
-- Déchargement des données de la table `exchange_rates`
--

INSERT INTO `exchange_rates` (`id`, `currency`, `target_currency`, `rate`, `last_api_update`, `api_response`, `created_at`, `updated_at`) VALUES
(1, 'USD', 'CDF', 2873.563218, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\",\"inverse_calculated\":true}', '2025-06-09 07:48:51', '2025-06-09 07:48:56'),
(2, 'CDF', 'USD', 0.000348, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\"}', '2025-06-09 07:48:51', '2025-06-09 07:48:56'),
(3, 'USD', 'EUR', 0.876877, '2025-06-09 07:48:52', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"EUR\",\"inverse_calculated\":true}', '2025-06-09 07:48:51', '2025-06-09 07:48:52'),
(4, 'EUR', 'USD', 1.140411, '2025-06-09 07:48:52', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"EUR\"}', '2025-06-09 07:48:51', '2025-06-09 07:48:52'),
(5, 'USD', 'XAF', 575.043128, '2025-06-09 07:48:55', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XAF\",\"inverse_calculated\":true}', '2025-06-09 07:48:51', '2025-06-09 07:48:55'),
(6, 'XAF', 'USD', 0.001739, '2025-06-09 07:48:55', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XAF\"}', '2025-06-09 07:48:51', '2025-06-09 07:48:55'),
(7, 'USD', 'XOF', 575.043128, '2025-06-09 07:48:53', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XOF\",\"inverse_calculated\":true}', '2025-06-09 07:48:51', '2025-06-09 07:48:53'),
(8, 'XOF', 'USD', 0.001739, '2025-06-09 07:48:53', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XOF\"}', '2025-06-09 07:48:51', '2025-06-09 07:48:53'),
(9, 'EUR', 'CDF', 3322.259136, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\",\"inverse_calculated\":true}', '2025-06-09 07:48:52', '2025-06-09 07:48:56'),
(10, 'CDF', 'EUR', 0.000301, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\"}', '2025-06-09 07:48:52', '2025-06-09 07:48:56'),
(11, 'EUR', 'XAF', 656.167979, '2025-06-09 07:48:55', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XAF\",\"inverse_calculated\":true}', '2025-06-09 07:48:52', '2025-06-09 07:48:55'),
(12, 'XAF', 'EUR', 0.001524, '2025-06-09 07:48:55', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XAF\"}', '2025-06-09 07:48:52', '2025-06-09 07:48:55'),
(13, 'EUR', 'XOF', 656.167979, '2025-06-09 07:48:53', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XOF\",\"inverse_calculated\":true}', '2025-06-09 07:48:52', '2025-06-09 07:48:53'),
(14, 'XOF', 'EUR', 0.001524, '2025-06-09 07:48:53', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XOF\"}', '2025-06-09 07:48:52', '2025-06-09 07:48:53'),
(15, 'XOF', 'CDF', 5.062625, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\",\"inverse_calculated\":true}', '2025-06-09 07:48:53', '2025-06-09 07:48:56'),
(16, 'CDF', 'XOF', 0.197526, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\"}', '2025-06-09 07:48:53', '2025-06-09 07:48:56'),
(17, 'XOF', 'XAF', 1.000000, '2025-06-09 07:48:55', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XAF\",\"inverse_calculated\":true}', '2025-06-09 07:48:53', '2025-06-09 07:48:55'),
(18, 'XAF', 'XOF', 1.000000, '2025-06-09 07:48:55', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"XAF\"}', '2025-06-09 07:48:53', '2025-06-09 07:48:55'),
(19, 'XAF', 'CDF', 5.062625, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\",\"inverse_calculated\":true}', '2025-06-09 07:48:55', '2025-06-09 07:48:56'),
(20, 'CDF', 'XAF', 0.197526, '2025-06-09 07:48:56', '{\"source\":\"open.er-api.com\",\"timestamp\":1749427351,\"base_code\":\"CDF\"}', '2025-06-09 07:48:55', '2025-06-09 07:48:56');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
