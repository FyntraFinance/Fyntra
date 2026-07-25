// js/assistente.js

let contasDetectadasIA = [];

function inicializarAssistente() {

    verificarApiKey();
}

function verificarApiKey() {

    const chave =
        obterApiKey();

    if (chave)
        return;

    abrirModalToken();
}

function configurarTokenIA() {

    abrirModalToken();
}

function abrirModalToken() {

    abrirModal({

        titulo:
            "Configurar Token da Poe",

        conteudo: `
            <div class="space-y-4">

                <p class="text-muted">

                    Informe seu token da API da Poe.

                </p>

                <input
                    id="inputApiKey"
                    type="password"
                    class="input"
                    placeholder="Cole seu token aqui"
                />

            </div>
        `,

        footer: `
            <button
                class="btn btn-primary"
                onclick="salvarChaveIA()">

                Salvar

            </button>
        `
    });
}

function salvarChaveIA() {

    const chave =
        document.getElementById(
            "inputApiKey"
        ).value.trim();

    if (!chave) {

        mostrarToast(
            "Informe a chave.",
            "error"
        );

        return;
    }

    salvarApiKey(
        chave
    );

    fecharModal();

    mostrarToast(
        "API configurada.",
        "success"
    );
}

function preencherPerguntaIA(pergunta) {

    const input =
        document.getElementById(
            "inputIA"
        );

    if (!input)
        return;

    input.value = pergunta;

    enviarPerguntaIA();
}

async function enviarPerguntaIA() {

    const input =
        document.getElementById(
            "inputIA"
        );

    const pergunta =
        input.value.trim();

    if (!pergunta)
        return;

    adicionarMensagemIA(
        pergunta,
        "usuario"
    );

    input.value = "";

    const contas =
        detectarContasTexto(
            pergunta
        );

    if (contas.length > 0) {

        contasDetectadasIA =
            contas;

        adicionarMensagemIA(
            gerarHtmlContasDetectadas(
                contas
            ),
            "ia"
        );

        return;
    }

    adicionarTypingIA();

    try {

        const resposta =
            await perguntarIA(
                pergunta
            );

        removerTypingIA();

        adicionarMensagemIA(
            resposta,
            "ia"
        );
    }
    catch {

        removerTypingIA();

        adicionarMensagemIA(
            "Erro ao comunicar com a IA.",
            "ia"
        );
    }
}

function renderMarkdown(texto) {

    const linhas =
        texto.split("\n");

    let html = "";
    let emLista = false;

    for (const linha of linhas) {

        if (linha.startsWith("### ")) {

            if (emLista) {
                html += "</ul>";
                emLista = false;
            }

            html += `<h3>${renderInline(linha.slice(4))}</h3>`;
        }
        else if (linha.startsWith("## ")) {

            if (emLista) {
                html += "</ul>";
                emLista = false;
            }

            html += `<h2>${renderInline(linha.slice(3))}</h2>`;
        }
        else if (linha.startsWith("# ")) {

            if (emLista) {
                html += "</ul>";
                emLista = false;
            }

            html += `<h1>${renderInline(linha.slice(2))}</h1>`;
        }
        else if (/^[-*] /.test(linha) || /^\d+\.\s/.test(linha)) {

            if (!emLista) {
                html += "<ul>";
                emLista = true;
            }

            const conteudo =
                linha
                    .replace(/^[-*] /, "")
                    .replace(/^\d+\.\s/, "");

            html += `<li>${renderInline(conteudo)}</li>`;
        }
        else if (linha.trim() === "") {

            if (emLista) {
                html += "</ul>";
                emLista = false;
            }
        }
        else {

            if (emLista) {
                html += "</ul>";
                emLista = false;
            }

            html += `<p>${renderInline(linha)}</p>`;
        }
    }

    if (emLista)
        html += "</ul>";

    return html;
}

function renderInline(texto) {

    return texto
        .replace(
            /\*\*(.+?)\*\*/g,
            "<strong>$1</strong>"
        )
        .replace(
            /\*(.+?)\*/g,
            "<em>$1</em>"
        );
}

