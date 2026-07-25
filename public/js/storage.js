// js/storage.js

const STORAGE_KEYS = {

    pessoas:
        "financas_pessoas",

    contasFixas:
        "financas_contas_fixas",

    contasVariaveis:
        "financas_contas_variaveis",

    configuracoes:
        "financas_configuracoes",

    apiKey:
        "financas_poe_api_key",

    metas:
        "financas_metas"
};

function iniciarStorage() {

    Object
        .values(STORAGE_KEYS)
        .forEach(chave => {

            if (
                localStorage
                    .getItem(chave)
            ) {
                return;
            }

            let valorInicial = [];

            if (
                chave ===
                STORAGE_KEYS.configuracoes
            ) {

                valorInicial = {
                    divisaoPorSalario: false,
                    tema: "dark"
                };
            }

            if (
                chave ===
                STORAGE_KEYS.apiKey
            ) {
                return;
            }

            if (
                chave ===
                STORAGE_KEYS.metas
            ) {
                valorInicial = [];
            }

            localStorage.setItem(
                chave,
                JSON.stringify(
                    valorInicial
                )
            );
        });
}

function parseSeguro(
    valor,
    fallback
) {

    try {

        return JSON.parse(valor)
            || fallback;
    }
    catch {

        return fallback;
    }
}

//
// PESSOAS
//

function obterPessoas() {

    return parseSeguro(
        localStorage.getItem(
            STORAGE_KEYS.pessoas
        ),
        []
    );
}

function salvarPessoas(lista) {

    localStorage.setItem(
        STORAGE_KEYS.pessoas,
        JSON.stringify(lista)
    );
}

//
// CONTAS FIXAS
//

function obterContasFixas() {

    return parseSeguro(
        localStorage.getItem(
            STORAGE_KEYS.contasFixas
        ),
        []
    );
}

function salvarContasFixas(lista) {

    localStorage.setItem(
        STORAGE_KEYS.contasFixas,
        JSON.stringify(lista)
    );
}

//
// CONTAS VARIÁVEIS
//

function obterContasVariaveis() {

    return parseSeguro(
        localStorage.getItem(
            STORAGE_KEYS.contasVariaveis
        ),
        []
    );
}

function salvarContasVariaveis(lista) {

    localStorage.setItem(
        STORAGE_KEYS.contasVariaveis,
        JSON.stringify(lista)
    );
}

//
// CONFIGURAÇÕES
//

function obterConfiguracoes() {

    return parseSeguro(
        localStorage.getItem(
            STORAGE_KEYS.configuracoes
        ),
        {}
    );
}

function salvarConfiguracoes(
    configuracoes
) {

    localStorage.setItem(
        STORAGE_KEYS.configuracoes,
        JSON.stringify(
            configuracoes
        )
    );
}

//
// METAS
//

function obterMetas() {

    return parseSeguro(
        localStorage.getItem(
            STORAGE_KEYS.metas
        ),
        []
    );
}

function salvarMetas(lista) {

    localStorage.setItem(
        STORAGE_KEYS.metas,
        JSON.stringify(lista)
    );
}

//
// API KEY
//

function obterApiKey() {

    return localStorage.getItem(
        STORAGE_KEYS.apiKey
    );
}

function salvarApiKey(chave) {

    localStorage.setItem(
        STORAGE_KEYS.apiKey,
        chave
    );
}

//
// EXPORTAR DADOS
//

function exportarDados() {

    const dados = {

        versao: 1,

        exportadoEm:
            new Date()
                .toISOString(),

        pessoas:
            obterPessoas(),

        contasFixas:
            obterContasFixas(),

        contasVariaveis:
            obterContasVariaveis(),

        configuracoes:
            obterConfiguracoes(),

        metas:
            obterMetas()
    };

    const blob =
        new Blob(
            [
                JSON.stringify(
                    dados,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement("a");

    a.href = url;

    a.download = `
        financas_${
            obterMesAtual()
        }.json
    `.trim();

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

//
// IMPORTAR DADOS
//

function importarDados(
    dados
) {

    if (!dados)
        return false;

    if (
        dados.pessoas
    ) {

        salvarPessoas(
            dados.pessoas
        );
    }

    if (
        dados.contasFixas
    ) {

        salvarContasFixas(
            dados.contasFixas
        );
    }

    if (
        dados.contasVariaveis
    ) {

        salvarContasVariaveis(
            dados.contasVariaveis
        );
    }

    if (
        dados.configuracoes
    ) {

        salvarConfiguracoes(
            dados.configuracoes
        );
    }

    if (
        dados.metas
    ) {

        salvarMetas(
            dados.metas
        );
    }

    return true;
}

iniciarStorage();