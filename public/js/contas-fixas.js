function inicializarContasFixas() {

    renderizarContasFixas();
}

function abrirModalContaFixa(
    contaId = null
) {

    const conta =
        obterContasFixas()
            .find(
                x =>
                    x.id === contaId
            );

    const pessoas =
        obterPessoas();

    abrirModal({

        titulo:
            conta
                ? "Editar Conta Fixa"
                : "Nova Conta Fixa",

        conteudo: `
            <div class="space-y-4">

                <div>

                    <label>
                        Nome
                    </label>

                    <input
                        id="nomeContaFixaModal"
                        type="text"
                        class="input"
                        value="
                            ${
                                conta?.nome || ""
                            }
                        "
                    />

                </div>

                <div>

                    <label>
                        Valor
                    </label>

                    <input
                        id="valorContaFixaModal"
                        type="number"
                        class="input"
                        value="
                            ${
                                conta?.valor || ""
                            }
                        "
                    />

                </div>

                <div>

                    <label>
                        Categoria
                    </label>

                    <select
                        id="categoriaContaFixaModal"
                        class="input">

                        <option value="Moradia">
                            Moradia
                        </option>

                        <option value="Internet">
                            Internet
                        </option>

                        <option value="Energia">
                            Energia
                        </option>

                        <option value="Água">
                            Água
                        </option>

                        <option value="Streaming">
                            Streaming
                        </option>

                        <option value="Saúde">
                            Saúde
                        </option>

                        <option value="Outros">
                            Outros
                        </option>

                    </select>

                </div>

                <div>

                    <label>
                        Tipo
                    </label>

                    <select
                        id="tipoContaFixaModal"
                        class="input"
                        onchange="
                            alterarTipoContaFixaModal()
                        ">

                        <option value="compartilhada">
                            Compartilhada
                        </option>

                        <option value="individual">
                            Individual
                        </option>

                    </select>

                </div>

                <div
                    id="containerPessoaContaFixaModal"
                    class="hidden">

                    <label>
                        Pessoa
                    </label>

                    <select
                        id="pessoaContaFixaModal"
                        class="input">

                        <option value="">
                            Selecione
                        </option>

                        ${
                            pessoas.map(pessoa => `
                                <option
                                    value="${pessoa.id}">

                                    ${pessoa.nome}

                                </option>
                            `).join("")
                        }

                    </select>

                </div>

                <div>

                    <label>
                        Data Inicial
                    </label>

                    <input
                        id="dataContaFixaModal"
                        type="month"
                        class="input"
                        value="
                            ${
                                conta?.dataInicio
                                || appState.mesAtual
                            }
                        "
                    />

                </div>

                <div>

                    <label>
                        Observação
                    </label>

                    <textarea
                        id="observacaoContaFixaModal"
                        class="input">

                        ${
                            conta?.observacao || ""
                        }

                    </textarea>

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
                onclick="
                    salvarContaFixaModal(
                        '${
                            contaId || ""
                        }'
                    )
                ">

                Salvar

            </button>
        `
    });

    setTimeout(() => {

        if (conta) {

            document.getElementById(
                "categoriaContaFixaModal"
            ).value =
                conta.categoria;

            document.getElementById(
                "tipoContaFixaModal"
            ).value =
                conta.tipo;

            if (
                conta.tipo ===
                "individual"
            ) {

                alterarTipoContaFixaModal();

                document.getElementById(
                    "pessoaContaFixaModal"
                ).value =
                    conta.pessoaId;
            }
        }

    }, 50);
}

function alterarTipoContaFixaModal() {

    const tipo =
        document.getElementById(
            "tipoContaFixaModal"
        ).value;

    const container =
        document.getElementById(
            "containerPessoaContaFixaModal"
        );

    if (
        tipo === "individual"
    ) {

        container.classList.remove(
            "hidden"
        );

        return;
    }

    container.classList.add(
        "hidden"
    );
}

