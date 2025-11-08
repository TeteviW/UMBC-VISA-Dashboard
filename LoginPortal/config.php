<?php

// Loading enviroment variables from the .env file at root.
//require_once __DIR__ . '/../vendor/autoload.php';
//$dotenv = Dotenv\Dotenv::createImmutable(__DIR__ . '/../');
// $dotenv->load();

// Aiven connection (without exposing password)
$host   = getenv('AIVEN_DB_HOST');
$port   = getenv('AIVEN_DB_PORT');
$user   = getenv('AIVEN_DB_USER');
$pass   = getenv('AIVEN_DB_PASSWORD');
$dbname = getenv('AIVEN_DB_NAME');
$caCert = getenv('AIVEN_CA_CERT_PATH') ?: (__DIR__ . '/ca.pem');

//var_dump($host, $port, $user, $dbname, $caCert);
//exit;

// Basic sanity check
if (!$host || !$port || !$user || !$pass || !$dbname) {
    die("One or more required DB env vars are missing.");
}

// Connect with mySQL DB
$conn = mysqli_init();
if (!$conn) {
    die("mysqli_init() failed");
}

// Enable SSL – we only need the CA file for Aiven
if (!mysqli_ssl_set($conn, null, null, $caCert, null, null)) {
    die("Failed to set SSL CA\n");
}

// Connect with SSL
if (!mysqli_real_connect(
    $conn,
    $host,
    $user,
    $pass,
    $dbname,
    (int) $port,
    null,                  // socket (none, because we connect over TCP)
    MYSQLI_CLIENT_SSL      // flags
)) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
