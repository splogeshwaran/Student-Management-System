/* ============================================================
   app.js — lightweight message notifications (ES module)
   Usage: import { showToast } from './app.js';
          showToast("Enrolled successfully!", "success");
   type: "success" | "error" | "info" (default "info")
   ============================================================ */

function ensureStack() {
    let stack = document.getElementById("toast-stack");
    if (!stack) {
        stack = document.createElement("div");
        stack.id = "toast-stack";
        document.body.appendChild(stack);
    }
    return stack;
}

export function showToast(message, type = "info") {
    const stack = ensureStack();

    const toast = document.createElement("div");
    toast.className = "toast " + type;
    toast.textContent = message;

    stack.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 250);
    }, 3200);
}
