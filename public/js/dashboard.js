// js/dashboard.js

function renderizarDashboard() {

    atualizarTextoMes();

    renderizarCardsDashboard();

    renderizarMetas();

    renderizarResumoPessoas();

    renderizarUltimasContas();

    renderizarGraficoCategorias();

    renderizarGraficoResumo();

    renderizarGraficoAnual();
}

function renderizarCardsDashboard() {

    const pessoas =
        obterPessoas();

    const contasFixas =
        obterContasFixasMes(
            appState.mesAtual
        );

    const contasVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        );

    const totalSalarios =
        pessoas.reduce(
            (total, pessoa) =>
                total +
                Number(
                    pessoa.salario || 0
                ),
            0
        );

    const totalFixas =
        contasFixas.reduce(
            (total, conta) =>
                total +
                Number(
                    conta.valor || 0
                ),
            0
        );

    const totalVariaveis =
        contasVariaveis.reduce(
            (total, conta) =>
                total +
                Number(
                    conta.valorParcela || 0
                ),
            0
        );

    const totalGastos =
        totalFixas +
        totalVariaveis;

    const sobra =
        totalSalarios -
        totalGastos;

    atualizarTextoElemento(
        "totalSalarios",
        formatarMoeda(
            totalSalarios
        )
    );

    atualizarTextoElemento(
        "totalContasFixas",
        formatarMoeda(
            totalFixas
        )
    );

    atualizarTextoElemento(
        "totalContasVariaveis",
        formatarMoeda(
            totalVariaveis
        )
    );

    atualizarTextoElemento(
        "totalGastos",
        formatarMoeda(
            totalGastos
        )
    );

    atualizarTextoElemento(
        "sobraFamiliar",
        formatarMoeda(
            sobra
        )
    );
}

function renderizarResumoPessoas() {

    const container =
        document.getElementById(
            "dashboardPessoas"
        );

    if (!container)
        return;

    const pessoas =
        obterPessoas();

    const contasFixas =
        obterContasFixasMes(
            appState.mesAtual
        );

    const contasVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        );

    container.innerHTML = "";

    if (pessoas.length === 0) {

        container.innerHTML = `
            <div class="text-slate-400">
                Nenhuma pessoa cadastrada.
            </div>
        `;

        return;
    }

    pessoas.forEach(
        (pessoa, index) => {

            let gastos = 0;

            contasFixas.forEach(
                conta => {

                    if (
                        conta.tipo ===
                        "individual"
                    ) {

                        if (
                            conta.pessoaId ===
                            pessoa.id
                        ) {

                            gastos +=
                                Number(
                                    conta.valor || 0
                                );
                        }
                    }
                    else {

                        gastos +=
                            Number(
                                conta.valor || 0
                            ) /
                            pessoas.length;
                    }
                }
            );

            contasVariaveis.forEach(
                conta => {

                    if (
                        conta.pessoaId ===
                        pessoa.id
                    ) {

                        gastos +=
                            Number(
                                conta.valorParcela || 0
                            );
                    }
                }
            );

            const sobra =
                pessoa.salario -
                gastos;

            const livreDia =
                sobra / 30;

            container.innerHTML += `
                <div class="card">

                    <div class="
                        flex items-center
                        gap-4 mb-4
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
                                font-bold
                            ">

                                ${pessoa.nome}

                            </div>

                            <div class="
                                text-sm
                                text-slate-400
                            ">

                                ${formatarMoeda(
                                    pessoa.salario
                                )}

                            </div>

                        </div>

                    </div>

                    <div class="
                        space-y-2 text-sm
                    ">

                        <div class="
                            flex-between
                        ">

                            <span>
                                Gastos
                            </span>

                            <strong class="
                                text-red-400
                            ">

                                ${formatarMoeda(
                                    gastos
                                )}

                            </strong>

                        </div>

                        <div class="
                            flex-between
                        ">

                            <span>
                                Sobra
                            </span>

                            <strong class="
                                text-emerald-400
                            ">

                                ${formatarMoeda(
                                    sobra
                                )}

                            </strong>

                        </div>

                        <div class="
                            flex-between
                        ">

                            <span>
                                Livre por dia
                            </span>

                            <strong>

                                ${formatarMoeda(
                                    livreDia
                                )}

                            </strong>

                        </div>

                    </div>

                </div>
            `;
        }
    );
}

