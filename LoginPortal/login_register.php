<?php
session_start();
require_once 'config.php';

if (isset($_POST['register'])) {
    $name  = $_POST['name'] ?? '';
    $email = $_POST['email'] ?? '';
    $pass  = $_POST['password'] ?? '';
    $role  = $_POST['role'] ?? 'user';

    // Hash password 
    $password_hash = password_hash($pass, PASSWORD_DEFAULT);

    // 1) Check if email already exists
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    if (!$stmt) {
        die("Prepare failed: " . $conn->error);
    }
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        // Email taken
        $_SESSION['register_error'] = 'Email is already registered!';
        $_SESSION['active_form'] = 'register';
        $stmt->close();
    } else {
        $stmt->close();

        // 2) Insert new user
        $stmt = $conn->prepare(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)"
        );
        if (!$stmt) {
            die("Prepare failed: " . $conn->error);
        }
        $stmt->bind_param("ssss", $name, $email, $password_hash, $role);
        $stmt->execute();
        $stmt->close();
    }

    header("Location: index.php");
    exit();
}

if (isset($_POST['login'])) {
    $email    = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    // Look up user by email using a prepared statement
    $stmt = $conn->prepare(
        "SELECT id, name, email, password_hash, role 
         FROM users 
         WHERE email = ?"
    );

    if (!$stmt) {
        // In production you might log this instead of die()
        die("Prepare failed: " . $conn->error);
    }

    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($user = $result->fetch_assoc()) {
        // Verify the password against the stored hash
        if (password_verify($password, $user['password_hash'])) {

            // Save important user info in the session
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['name']    = $user['name'];
            $_SESSION['email']   = $user['email'];
            $_SESSION['role']    = $user['role'];

            // Re-direct current page to the DashBoard
            $dashboard = '../DashBoardProject/index.html';
            header("Location: $dashboard");
            exit();
        }
    }

    // If we’re here, login failed
    $_SESSION['login_error'] = 'Incorrect email or password';
    $_SESSION['active_form'] = 'login';
    header("Location: index.php");
    exit();
}

?>
