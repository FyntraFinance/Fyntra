// js/app.js

const appState = {

    paginaAtual:
        "dashboard",

    mesAtual:
        obterMesAtual()
};

window.addEventListener(
    "DOMContentLoaded",
    async () => {

        configurarTema();

        configurarSidebarMobile();

        atualizarTextoMes();

        await navegarPara(
            "dashboard"
        );
    }
);

function configurarTema() {

    const darkMode =
        window.matchMedia(
            "(prefers-color-scheme: dark)"
        ).matches;

    if (darkMode) {

        document.documentElement
            .classList.add(
                "dark"
            );
    }

    window.matchMedia(
        "(prefers-color-scheme: dark)"
    ).addEventListener(
        "change",
        (event) => {

            if (event.matches) {

                document.documentElement
                    .classList.add(
                        "dark"
                    );

                return;
            }

            document.documentElement
                .classList.remove(
                    "dark"
                );
        }
    );
}

function configurarSidebarMobile() {

    const toggle =
        document.getElementById(
            "menuToggle"
        );

    const sidebar =
        document.getElementById(
            "sidebar"
        );

    const overlay =
        document.getElementById(
            "sidebarOverlay"
        );

    if (
        !toggle ||
        !sidebar ||
        !overlay
    ) {
        return;
    }

    toggle.addEventListener(
        "click",
        () => {

            sidebar.classList.toggle(
                "open"
            );

            overlay.classList.toggle(
                "active"
            );
        }
    );

    overlay.addEventListener(
        "click",
        fecharSidebarMobile
    );
}

function fecharSidebarMobile() {

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

const NOMES_MESES = [
    "Janeiro", "Fevereiro", "Março",
    "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro",
    "Outubro", "Novembro", "Dezembro"
];

function atualizarTextoMes() {

    const elemento =
        document.getElementById(
            "mesAtualTexto"
        );

    if (!elemento)
        return;

    const [ano, mes] =
        appState.mesAtual.split("-");

    elemento.textContent =
        `${NOMES_MESES[Number(mes) - 1]} ${ano}`;
}

// ── MÊS/ANO PICKER ──────────────────────────────────

let _pickerAnoVisivel = null;

function abrirPickerMes() {

    fecharPickerMes();

    const [ano, mes] =
        appState.mesAtual.split("-").map(Number);

    _pickerAnoVisivel = ano;

    const picker =
        document.createElement("div");

    picker.id = "mesPicker";
    picker.className = "mes-picker";

    picker.innerHTML = _renderPickerHtml(ano, mes);

    document.body.appendChild(picker);

    _posicionarPicker();

    setTimeout(() => {

        document.addEventListener(
            "click",
            _onClickForaPicker,
            { once: true }
        );
    }, 0);
}

function _renderPickerHtml(anoVisivel, mesAtivo) {

    const [anoAtual, mesAtual] =
        appState.mesAtual.split("-").map(Number);

    const botoessMeses = NOMES_MESES.map((nome, i) => {

        const ativo =
            anoVisivel === anoAtual &&
            (i + 1) === mesAtual;

        return `
            <button
                class="picker-mes-btn ${ativo ? "ativo" : ""}"
                onclick="selecionarMesPicker(${anoVisivel}, ${i + 1})">
                ${nome.slice(0, 3)}
            </button>
        `;
    }).join("");

    return `
        <div class="picker-header">
            <button class="picker-nav" onclick="navegarAnoPicker(-1)">‹</button>
            <span class="picker-ano">${anoVisivel}</span>
            <button class="picker-nav" onclick="navegarAnoPicker(1)">›</button>
        </div>
        <div class="picker-meses">
            ${botoessMeses}
        </div>
    `;
}

function _posicionarPicker() {

    const ancora =
        document.getElementById("mesAtualTexto");

    const picker =
        document.getElementById("mesPicker");

    if (!ancora || !picker) return;

    const rect = ancora.getBoundingClientRect();

    picker.style.top =
        `${rect.bottom + 8}px`;

    picker.style.left =
        `${rect.left + rect.width / 2}px`;
}

function _onClickForaPicker(e) {

    const picker =
        document.getElementById("mesPicker");

    if (picker && !picker.contains(e.target)) {

        fecharPickerMes();

    } else if (picker) {

        document.addEventListener(
            "click",
            _onClickForaPicker,
            { once: true }
        );
    }
}

function fecharPickerMes() {

    document.getElementById("mesPicker")?.remove();
    _pickerAnoVisivel = null;
}

function navegarAnoPicker(direcao) {

    _pickerAnoVisivel += direcao;

    const [, mesAtual] =
        appState.mesAtual.split("-").map(Number);

    const picker =
        document.getElementById("mesPicker");

    if (picker)
        picker.innerHTML =
            _renderPickerHtml(_pickerAnoVisivel, mesAtual);
}

function selecionarMesPicker(ano, mes) {

    appState.mesAtual =
        `${ano}-${String(mes).padStart(2, "0")}`;

    fecharPickerMes();

    atualizarTextoMes();

    inicializarPagina(appState.paginaAtual);
}

function alterarMes(
    direcao
) {

    const [
        anoAtual,
        mesAtual
    ] = appState.mesAtual
        .split("-")
        .map(Number);

    const data = new Date(
        anoAtual,
        mesAtual - 1
    );

    data.setMonth(
        data.getMonth() + direcao
    );

    const novoAno =
        data.getFullYear();

    const novoMes =
        String(
            data.getMonth() + 1
        ).padStart(2, "0");

    appState.mesAtual =
        `${novoAno}-${novoMes}`;

    atualizarTextoMes();

    inicializarPagina(
        appState.paginaAtual
    );
}