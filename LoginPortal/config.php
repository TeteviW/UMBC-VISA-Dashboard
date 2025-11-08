<?php
// Aiven connection (without exposing password)
$uri = "mysql://avnadmin:@loginapp-mysql-2c9372e7-mucamedickens-4503.f.aivencloud.com:25488/defaultdb?ssl-mode=REQUIRED";

$fields = parse_url($uri);

$host   = $fields['host'];
$port   = $fields['port'];
$user   = $fields['user'];
$dbname = 'userauth_db'; // <- target database

// Get the password from an environment variable
$pass = getenv('AIVEN_DB_PASSWORD');

// Path to your CA cert from Aiven
$caCert = __DIR__ . '/ca.pem';

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
    $port,
    MYSQLI_CLIENT_SSL
)) {
    die("Connection failed: " . mysqli_connect_error());
}
?>