function renderizarMetas() {

    const container =
        document.getElementById(
            "dashboardMetas"
        );

    const secao =
        document.getElementById(
            "secaoMetas"
        );

    if (!container)
        return;

    const metas = obterMetas();

    if (metas.length === 0) {

        if (secao)
            secao.style.display = "none";

        return;
    }

    if (secao)
        secao.style.display = "";

    const pessoas =
        obterPessoas();

    const totalSalarios =
        pessoas.reduce(
            (t, p) =>
                t + Number(p.salario || 0),
            0
        );

    const totalFixas =
        obterContasFixasMes(
            appState.mesAtual
        ).reduce(
            (t, c) =>
                t + Number(c.valor || 0),
            0
        );

    const totalVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        ).reduce(
            (t, c) =>
                t + Number(c.valorParcela || 0),
            0
        );

    const sobra =
        Math.max(
            0,
            totalSalarios -
            totalFixas -
            totalVariaveis
        );

    const metasAuto =
        metas.filter(
            m => !m.contribuicaoMensal
        );

    const contribuicaoAutoValor =
        metasAuto.length > 0
            ? sobra / metasAuto.length
            : 0;

    container.innerHTML = metas
        .map(meta => {

            const contribuicao =
                meta.contribuicaoMensal ||
                contribuicaoAutoValor;

            const faltando =
                Math.max(
                    0,
                    meta.valorAlvo -
                    meta.valorAtual
                );

            const pct =
                Math.min(
                    100,
                    Math.round(
                        (meta.valorAtual /
                        meta.valorAlvo) *
                        100
                    )
                );

            const mesesRestantes =
                contribuicao > 0
                    ? Math.ceil(
                        faltando / contribuicao
                      )
                    : null;

            const dataConclusao =
                mesesRestantes !== null
                    ? adicionarMeses(
                        appState.mesAtual,
                        mesesRestantes
                      )
                    : null;

            const cor =
                meta.cor || "#10b981";

            const isAuto =
                !meta.contribuicaoMensal;

            const concluida =
                meta.valorAtual >=
                meta.valorAlvo;

            return `
                <div class="card meta-dash-card">

                    <div class="meta-dash-top">

                        <div
                            class="meta-dash-emoji"
                            style="background:${cor}22; color:${cor};">
                            ${escaparHtml(
                                meta.emoji || "🎯"
                            )}
                        </div>

                        <div class="meta-dash-info">

                            <div class="meta-dash-nome">
                                ${escaparHtml(
                                    meta.nome
                                )}
                            </div>

                            <div class="meta-dash-valores">
                                <span style="color:${cor}; font-weight:700;">
                                    ${formatarMoeda(
                                        meta.valorAtual
                                    )}
                                </span>
                                <span class="text-muted">
                                    / ${formatarMoeda(
                                        meta.valorAlvo
                                    )}
                                </span>
                            </div>

                        </div>

                        <div
                            class="meta-dash-pct"
                            style="color:${cor};">
                            ${pct}%
                        </div>

                    </div>

                    <div class="meta-dash-track">
                        <div
                            class="meta-dash-bar"
                            style="width:${pct}%; background:${cor};">
                        </div>
                    </div>

                    <div class="meta-dash-stats">

                        <div class="meta-stat-item">
                            <span class="meta-stat-label">
                                Guardar/mês
                            </span>
                            <span class="meta-stat-val">
                                ${formatarMoeda(
                                    contribuicao
                                )}
                                ${isAuto
                                    ? `<span class="meta-auto-badge">auto</span>`
                                    : ""
                                }
                            </span>
                        </div>

                        <div class="meta-stat-item">
                            <span class="meta-stat-label">
                                Conclusão
                            </span>
                            <span class="meta-stat-val">
                                ${concluida
                                    ? `<span style="color:#10b981;">✅ Concluída!</span>`
                                    : dataConclusao
                                        ? formatarMesAno(dataConclusao)
                                        : `<span class="text-muted">—</span>`
                                }
                            </span>
                        </div>

                    </div>

                </div>
            `;
        })
        .join("");
}

function renderizarUltimasContas() {

    const container =
        document.getElementById(
            "dashboardMovimentacoes"
        );

    if (!container)
        return;

    const contas = [

        ...obterContasFixasMes(
            appState.mesAtual
        ),

        ...obterContasVariaveisMes(
            appState.mesAtual
        )
    ];

    container.innerHTML = "";

    if (contas.length === 0) {

        container.innerHTML = `
            <div class="text-slate-400">
                Nenhuma conta encontrada.
            </div>
        `;

        return;
    }

    contas
        .slice(-6)
        .reverse()
        .forEach(conta => {

            container.innerHTML += `
                <div class="
                    flex-between
                    border-b
                    border-slate-800
                    pb-3
                ">

                    <div>

                        <div class="
                            font-semibold
                        ">

                            ${conta.nome}

                        </div>

                        <div class="
                            text-xs
                            text-slate-400
                        ">

                            ${
                                conta.categoria
                                || "Outros"
                            }

                        </div>

                    </div>

                    <strong class="
                        text-red-400
                    ">

                        ${formatarMoeda(
                            conta.valor
                            || conta.valorParcela
                        )}

                    </strong>

                </div>
            `;
        });
}