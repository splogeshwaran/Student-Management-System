/* ============================================================
   auth.js — login & registration logic (ES module)
   Keeps validation + submit handling separate from markup.
   ============================================================ */

import { showToast } from './app.js';

export function validateLogin(username, password) {
    const errors = {};

    if (!username || username.trim().length === 0) {
        errors.username = "Please enter your username.";
    }
    if (!password || password.length < 4) {
        errors.password = "Password must be at least 4 characters.";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

export function validateRegister(fields) {
    const errors = {};
    const { fullname, email, roll, password } = fields;

    if (!fullname || fullname.trim().length === 0) {
        errors.fullname = "Please enter your full name.";
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((email || "").trim())) {
        errors.email = "Please enter a valid email address.";
    }
    if (!roll || roll.toString().trim().length === 0) {
        errors.roll = "Please enter your roll number.";
    }
    if (!password || password.length < 6) {
        errors.password = "Password must be at least 6 characters.";
    }

    return { valid: Object.keys(errors).length === 0, errors };
}

function markField(fieldId, hasError) {
    const field = document.getElementById(fieldId);
    if (field) field.classList.toggle("invalid", hasError);
}

export function handleLoginSubmit(event) {
    event.preventDefault();

    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    const { valid, errors } = validateLogin(username, password);

    markField("userField", !!errors.username);
    markField("passField", !!errors.password);

    if (!valid) {
        showToast("Please fix the highlighted fields.", "error");
        return;
    }

    showToast("Login successful! Redirecting...", "success");
    setTimeout(() => { window.location.href = "home.html"; }, 900);
}

export function handleRegisterSubmit(event) {
    event.preventDefault();

    const fields = {
        fullname: document.getElementById("fullname").value,
        email: document.getElementById("email").value,
        roll: document.getElementById("roll").value,
        password: document.getElementById("password").value
    };

    const { valid, errors } = validateRegister(fields);

    markField("nameField", !!errors.fullname);
    markField("emailField", !!errors.email);
    markField("rollField", !!errors.roll);
    markField("passField", !!errors.password);

    if (!valid) {
        showToast("Please fix the highlighted fields.", "error");
        return;
    }

    showToast("Account created successfully! Redirecting...", "success");
    setTimeout(() => { window.location.href = "home.html"; }, 900);
}
