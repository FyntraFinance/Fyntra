// js/perfil.js

const CORES_META = [
    "#10b981",
    "#3b82f6",
    "#8b5cf6",
    "#f59e0b",
    "#ef4444",
    "#06b6d4",
    "#ec4899",
    "#f97316"
];

function renderizarPerfil() {

    atualizarStatusToken();
    preencherTokenSalvo();
    renderizarListaMetas();
}

function atualizarStatusToken() {

    const chave = obterApiKey();
    const el = document.getElementById("tokenStatus");

    if (!el) return;

    if (chave) {

        el.innerHTML = `
            <span class="perfil-status ok">
                ✅ Token configurado
            </span>
        `;

        const btnLimpar =
            document.getElementById("btnLimparToken");

        if (btnLimpar)
            btnLimpar.style.display = "";

    } else {

        el.innerHTML = `
            <span class="perfil-status warn">
                ⚠️ Token não configurado
            </span>
        `;

        const btnLimpar =
            document.getElementById("btnLimparToken");

        if (btnLimpar)
            btnLimpar.style.display = "none";
    }
}

function preencherTokenSalvo() {

    const chave = obterApiKey();
    const input = document.getElementById("inputTokenPoe");

    if (!input) return;

    if (chave)
        input.placeholder = "Token já configurado — cole um novo para substituir";
}

function salvarTokenPoe() {

    const input =
        document.getElementById("inputTokenPoe");

    const chave = input.value.trim();

    if (!chave) {

        mostrarToast(
            "Informe o token da Poe.",
            "error"
        );

        return;
    }

    salvarApiKey(chave);

    input.value = "";

    mostrarToast(
        "Token salvo com sucesso!",
        "success"
    );

    atualizarStatusToken();
    preencherTokenSalvo();
}

function limparTokenPoe() {

    abrirModal({

        titulo: "Limpar Token",

        conteudo: `
            <p class="text-muted">
                Tem certeza que deseja remover o token da Poe? O Assistente IA não funcionará sem ele.
            </p>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                style="background:var(--danger);border-color:var(--danger);"
                onclick="confirmarLimparToken()">
                Remover
            </button>
        `
    });
}

function confirmarLimparToken() {

    localStorage.removeItem(
        STORAGE_KEYS.apiKey
    );

    fecharModal();

    mostrarToast(
        "Token removido.",
        "success"
    );

    atualizarStatusToken();
    preencherTokenSalvo();
}

function alternarVisibilidadeToken() {

    const input =
        document.getElementById("inputTokenPoe");

    if (!input) return;

    input.type =
        input.type === "password"
            ? "text"
            : "password";
}

function zerarTodosDados() {

    abrirModal({

        titulo: "⚠️ Zerar Todos os Dados",

        conteudo: `
            <div class="space-y-4">

                <p class="text-muted">
                    Você está prestes a apagar <strong style="color:var(--danger)">todos os dados</strong> do aplicativo:
                </p>

                <div class="perfil-import-resumo">
                    <span>👥 Todas as pessoas</span>
                    <span>🏠 Todas as contas fixas</span>
                    <span>💳 Todas as contas variáveis</span>
                    <span>⚙️ Todas as configurações</span>
                    <span>🤖 Token da Poe</span>
                </div>

                <p class="text-muted" style="font-size:13px;">
                    Esta ação é <strong>irreversível</strong>. O app voltará ao estado inicial.
                </p>

            </div>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                style="background:var(--danger);border-color:var(--danger);"
                onclick="confirmarZerarTudo()">
                🗑️ Zerar Tudo
            </button>
        `
    });
}

function confirmarZerarTudo() {

    Object.values(STORAGE_KEYS).forEach(chave => {
        localStorage.removeItem(chave);
    });

    iniciarStorage();

    fecharModal();

    mostrarToast(
        "Todos os dados foram apagados.",
        "success"
    );

    navegarPara("dashboard");
}

function exportarDadosPerfil() {

    exportarDados();

    mostrarToast(
        "Backup exportado com sucesso!",
        "success"
    );
}

