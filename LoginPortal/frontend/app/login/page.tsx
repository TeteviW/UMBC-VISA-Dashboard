"use client";

import { useState, FormEvent } from "react";

type ActiveForm = "login" | "register";

export default function LoginRegisterPage(){
    // Redirects the page when the Login Button is pressed
    const [activeForm, setActiveForm] = useState<ActiveForm>("login");

    // Handle Error Cases
    const [loginError, setLoginError] = useState<string>("");
    const [registerError, setRegisterError] = useState<string>("");

    //
    const [isSubmitting, setIsSubmitting] = useState(false);

    // switch between the register and login form
    function showForm(form: ActiveForm){
        setActiveForm(form)
        setLoginError("")
        setRegisterError("")
    }

    // LOGIN SUBMIT  HANDLER
    async function handleLoginSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoginError("");
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");

        try {
        const res = await fetch("https://your-backend.com/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setLoginError(data.error || "Invalid login credentials.");
            return;
        }

        // Redirect to the VISA Dashboard
        window.location.href = "...";

        } catch {
            setLoginError("Network Error. Please refresh the page...");
        } finally {
            setIsSubmitting(false);
        }
    }

    // REGISTER SUBMIT HANDLER
    async function handleRegisterSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setRegisterError("");
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");
        const password = String(formData.get("password") || "");
        const role = String(formData.get("role") || "");

        try {
        const res = await fetch("https://your-backend.com/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password, role }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
            setRegisterError(data.error || "Registration failed.");
            return;
        }

        // Auto-switch to login screen after success
        setActiveForm("login");
        setLoginError("Account created. Please log in.");

        } catch {
            setRegisterError("Network error. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
    <div className="container">

      {/* LOGIN FORM */}
      <div className={`form-box ${activeForm === "login" ? "active" : ""}`} id="login-form">
        <form onSubmit={handleLoginSubmit}>
          <h2>Login</h2>
          {loginError && <p className="error-message">{loginError}</p>}

          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting && activeForm === "login" ? "Logging in..." : "Login"}
          </button>

          <p>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => showForm("register")}
              className="link-button"
            >
              Register
            </button>
          </p>
        </form>
      </div>

      {/* REGISTER FORM */}
      <div className={`form-box ${activeForm === "register" ? "active" : ""}`} id="register-form">
        <form onSubmit={handleRegisterSubmit}>
          <h2>Register</h2>
          {registerError && <p className="error-message">{registerError}</p>}

          <input type="text" name="name" placeholder="Name" required />
          <input type="email" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Password" required />

          <select name="role" required>
            <option value="">--Select Role--</option>
            <option value="admin">Admin</option>
            <option value="user">User</option>
          </select>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting && activeForm === "register" ? "Registering..." : "Register"}
          </button>

          <p>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => showForm("login")}
              className="link-button"
            >
              Login
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}