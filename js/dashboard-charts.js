// js/dashboard-charts.js

function renderizarGraficosDashboard() {

    destruirGraficos();

    renderizarGraficoCategorias();

    renderizarGraficoResumo();
}

function destruirGraficos() {

    Object.values(
        appState.charts
    ).forEach(chart => {

        if (
            chart &&
            typeof chart.destroy
            === "function"
        ) {

            chart.destroy();
        }
    });

    appState.charts = {};
}

function renderizarGraficoCategorias() {

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (!canvas)
        return;

    const categorias = {};

    obterContasFixasMes(
        appState.mesAtual
    ).forEach(conta => {

        categorias[
            conta.categoria
        ] =
            (
                categorias[
                    conta.categoria
                ] || 0
            ) + Number(
                conta.valor || 0
            );
    });

    obterContasVariaveisMes(
        appState.mesAtual
    ).forEach(conta => {

        categorias[
            conta.categoria
        ] =
            (
                categorias[
                    conta.categoria
                ] || 0
            ) + Number(
                conta.valorParcela || 0
            );
    });

    const labels =
        Object.keys(categorias);

    const valores =
        Object.values(categorias);

    if (labels.length === 0)
        return;

    appState.charts.categorias =
        new Chart(
            canvas,
            {
                type: "doughnut",

                data: {

                    labels,

                    datasets: [
                        {
                            data: valores,

                            backgroundColor: [
                                "#10b981",
                                "#6366f1",
                                "#f59e0b",
                                "#ef4444",
                                "#06b6d4",
                                "#ec4899",
                                "#8b5cf6"
                            ],

                            borderWidth: 0
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {

                            position: "bottom"
                        }
                    }
                }
            }
        );
}

function renderizarGraficoResumo() {

    const canvas =
        document.getElementById(
            "graficoResumo"
        );

    if (!canvas)
        return;

    const pessoas =
        obterPessoas();

    const totalSalarios =
        pessoas.reduce(
            (total, pessoa) =>
                total + Number(
                    pessoa.salario || 0
                ),
            0
        );

    const totalFixas =
        obterContasFixasMes(
            appState.mesAtual
        )
        .reduce(
            (total, conta) =>
                total + Number(
                    conta.valor || 0
                ),
            0
        );

    const totalVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        )
        .reduce(
            (total, conta) =>
                total + Number(
                    conta.valorParcela || 0
                ),
            0
        );

    const sobra =
        totalSalarios -
        (
            totalFixas +
            totalVariaveis
        );

    appState.charts.resumo =
        new Chart(
            canvas,
            {
                type: "bar",

                data: {

                    labels: [
                        "Salários",
                        "Fixas",
                        "Variáveis",
                        "Sobra"
                    ],

                    datasets: [
                        {
                            data: [
                                totalSalarios,
                                totalFixas,
                                totalVariaveis,
                                sobra
                            ],

                            backgroundColor: [
                                "#10b981",
                                "#f59e0b",
                                "#6366f1",
                                "#06b6d4"
                            ],

                            borderRadius: 10
                        }
                    ]
                },

                options: {

                    responsive: true,

                    maintainAspectRatio: false,

                    plugins: {

                        legend: {
                            display: false
                        }
                    }
                }
            }
        );
}

function renderizarGraficoAnual() {

    const canvas =
        document.getElementById(
            "graficoAnual"
        );

    if (!canvas)
        return;

    if (appState.charts.anual) {

        appState.charts.anual.destroy();

        appState.charts.anual = null;
    }

    const anoAtual =
        appState.mesAtual.split("-")[0];

    const meses =
        Array.from(
            { length: 12 },
            (_, i) =>
                `${anoAtual}-${
                    String(i + 1)
                        .padStart(2, "0")
                }`
        );

    const pessoas =
        obterPessoas();

    const totalSalarios =
        pessoas.reduce(
            (t, p) =>
                t + Number(p.salario || 0),
            0
        );

    const gastosPorMes =
        meses.map(mes => {

            const fixas =
                obterContasFixasMes(mes)
                    .reduce(
                        (t, c) =>
                            t + Number(
                                c.valor || 0
                            ),
                        0
                    );

            const variaveis =
                obterContasVariaveisMes(mes)
                    .reduce(
                        (t, c) =>
                            t + Number(
                                c.valorParcela || 0
                            ),
                        0
                    );

            return fixas + variaveis;
        });

    const sobraPorMes =
        gastosPorMes.map(
            g => totalSalarios - g
        );

    const labels = [
        "Jan", "Fev", "Mar", "Abr",
        "Mai", "Jun", "Jul", "Ago",
        "Set", "Out", "Nov", "Dez"
    ];

    const isDark = true;

    const gridColor =
        "rgba(255,255,255,0.06)";

    const tickColor =
        "#64748b";

    appState.charts.anual =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels,

                datasets: [
                    {
                        label: "Salários",

                        data: meses.map(
                            () => totalSalarios
                        ),

                        backgroundColor:
                            "rgba(16,185,129,0.25)",

                        borderColor:
                            "#10b981",

                        borderWidth: 2,

                        borderRadius: 6,

                        type: "line",

                        fill: false,

                        tension: 0,

                        pointRadius: 3,

                        pointBackgroundColor:
                            "#10b981",

                        order: 0
                    },
                    {
                        label: "Gastos",

                        data: gastosPorMes,

                        backgroundColor:
                            "rgba(239,68,68,0.6)",

                        borderColor:
                            "#ef4444",

                        borderWidth: 0,

                        borderRadius: 6,

                        order: 1
                    },
                    {
                        label: "Sobra",

                        data: sobraPorMes,

                        backgroundColor:
                            "rgba(6,182,212,0.6)",

                        borderColor:
                            "#06b6d4",

                        borderWidth: 0,

                        borderRadius: 6,

                        order: 2
                    }
                ]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                interaction: {

                    mode: "index",

                    intersect: false
                },

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            color: tickColor,

                            usePointStyle: true,

                            padding: 16
                        }
                    },

                    tooltip: {

                        callbacks: {

                            label: ctx =>
                                ` ${ctx.dataset.label}: ${
                                    formatarMoeda(ctx.raw)
                                }`
                        }
                    }
                },

                scales: {

                    x: {

                        grid: {
                            color: gridColor
                        },

                        ticks: {
                            color: tickColor
                        }
                    },

                    y: {

                        grid: {
                            color: gridColor
                        },

                        ticks: {

                            color: tickColor,

                            callback: v =>
                                "R$ " +
                                Number(v)
                                    .toLocaleString(
                                        "pt-BR"
                                    )
                        }
                    }
                }
            }
        });
}

function obterContasFixasMes(
    mes
) {

    return obterContasFixas()
        .filter(conta => {

            if (
                !conta.dataInicio
            ) {
                return true;
            }

            return (
                conta.dataInicio
                    .slice(0, 7)
                <= mes
            );
        });
}

function obterContasVariaveisMes(
    mes
) {

    return obterContasVariaveis()
        .filter(conta => {

            if (
                conta.parcelado
            ) {

                const inicio =
                    conta.data
                        .slice(0, 7);

                const fim =
                    adicionarMeses(
                        inicio,
                        conta.parcelas - 1
                    );

                return (
                    mes >= inicio &&
                    mes <= fim
                );
            }

            return (
                conta.data
                    .slice(0, 7)
                === mes
            );
        });
}