function adicionarMensagemIA(
    mensagem,
    tipo
) {

    const chat =
        document.getElementById(
            "chatIA"
        );

    if (!chat)
        return;

    const isIA =
        tipo === "ia";

    const conteudo =
        isIA
            ? renderMarkdown(mensagem)
            : mensagem;

    chat.innerHTML += `
        <div class="
            ai-msg
            ${isIA ? "bot" : "user"}
        ">

            <div class="ai-msg-avatar">

                ${
                    isIA
                        ? "🤖"
                        : "👤"
                }

            </div>

            <div class="ai-msg-bubble ${isIA ? "ai-msg-markdown" : ""}">

                ${conteudo}

            </div>

        </div>
    `;

    chat.scrollTop =
        chat.scrollHeight;
}

function adicionarTypingIA() {

    const chat =
        document.getElementById(
            "chatIA"
        );

    if (!chat)
        return;

    chat.innerHTML += `
        <div
            id="typingIA"
            class="ai-msg bot">

            <div class="ai-msg-avatar">
                🤖
            </div>

            <div class="ai-msg-bubble">

                <div class="ai-typing">

                    <span></span>
                    <span></span>
                    <span></span>

                </div>

            </div>

        </div>
    `;

    chat.scrollTop =
        chat.scrollHeight;
}

function removerTypingIA() {

    document.getElementById(
        "typingIA"
    )?.remove();
}

function detectarContasTexto(
    texto
) {

    const linhas =
        texto.split("\n");

    const contas = [];

    const regex =
        /^(.+?)\s*[:\-]\s*R?\$?\s*([\d.,]+)/i;

    linhas.forEach(linha => {

        const match =
            linha
                .trim()
                .match(regex);

        if (!match)
            return;

        contas.push({

            nome:
                match[1].trim(),

            valor:
                Number(
                    match[2]
                        .replace(".", "")
                        .replace(",", ".")
                )
        });
    });

    return contas;
}

function gerarHtmlContasDetectadas(
    contas
) {

    return `
        <div class="ai-parsed-bills">

            <h4>
                📋 Contas Detectadas
            </h4>

            ${
                contas.map(conta => `
                    <div class="ai-parsed-item">

                        <span>

                            ${conta.nome}

                        </span>

                        <span>

                            ${formatarMoeda(
                                conta.valor
                            )}

                        </span>

                    </div>
                `).join("")
            }

            <button
                class="
                    btn btn-primary
                    mt-16
                "
                onclick="
                    adicionarContasDetectadas()
                ">

                Adicionar Contas

            </button>

        </div>
    `;
}

function adicionarContasDetectadas() {

    const contas =
        obterContasFixas();

    contasDetectadasIA
        .forEach(conta => {

            contas.push({

                id: gerarId(),

                nome:
                    conta.nome,

                valor:
                    conta.valor,

                categoria:
                    "Outros",

                dataInicio:
                    appState.mesAtual,

                tipo:
                    "compartilhada",

                pessoaId:
                    null,

                observacao:
                    "Adicionado via IA"
            });
        });

    salvarContasFixas(
        contas
    );

    mostrarToast(
        "Contas adicionadas.",
        "success"
    );

    contasDetectadasIA = [];
}

async function perguntarIA(
    pergunta
) {

    const chave =
        obterApiKey();

    if (!chave)
        throw new Error("Token não configurado.");

    const contexto =
        "Você é um assistente financeiro familiar.\n\n" +
        "Pessoas: " +
        JSON.stringify(obterPessoas()) + "\n\n" +
        "Contas Fixas: " +
        JSON.stringify(obterContasFixas()) + "\n\n" +
        "Contas Variáveis: " +
        JSON.stringify(obterContasVariaveis()) + "\n\n" +
        "Pergunta: " + pergunta + "\n\n" +
        "Responda em português de forma clara e objetiva.";

    const response =
        await fetch(
            "https://api.poe.com/v1/responses",
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json",

                    "Authorization":
                        `Bearer ${chave}`
                },

                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    input: contexto
                })
            }
        );

    if (!response.ok)
        throw new Error(
            `Erro ${response.status}`
        );

    const data =
        await response.json();

    const texto =
        data?.output?.[0]?.content?.[0]?.text ||
        data?.output_text ||
        data?.text ||
        "";

    return texto || "Sem resposta.";
}