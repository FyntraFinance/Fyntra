// js/charts.js

let charts = {};

function destruirCharts() {

    Object.keys(charts)
        .forEach(key => {

            if (charts[key]) {

                charts[key].destroy();
            }
        });

    charts = {};
}

function renderizarGraficoAnual() {

    const canvas =
        document.getElementById(
            "graficoAnual"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    if (charts.anual) {

        charts.anual.destroy();

        charts.anual = null;
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
            g => Math.max(0, totalSalarios - g)
        );

    const labels = [
        "Jan", "Fev", "Mar", "Abr",
        "Mai", "Jun", "Jul", "Ago",
        "Set", "Out", "Nov", "Dez"
    ];

    const gridColor =
        "rgba(255,255,255,0.06)";

    const tickColor =
        "#64748b";

    charts.anual =
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

                        type: "line",

                        borderColor: "#10b981",

                        backgroundColor:
                            "rgba(16,185,129,0)",

                        borderWidth: 2,

                        pointRadius: 4,

                        pointBackgroundColor:
                            "#10b981",

                        fill: false,

                        tension: 0,

                        order: 0
                    },
                    {
                        label: "Gastos",

                        data: gastosPorMes,

                        backgroundColor:
                            "rgba(239,68,68,0.65)",

                        borderWidth: 0,

                        borderRadius: 6,

                        order: 1
                    },
                    {
                        label: "Sobra",

                        data: sobraPorMes,

                        backgroundColor:
                            "rgba(6,182,212,0.65)",

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

function renderizarGraficoCategorias() {

    const canvas =
        document.getElementById(
            "graficoCategorias"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

    destruirCharts();

    const categorias = {};

    const contasFixas =
        obterContasFixasMes(
            appState.mesAtual
        );

    const contasVariaveis =
        obterContasVariaveisMes(
            appState.mesAtual
        );

    contasFixas.forEach(conta => {

        const categoria =
            conta.categoria ||
            "Outros";

        categorias[categoria] = (

            categorias[categoria] || 0

        ) + Number(
            conta.valor || 0
        );
    });

    contasVariaveis.forEach(conta => {

        const categoria =
            conta.categoria ||
            "Outros";

        categorias[categoria] = (

            categorias[categoria] || 0

        ) + Number(
            conta.valorParcela || 0
        );
    });

    const labels =
        Object.keys(categorias);

    const valores =
        Object.values(categorias);

    charts.categorias =
        new Chart(canvas, {

            type: "doughnut",

            data: {

                labels,

                datasets: [{

                    data: valores,

                    borderWidth: 0,

                    hoverOffset: 8
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            color:
                                "#94a3b8"
                        }
                    }
                }
            }
        });
}

function renderizarGraficoResumo() {

    const canvas =
        document.getElementById(
            "graficoResumo"
        );

    if (
        !canvas ||
        typeof Chart === "undefined"
    ) {
        return;
    }

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
            (total, pessoa) => {

                return (
                    total +
                    Number(
                        pessoa.salario || 0
                    )
                );
            },
            0
        );

    const totalFixas =
        contasFixas.reduce(
            (total, conta) => {

                return (
                    total +
                    Number(
                        conta.valor || 0
                    )
                );
            },
            0
        );

    const totalVariaveis =
        contasVariaveis.reduce(
            (total, conta) => {

                return (
                    total +
                    Number(
                        conta.valorParcela || 0
                    )
                );
            },
            0
        );

    const sobra =
        totalSalarios -
        (
            totalFixas +
            totalVariaveis
        );

    charts.resumo =
        new Chart(canvas, {

            type: "bar",

            data: {

                labels: [

                    "Salários",
                    "Fixas",
                    "Variáveis",
                    "Sobra"
                ],

                datasets: [{

                    data: [

                        totalSalarios,

                        totalFixas,

                        totalVariaveis,

                        sobra > 0
                            ? sobra
                            : 0
                    ],

                    borderRadius: 12
                }]
            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        display: false
                    }
                },

                scales: {

                    y: {

                        ticks: {

                            color:
                                "#94a3b8"
                        },

                        grid: {

                            color:
                                "rgba(255,255,255,.05)"
                        }
                    },

                    x: {

                        ticks: {

                            color:
                                "#94a3b8"
                        },

                        grid: {

                            display: false
                        }
                    }
                }
            }
        });
}