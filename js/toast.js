function mostrarToast(
    mensagem,
    tipo = "info"
) {

    const container =
        document.getElementById(
            "toastContainer"
        );

    if (!container)
        return;

    const icons = {

        success: "✅",

        error: "❌",

        info: "ℹ️",

        warning: "⚠️"
    };

    const toast =
        document.createElement(
            "div"
        );

    toast.className = `
        toast
        ${tipo}
    `;

    toast.innerHTML = `
        <div class="toast-icon">

            ${icons[tipo] || "ℹ️"}

        </div>

        <div class="toast-content">

            ${mensagem}

        </div>
    `;

    container.appendChild(
        toast
    );

    setTimeout(() => {

        toast.classList.add(
            "hide"
        );

        setTimeout(() => {

            toast.remove();

        }, 300);

    }, 3500);
}