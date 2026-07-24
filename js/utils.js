// js/utils.js

function gerarId() {

    return (
        "id_" +
        Date.now() +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}

function formatarMoeda(valor) {

    return Number(valor || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}

function formatarData(data) {

    if (!data)
        return "-";

    const partes =
        data.split("-");

    if (partes.length !== 3)
        return data;

    return `
        ${partes[2]}/
        ${partes[1]}/
        ${partes[0]}
    `.replace(/\s/g, "");
}

function escaparHtml(texto) {

    const div =
        document.createElement("div");

    div.innerText = texto || "";

    return div.innerHTML;
}

function inicialNome(nome) {

    if (!nome)
        return "?";

    return nome
        .charAt(0)
        .toUpperCase();
}

function corAvatar(index) {

    const cores = [

        "#10b981",
        "#3b82f6",
        "#8b5cf6",
        "#f97316",
        "#ef4444",
        "#14b8a6",
        "#ec4899",
        "#eab308"
    ];

    return cores[
        index % cores.length
    ];
}

function atualizarTextoElemento(
    id,
    texto
) {

    const elemento =
        document.getElementById(id);

    if (!elemento)
        return;

    elemento.innerText = texto;
}

function obterMesAtual() {

    const hoje =
        new Date();

    return `
        ${hoje.getFullYear()}-
        ${String(
            hoje.getMonth() + 1
        ).padStart(2, "0")}
    `.replace(/\s/g, "");
}

function obterContasFixasMes(
    mes
) {

    return obterContasFixas()
        .filter(conta => {

            if (!conta.dataInicio)
                return true;

            return (
                conta.dataInicio <= mes
            );
        });
}

function adicionarMeses(mesAno, n) {

    const [ano, mes] =
        mesAno.split("-").map(Number);

    const data = new Date(ano, mes - 1);

    data.setMonth(data.getMonth() + n);

    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`;
}

function obterContasVariaveisMes(
    mes
) {

    return obterContasVariaveis()
        .filter(conta => {

            if (!conta.data)
                return false;

            const inicio =
                conta.data.slice(0, 7);

            if (
                conta.parcelas &&
                conta.parcelas > 1
            ) {

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

            return inicio === mes;
        });
}

function formatarMesAno(
    mesAno
) {

    if (!mesAno)
        return "-";

    const [
        ano,
        mes
    ] = mesAno.split("-");

    const meses = [

        "Janeiro",
        "Fevereiro",
        "Março",
        "Abril",
        "Maio",
        "Junho",
        "Julho",
        "Agosto",
        "Setembro",
        "Outubro",
        "Novembro",
        "Dezembro"
    ];

    return `
        ${meses[
            Number(mes) - 1
        ]} ${ano}
    `.replace(/\s+/g, " ")
     .trim();
}