function inicializarContasVariaveis() {

    renderizarContasVariaveis();
}

function abrirModalContaVariavel(
    contaId = null
) {

    const conta =
        obterContasVariaveis()
            .find(
                x =>
                    x.id === contaId
            );

    const pessoas =
        obterPessoas();

    const hoje =
        new Date()
            .toISOString()
            .slice(0, 10);

    abrirModal({

        titulo:
            conta
                ? "Editar Conta Variável"
                : "Nova Conta Variável",

        conteudo: `
            <div class="space-y-4">

                <div>

                    <label>
                        Nome
                    </label>

                    <input
                        id="nomeContaVariavelModal"
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
                        Valor Total
                    </label>

                    <input
                        id="valorContaVariavelModal"
                        type="number"
                        class="input"
                        value="
                            ${
                                conta?.valorTotal || ""
                            }
                        "
                    />

                </div>

                <div>

                    <label>
                        Categoria
                    </label>

                    <select
                        id="categoriaContaVariavelModal"
                        class="input">

                        <option value="Alimentação">
                            Alimentação
                        </option>

                        <option value="Transporte">
                            Transporte
                        </option>

                        <option value="Mercado">
                            Mercado
                        </option>

                        <option value="Lazer">
                            Lazer
                        </option>

                        <option value="Cartão">
                            Cartão
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
                        Pessoa
                    </label>

                    <select
                        id="pessoaContaVariavelModal"
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
                        Data
                    </label>

                    <input
                        id="dataContaVariavelModal"
                        type="date"
                        class="input"
                        value="${conta?.data || hoje}"
                    />

                </div>

                <div>

                    <label>
                        Parcelas
                    </label>

                    <input
                        id="parcelasContaVariavelModal"
                        type="number"
                        min="1"
                        value="
                            ${
                                conta?.parcelas || 1
                            }
                        "
                        class="input"
                    />

                </div>

                <div>

                    <label>
                        Observação
                    </label>

                    <textarea
                        id="observacaoContaVariavelModal"
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
                    salvarContaVariavelModal(
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
                "categoriaContaVariavelModal"
            ).value =
                conta.categoria;

            document.getElementById(
                "pessoaContaVariavelModal"
            ).value =
                conta.pessoaId;
        }

    }, 50);
}

function salvarContaVariavelModal(
    contaId
) {

    const nome =
        document.getElementById(
            "nomeContaVariavelModal"
        ).value.trim();

    const valorTotal =
        Number(
            document.getElementById(
                "valorContaVariavelModal"
            ).value
        );

    const categoria =
        document.getElementById(
            "categoriaContaVariavelModal"
        ).value;

    const pessoaId =
        document.getElementById(
            "pessoaContaVariavelModal"
        ).value;

    const data =
        document.getElementById(
            "dataContaVariavelModal"
        ).value;

    const parcelas =
        Number(
            document.getElementById(
                "parcelasContaVariavelModal"
            ).value
        );

    const observacao =
        document.getElementById(
            "observacaoContaVariavelModal"
        ).value;

    if (!nome) {

        mostrarToast(
            "Informe o nome.",
            "error"
        );

        return;
    }

    if (!pessoaId) {

        mostrarToast(
            "Selecione uma pessoa.",
            "error"
        );

        return;
    }

    const valorParcela =
        valorTotal / parcelas;

    const contas =
        obterContasVariaveis();

    if (contaId) {

        const conta =
            contas.find(
                x =>
                    x.id === contaId
            );

        Object.assign(conta, {

            nome,
            valorTotal,
            valorParcela,
            categoria,
            pessoaId,
            data,
            parcelas,
            observacao
        });
    }
    else {

        contas.push({

            id: gerarId(),

            nome,
            valorTotal,
            valorParcela,
            categoria,
            pessoaId,
            data,
            parcelas,
            observacao
        });
    }

    salvarContasVariaveis(
        contas
    );

    fecharModal();

    renderizarContasVariaveis();

    renderizarDashboard();

    mostrarToast(
        "Conta variável salva.",
        "success"
    );
}

function renderizarContasVariaveis() {

    const container =
        document.getElementById(
            "listaContasVariaveis"
        );

    if (!container)
        return;

    const contas =
        obterContasVariaveisMes(
            appState.mesAtual
        );

    container.innerHTML = "";

    if (contas.length === 0) {

        container.innerHTML = `
            <div class="card">

                <div class="empty-state">

                    <div class="empty-icon">
                        💳
                    </div>

                    <div class="empty-title">
                        Nenhuma conta variável
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
                                ${pessoa?.nome || ""}
                            </span>

                            <span>
                                •
                            </span>

                            <span>
                                ${formatarData(
                                    conta.data
                                )}
                            </span>

                            ${
                                conta.parcelas > 1
                                    ? `
                                        <span>
                                            •
                                        </span>

                                        <span>
                                            ${conta.parcelas}x
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
                                conta.valorParcela
                            )}

                        </div>

                        <div class="
                            text-xs
                            text-slate-400
                        ">

                            Total:
                            ${formatarMoeda(
                                conta.valorTotal
                            )}

                        </div>

                        <div class="
                            list-actions
                            mt-16
                        ">

                            <button
                                class="btn-icon"
                                onclick="
                                    abrirModalContaVariavel(
                                        '${conta.id}'
                                    )
                                ">

                                ✏️

                            </button>

                            <button
                                class="btn-icon"
                                onclick="
                                    removerContaVariavel(
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

function removerContaVariavel(
    contaId
) {

    confirmarAcao({

        titulo:
            "Remover Conta",

        mensagem:
            "Deseja remover essa conta variável?",

        confirmarTexto:
            "Remover",

        onConfirmar: () => {

            const contas =
                obterContasVariaveis()
                    .filter(
                        x =>
                            x.id !==
                            contaId
                    );

            salvarContasVariaveis(
                contas
            );

            renderizarContasVariaveis();

            renderizarDashboard();

            mostrarToast(
                "Conta removida.",
                "success"
            );
        }
    });
}