function onSelecionarArquivo(event) {

    const arquivo = event.target.files[0];

    if (!arquivo) return;

    lerArquivoJSON(arquivo);

    event.target.value = "";
}

function onDropArquivo(event) {

    event.preventDefault();

    const dropZone =
        document.getElementById("dropZone");

    if (dropZone)
        dropZone.classList.remove("drag-over");

    const arquivo =
        event.dataTransfer.files[0];

    if (!arquivo) return;

    if (!arquivo.name.endsWith(".json")) {

        mostrarToast(
            "Selecione um arquivo .json válido.",
            "error"
        );

        return;
    }

    lerArquivoJSON(arquivo);
}

function lerArquivoJSON(arquivo) {

    const reader = new FileReader();

    reader.onload = function (e) {

        try {

            const dados =
                JSON.parse(e.target.result);

            confirmarImportacao(dados);

        } catch {

            mostrarToast(
                "Arquivo inválido ou corrompido.",
                "error"
            );
        }
    };

    reader.readAsText(arquivo);
}

function confirmarImportacao(dados) {

    const resumo = [
        dados.pessoas?.length
            ? `👥 ${dados.pessoas.length} pessoa(s)`
            : null,

        dados.contasFixas?.length
            ? `🏠 ${dados.contasFixas.length} conta(s) fixa(s)`
            : null,

        dados.contasVariaveis?.length
            ? `💳 ${dados.contasVariaveis.length} conta(s) variável(is)`
            : null,
    ]
    .filter(Boolean)
    .join(", ");

    const exportadoEm = dados.exportadoEm
        ? `<p class="text-muted" style="margin-top:8px;font-size:13px;">
               Exportado em: ${new Date(dados.exportadoEm).toLocaleString("pt-BR")}
           </p>`
        : "";

    abrirModal({

        titulo: "Confirmar Importação",

        conteudo: `
            <div class="space-y-4">

                <p class="text-muted">
                    Os dados atuais serão <strong style="color:var(--danger)">substituídos</strong>.
                    Deseja continuar?
                </p>

                <div class="perfil-import-resumo">
                    <span class="perfil-import-label">Será importado:</span>
                    <span>${resumo || "Sem dados detectados"}</span>
                </div>

                ${exportadoEm}

            </div>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                onclick="executarImportacao()">
                ✅ Importar
            </button>
        `
    });

    window._dadosImportacao = dados;
}

function executarImportacao() {

    const dados = window._dadosImportacao;

    if (!dados) {

        mostrarToast(
            "Nenhum dado para importar.",
            "error"
        );

        return;
    }

    const sucesso = importarDados(dados);

    fecharModal();

    delete window._dadosImportacao;

    if (sucesso) {

        mostrarToast(
            "Dados importados com sucesso!",
            "success"
        );

    } else {

        mostrarToast(
            "Erro ao importar os dados.",
            "error"
        );
    }
}

// =========================
// METAS FINANCEIRAS
// =========================

