function renderizarPessoas() {

    const container =
        document.getElementById(
            "listaPessoas"
        );

    if (!container)
        return;

    const pessoas =
        obterPessoas();

    container.innerHTML = "";

    if (pessoas.length === 0) {

        container.innerHTML = `
            <div class="card">

                <div class="empty-state">

                    <div class="empty-icon">
                        👥
                    </div>

                    <div class="empty-title">
                        Nenhuma pessoa cadastrada
                    </div>

                </div>

            </div>
        `;

        return;
    }

    pessoas.forEach((pessoa, index) => {

        container.innerHTML += `
            <div class="card">

                <div class="
                    flex-between
                ">

                    <div class="
                        flex items-center
                        gap-12
                    ">

                        <div
                            class="person-avatar"
                            style="
                                background:
                                ${corAvatar(index)};
                            ">

                            ${inicialNome(
                                pessoa.nome
                            )}

                        </div>

                        <div>

                            <div class="
                                list-title
                            ">

                                ${escaparHtml(
                                    pessoa.nome
                                )}

                            </div>

                            <div class="
                                list-sub
                            ">

                                Salário:
                                ${formatarMoeda(
                                    pessoa.salario
                                )}

                            </div>

                        </div>

                    </div>

                    <div class="
                        list-actions
                    ">

                        <button
                            class="btn-icon"
                            onclick="
                                abrirModalPessoa(
                                    '${pessoa.id}'
                                )
                            ">

                            ✏️

                        </button>

                        <button
                            class="btn-icon"
                            onclick="
                                removerPessoa(
                                    '${pessoa.id}'
                                )
                            ">

                            🗑️

                        </button>

                    </div>

                </div>

            </div>
        `;
    });
}

function abrirModalPessoa(
    pessoaId = null
) {

    const pessoa =
        obterPessoas()
            .find(
                x =>
                    x.id === pessoaId
            );

    abrirModal({

        titulo:
            pessoa
                ? "Editar Pessoa"
                : "Nova Pessoa",

        conteudo: `
            <div class="space-y-4">

                <div>

                    <label>
                        Nome
                    </label>

                    <input
                        id="nomePessoaModal"
                        type="text"
                        class="input"
                        value="
                            ${
                                pessoa?.nome || ""
                            }
                        "
                    />

                </div>

                <div>

                    <label>
                        Salário
                    </label>

                    <input
                        id="salarioPessoaModal"
                        type="number"
                        class="input"
                        value="
                            ${
                                pessoa?.salario || ""
                            }
                        "
                    />

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
                    salvarPessoaModal(
                        '${
                            pessoaId || ""
                        }'
                    )
                ">

                Salvar

            </button>
        `
    });
}

function salvarPessoaModal(
    pessoaId
) {

    const nome =
        document.getElementById(
            "nomePessoaModal"
        ).value.trim();

    const salario =
        Number(
            document.getElementById(
                "salarioPessoaModal"
            ).value
        );

    if (!nome) {

        mostrarToast(
            "Informe o nome.",
            "error"
        );

        return;
    }

    const pessoas =
        obterPessoas();

    if (pessoaId) {

        const pessoa =
            pessoas.find(
                x =>
                    x.id === pessoaId
            );

        pessoa.nome = nome;

        pessoa.salario = salario;
    }
    else {

        pessoas.push({

            id: gerarId(),

            nome,

            salario
        });
    }

    salvarPessoas(
        pessoas
    );

    fecharModal();

    renderizarPessoas();

    renderizarDashboard();

    mostrarToast(
        "Pessoa salva.",
        "success"
    );
}

function removerPessoa(
    pessoaId
) {

    confirmarAcao({

        titulo:
            "Remover Pessoa",

        mensagem:
            "Deseja remover essa pessoa?",

        confirmarTexto:
            "Remover",

        onConfirmar: () => {

            const pessoas =
                obterPessoas()
                    .filter(
                        x =>
                            x.id !==
                            pessoaId
                    );

            salvarPessoas(
                pessoas
            );

            renderizarPessoas();

            renderizarDashboard();

            mostrarToast(
                "Pessoa removida.",
                "success"
            );
        }
    });
}