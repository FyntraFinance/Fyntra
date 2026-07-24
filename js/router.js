const ROTAS = {

    dashboard:
        "pages/dashboard.html",

    pessoas:
        "pages/pessoas.html",

    contasFixas:
        "pages/contas-fixas.html",

    contasVariaveis:
        "pages/contas-variaveis.html",

    assistente:
        "pages/assistente.html",

    perfil:
        "pages/perfil.html"
};

async function navegarPara(
    pagina
) {

    appState.paginaAtual =
        pagina;

    atualizarMenuAtivo();

    const url =
        ROTAS[pagina];

    const response =
        await fetch(url);

    const html =
        await response.text();

    const container =
        document.getElementById(
            "app"
        );

    container.innerHTML =
        html;

    inicializarPagina(
        pagina
    );
}

function inicializarPagina(
    pagina
) {

    switch (pagina) {

        case "dashboard":

            renderizarDashboard();

            break;

        case "pessoas":

            renderizarPessoas();

            break;

        case "contasFixas":

            inicializarContasFixas();

            break;

        case "contasVariaveis":

            inicializarContasVariaveis();

            break;

        case "assistente":

            inicializarAssistente();

            break;

        case "perfil":

            renderizarPerfil();

            break;
    }
}

function atualizarMenuAtivo() {

    document
        .querySelectorAll(
            "[data-menu]"
        )
        .forEach(item => {

            item.classList.remove(
                "active"
            );

            if (
                item.dataset.menu ===
                appState.paginaAtual
            ) {

                item.classList.add(
                    "active"
                );
            }
        });
}