function renderizarListaMetas() {

    const container =
        document.getElementById(
            "listaMetasPerfil"
        );

    if (!container)
        return;

    const metas = obterMetas();

    if (metas.length === 0) {

        container.innerHTML = `
            <div class="perfil-metas-vazio">
                🎯 Nenhuma meta cadastrada ainda.
                Clique em <strong>+ Nova Meta</strong> para começar.
            </div>
        `;

        return;
    }

    container.innerHTML = metas
        .map((meta, i) => {

            const pct = Math.min(
                100,
                Math.round(
                    (meta.valorAtual /
                    meta.valorAlvo) *
                    100
                )
            );

            return `
                <div class="perfil-meta-item">

                    <div class="perfil-meta-item-left">

                        <div
                            class="perfil-meta-emoji"
                            style="background: ${
                                meta.cor || CORES_META[0]
                            }22; color: ${
                                meta.cor || CORES_META[0]
                            };">

                            ${escaparHtml(
                                meta.emoji || "🎯"
                            )}

                        </div>

                        <div class="perfil-meta-info">

                            <div class="perfil-meta-nome">
                                ${escaparHtml(meta.nome)}
                            </div>

                            <div class="perfil-meta-prog-track">
                                <div
                                    class="perfil-meta-prog-bar"
                                    style="width:${pct}%; background: ${
                                        meta.cor || CORES_META[0]
                                    };">
                                </div>
                            </div>

                            <div class="perfil-meta-valores">

                                <span style="color: ${
                                    meta.cor || CORES_META[0]
                                }; font-weight:600;">
                                    ${formatarMoeda(meta.valorAtual)}
                                </span>

                                <span class="text-muted">
                                    de ${formatarMoeda(meta.valorAlvo)}
                                </span>

                                <span class="perfil-meta-pct">
                                    ${pct}%
                                </span>

                                ${meta.contribuicaoMensal
                                    ? `<span class="text-muted">· ${formatarMoeda(meta.contribuicaoMensal)}/mês</span>`
                                    : `<span class="text-muted">· contribuição automática</span>`
                                }

                            </div>

                        </div>

                    </div>

                    <div class="perfil-meta-acoes">

                        <button
                            class="btn btn-secondary"
                            style="padding: 6px 12px; font-size:13px;"
                            onclick="abrirModalEditarMeta('${
                                meta.id
                            }')">
                            ✏️
                        </button>

                        <button
                            class="btn btn-secondary"
                            style="padding: 6px 12px; font-size:13px; border-color:var(--danger); color:var(--danger);"
                            onclick="confirmarExcluirMeta('${
                                meta.id
                            }')">
                            🗑️
                        </button>

                    </div>

                </div>
            `;
        })
        .join("");
}

function abrirModalNovaMeta() {

    _abrirFormMeta(null);
}

function abrirModalEditarMeta(id) {

    const metas = obterMetas();
    const meta = metas.find(m => m.id === id);

    if (!meta)
        return;

    _abrirFormMeta(meta);
}

function _abrirFormMeta(meta) {

    const titulo =
        meta
            ? "Editar Meta"
            : "Nova Meta";

    const corSelecionada =
        meta?.cor || CORES_META[0];

    const chips = CORES_META
        .map(cor => `
            <button
                type="button"
                class="meta-cor-chip ${
                    cor === corSelecionada
                        ? "selecionada"
                        : ""
                }"
                style="background: ${cor};"
                data-cor="${cor}"
                onclick="selecionarCorMeta(this, '${cor}')">
            </button>
        `)
        .join("");

    abrirModal({

        titulo,

        conteudo: `
            <div class="space-y-4">

                <div class="perfil-form-row">

                    <div class="perfil-form-group" style="max-width:80px;">
                        <label class="form-label">Emoji</label>
                        <input
                            id="metaEmoji"
                            type="text"
                            class="input"
                            maxlength="2"
                            placeholder="🎯"
                            value="${escaparHtml(
                                meta?.emoji || ""
                            )}" />
                    </div>

                    <div class="perfil-form-group" style="flex:1;">
                        <label class="form-label">Nome da meta</label>
                        <input
                            id="metaNome"
                            type="text"
                            class="input"
                            placeholder="Ex: Viagem Europa"
                            value="${escaparHtml(
                                meta?.nome || ""
                            )}" />
                    </div>

                </div>

                <div class="perfil-form-row">

                    <div class="perfil-form-group">
                        <label class="form-label">Valor alvo (R$)</label>
                        <input
                            id="metaValorAlvo"
                            type="number"
                            class="input"
                            min="0"
                            step="0.01"
                            placeholder="15000"
                            value="${meta?.valorAlvo || ""}" />
                    </div>

                    <div class="perfil-form-group">
                        <label class="form-label">Já guardado (R$)</label>
                        <input
                            id="metaValorAtual"
                            type="number"
                            class="input"
                            min="0"
                            step="0.01"
                            placeholder="0"
                            value="${meta?.valorAtual || 0}" />
                    </div>

                </div>

                <div class="perfil-form-group">
                    <label class="form-label">
                        Contribuição mensal (R$)
                        <span class="text-muted" style="font-size:11px; font-weight:400;">
                            — deixe em branco para calcular automaticamente
                        </span>
                    </label>
                    <input
                        id="metaContribuicao"
                        type="number"
                        class="input"
                        min="0"
                        step="0.01"
                        placeholder="Automático (baseado na sobra)"
                        value="${meta?.contribuicaoMensal || ""}" />
                </div>

                <div class="perfil-form-group">
                    <label class="form-label">Cor</label>
                    <div class="meta-cor-chips">
                        ${chips}
                    </div>
                    <input
                        id="metaCor"
                        type="hidden"
                        value="${corSelecionada}" />
                </div>

            </div>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                style="background:#f59e0b; border-color:#f59e0b;"
                onclick="salvarFormMeta('${
                    meta?.id || ""
                }')">
                ${meta ? "Salvar" : "Criar Meta"}
            </button>
        `
    });
}

