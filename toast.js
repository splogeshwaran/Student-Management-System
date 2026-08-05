(function () {
    function ensureStack() {
        let stack = document.getElementById("toast-stack");
        if (!stack) {
            stack = document.createElement("div");
            stack.id = "toast-stack";
            document.body.appendChild(stack);
        }
        return stack;
    }

    window.showToast = function (message, type) {
        type = type || "info";
        const stack = ensureStack();

        const toast = document.createElement("div");
        toast.className = "toast " + type;
        toast.textContent = message;

        stack.appendChild(toast);

        setTimeout(function () {
            toast.classList.add("hide");
            setTimeout(function () {
                toast.remove();
            }, 250);
        }, 3200);
    };
})();
