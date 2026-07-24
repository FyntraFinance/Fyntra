// js/modal.js

function abrirModal({
    titulo = "",
    conteudo = "",
    footer = ""
}) {

    const modal =
        document.getElementById(
            "modalOverlay"
        );

    if (!modal)
        return;

    document.getElementById(
        "modalTitulo"
    ).innerHTML = titulo;

    document.getElementById(
        "modalConteudo"
    ).innerHTML = conteudo;

    document.getElementById(
        "modalFooter"
    ).innerHTML = footer;

    modal.classList.add(
        "active"
    );
}

function fecharModal() {

    const modal =
        document.getElementById(
            "modalOverlay"
        );

    if (!modal)
        return;

    modal.classList.remove(
        "active"
    );
}

function confirmarAcao({
    titulo = "Confirmação",
    mensagem = "Deseja continuar?",
    confirmarTexto = "Confirmar",
    cancelarTexto = "Cancelar",
    onConfirmar = null
}) {

    abrirModal({

        titulo,

        conteudo: `
            <div class="space-y-4">

                <p class="text-slate-300">

                    ${mensagem}

                </p>

            </div>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">

                ${cancelarTexto}

            </button>

            <button
                id="btnConfirmarModal"
                class="btn btn-danger">

                ${confirmarTexto}

            </button>
        `
    });

    setTimeout(() => {

        const botao =
            document.getElementById(
                "btnConfirmarModal"
            );

        if (!botao)
            return;

        botao.onclick = () => {

            fecharModal();

            if (
                typeof onConfirmar
                === "function"
            ) {

                onConfirmar();
            }
        };

    }, 50);
}

window.addEventListener(
    "click",
    event => {

        const modal =
            document.getElementById(
                "modalOverlay"
            );

        if (
            event.target === modal
        ) {

            fecharModal();
        }
    }
);