function selecionarCorMeta(btn, cor) {

    document
        .querySelectorAll(".meta-cor-chip")
        .forEach(el =>
            el.classList.remove("selecionada")
        );

    btn.classList.add("selecionada");

    const input =
        document.getElementById("metaCor");

    if (input)
        input.value = cor;
}

function salvarFormMeta(id) {

    const nome =
        (document.getElementById("metaNome")?.value || "")
            .trim();

    const emoji =
        (document.getElementById("metaEmoji")?.value || "")
            .trim() || "🎯";

    const valorAlvo =
        parseFloat(
            document.getElementById("metaValorAlvo")?.value || "0"
        );

    const valorAtual =
        parseFloat(
            document.getElementById("metaValorAtual")?.value || "0"
        );

    const contribuicaoRaw =
        document.getElementById("metaContribuicao")?.value || "";

    const contribuicaoMensal =
        contribuicaoRaw.trim() !== ""
            ? parseFloat(contribuicaoRaw)
            : null;

    const cor =
        document.getElementById("metaCor")?.value || CORES_META[0];

    if (!nome) {

        mostrarToast(
            "Informe o nome da meta.",
            "error"
        );

        return;
    }

    if (!valorAlvo || valorAlvo <= 0) {

        mostrarToast(
            "Informe um valor alvo válido.",
            "error"
        );

        return;
    }

    const metas = obterMetas();

    if (id) {

        const idx = metas.findIndex(m => m.id === id);

        if (idx >= 0) {

            metas[idx] = {
                ...metas[idx],
                nome,
                emoji,
                valorAlvo,
                valorAtual,
                contribuicaoMensal,
                cor
            };
        }

    } else {

        metas.push({
            id: gerarId(),
            nome,
            emoji,
            valorAlvo,
            valorAtual,
            contribuicaoMensal,
            cor
        });
    }

    salvarMetas(metas);

    fecharModal();

    mostrarToast(
        id ? "Meta atualizada!" : "Meta criada!",
        "success"
    );

    renderizarListaMetas();
}

function confirmarExcluirMeta(id) {

    const metas = obterMetas();
    const meta = metas.find(m => m.id === id);

    if (!meta)
        return;

    abrirModal({

        titulo: "Excluir Meta",

        conteudo: `
            <p class="text-muted">
                Deseja excluir a meta
                <strong>${escaparHtml(meta.nome)}</strong>?
                Esta ação não pode ser desfeita.
            </p>
        `,

        footer: `
            <button
                class="btn btn-secondary"
                onclick="fecharModal()">
                Cancelar
            </button>

            <button
                class="btn btn-primary"
                style="background:var(--danger); border-color:var(--danger);"
                onclick="excluirMeta('${id}')">
                🗑️ Excluir
            </button>
        `
    });
}

function excluirMeta(id) {

    const metas =
        obterMetas().filter(m => m.id !== id);

    salvarMetas(metas);

    fecharModal();

    mostrarToast(
        "Meta excluída.",
        "success"
    );

    renderizarListaMetas();
}
