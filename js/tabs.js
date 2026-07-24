function toggleSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (!sidebar)
        return;

    sidebar.classList.toggle(
        "open"
    );

    overlay?.classList.toggle(
        "active"
    );
}

function fecharSidebar() {

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    sidebar?.classList.remove(
        "open"
    );

    overlay?.classList.remove(
        "active"
    );
}

function abrirImportacao() {

    const input =
        document.getElementById(
            "inputImportarJson"
        );

    input?.click();
}

function atualizarTituloPagina(
    titulo
) {

    const elemento =
        document.getElementById(
            "tituloPagina"
        );

    if (!elemento)
        return;

    elemento.innerText =
        titulo;
}

function navegarPara(
    pagina,
    titulo
) {

    atualizarTituloPagina(
        titulo
    );

    abrirPagina(
        pagina
    );

    fecharSidebar();
}