function salvarContaFixaModal(
    contaId
) {

    const nome =
        document.getElementById(
            "nomeContaFixaModal"
        ).value.trim();

    const valor =
        Number(
            document.getElementById(
                "valorContaFixaModal"
            ).value
        );

    const categoria =
        document.getElementById(
            "categoriaContaFixaModal"
        ).value;

    const tipo =
        document.getElementById(
            "tipoContaFixaModal"
        ).value;

    const pessoaId =
        document.getElementById(
            "pessoaContaFixaModal"
        )?.value || null;

    const dataInicio =
        document.getElementById(
            "dataContaFixaModal"
        ).value;

    const observacao =
        document.getElementById(
            "observacaoContaFixaModal"
        ).value;

    if (!nome) {

        mostrarToast(
            "Informe o nome.",
            "error"
        );

        return;
    }

    const contas =
        obterContasFixas();

    if (contaId) {

        const conta =
            contas.find(
                x =>
                    x.id === contaId
            );

        Object.assign(conta, {

            nome,
            valor,
            categoria,
            tipo,
            pessoaId,
            dataInicio,
            observacao
        });
    }
    else {

        contas.push({

            id: gerarId(),

            nome,
            valor,
            categoria,
            tipo,
            pessoaId,
            dataInicio,
            observacao
        });
    }

    salvarContasFixas(
        contas
    );

    fecharModal();

    renderizarContasFixas();

    renderizarDashboard();

    mostrarToast(
        "Conta fixa salva.",
        "success"
    );
}

function renderizarContasFixas() {

    const container =
        document.getElementById(
            "listaContasFixas"
        );

    if (!container)
        return;

    const contas =
        obterContasFixasMes(
            appState.mesAtual
        );

    container.innerHTML = "";

    if (contas.length === 0) {

        container.innerHTML = `
            <div class="card">

                <div class="empty-state">

                    <div class="empty-icon">
                        🏠
                    </div>

                    <div class="empty-title">
                        Nenhuma conta fixa
                    </div>

                </div>

            </div>
        `;

        return;
    }

    contas.forEach(conta => {

        const pessoa =
            obterPessoas()
                .find(
                    x =>
                        x.id ===
                        conta.pessoaId
                );

        container.innerHTML += `
            <div class="card">

                <div class="
                    flex-between
                ">

                    <div>

                        <div class="
                            list-title
                        ">

                            ${conta.nome}

                        </div>

                        <div class="
                            list-sub
                        ">

                            <span>
                                ${conta.categoria}
                            </span>

                            <span>
                                •
                            </span>

                            <span>
                                ${conta.tipo}
                            </span>

                            ${
                                pessoa
                                    ? `
                                        <span>
                                            •
                                        </span>

                                        <span>
                                            ${pessoa.nome}
                                        </span>
                                    `
                                    : ""
                            }

                        </div>

                    </div>

                    <div class="
                        text-right
                    ">

                        <div class="
                            list-amount
                        ">

                            ${formatarMoeda(
                                conta.valor
                            )}

                        </div>

                        <div class="
                            list-actions
                            mt-16
                        ">

                            <button
                                class="btn-icon"
                                onclick="
                                    abrirModalContaFixa(
                                        '${conta.id}'
                                    )
                                ">

                                ✏️

                            </button>

                            <button
                                class="btn-icon"
                                onclick="
                                    removerContaFixa(
                                        '${conta.id}'
                                    )
                                ">

                                🗑️

                            </button>

                        </div>

                    </div>

                </div>

            </div>
        `;
    });
}

function removerContaFixa(
    contaId
) {

    confirmarAcao({

        titulo:
            "Remover Conta",

        mensagem:
            "Deseja remover essa conta fixa?",

        confirmarTexto:
            "Remover",

        onConfirmar: () => {

            const contas =
                obterContasFixas()
                    .filter(
                        x =>
                            x.id !==
                            contaId
                    );

            salvarContasFixas(
                contas
            );

            renderizarContasFixas();

            renderizarDashboard();

            mostrarToast(
                "Conta removida.",
                "success"
            );
        }
    });
}