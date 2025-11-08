<?php
// Aiven connection URI
$uri = "mysql://avnadmin:AVNS_Mr1ySEjkzZc8jSohYbl@loginapp-mysql-2c9372e7-mucamedickens-4503.f.aivencloud.com:25488/defaultdb?ssl-mode=REQUIRED";

$fields = parse_url($uri);

$host = $fields['host'];
$port = $fields['port'];
$user = $fields['user'];
$pass = $fields['pass'];
$dbname = ltrim($fields['path'], '/'); // "defaultdb"

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

// Optional: verify we are using SSL
/*
$result = $conn->query("SHOW STATUS LIKE 'Ssl_cipher'");
$row = $result->fetch_assoc();
echo 'SSL cipher in use: ' . $row['Value'];
*/
?>
