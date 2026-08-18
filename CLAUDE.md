# Fyntra

App de finanças familiares. Cada família é um workspace: pessoas, contas fixas
e variáveis, ganhos extras, eventos com rateio e metas. A equipe de
contabilidade acompanha de fora, pelo Painel Contábil, e só quando a família
autoriza.

Next.js 15 (App Router) · React 19 · TypeScript · Prisma + PostgreSQL (Neon) ·
NextAuth · CSS próprio em `src/app/globals.css` · deploy na Vercel.

## Regra do changelog — obrigatória

**Toda alteração que o usuário percebe entra no changelog, na mesma
alteração.** Funcionalidade nova, mudança de comportamento, correção visível:
se muda o que a pessoa vê ou faz, vira uma entrada. Sem entrada, a atualização
não existe para quem usa o app.

Como fazer:

1. Abra `src/lib/changelog.ts`.
2. Acrescente uma entrada **no topo** do array `CHANGELOG`:

```ts
{
  data: "2026-08-18",        // YYYY-MM-DD, a data da atualização
  titulo: "Resumo curto",    // é o que aparece fechado e abre ao clicar
  itens: [
    "O que mudou, em linguagem de usuário.",
    "Uma frase por mudança.",
  ],
}
```

O que a Central de Ajuda faz com isso: a aba **Novidades** lista as entradas
da mais recente para a mais antiga, mostrando data e título; clicar no título
abre os `itens`. Uma bolinha vermelha no botão de ajuda avisa quem ainda não
leu a entrada mais recente — por isso a data precisa ser real e a entrada
precisa ser nova, não uma edição da anterior.

Como escrever os `itens`:

- Fale com o usuário final, não com quem programa. "Nova aba Eventos, para
  dividir os gastos de uma viagem" — nunca "adiciona model `Evento` e action
  `sincronizarCotas`".
- Nada de nome de arquivo, tabela, campo, componente ou termo técnico.
- Uma frase por mudança, direta, dizendo o que a pessoa ganha com aquilo.
- Só entra o que é visível. Refatoração, ajuste de tipo, mudança de índice no
  banco: não vão para o changelog.

Mudanças puramente internas dispensam entrada. Na dúvida, pergunte: "alguém
que usa o app perceberia isso?" Se sim, escreva a entrada.

## Central de Ajuda

`src/components/ajuda/CentralAjuda.tsx` — botão fixo no canto inferior direito,
presente em todas as telas logadas. Três abas:

- **Novidades** — o changelog de `src/lib/changelog.ts`.
- **Como usar** — guia por área do app, em `GUIA` (`src/lib/ajuda.ts`).
- **Dúvidas** — perguntas frequentes, em `DUVIDAS` (`src/lib/ajuda.ts`).

Criou uma área nova no app? Acrescente o tópico correspondente em `GUIA`. Uma
dúvida que apareceu mais de uma vez vira item em `DUVIDAS`.

## Convenções do código

- **Tudo em português**: nomes de variáveis, funções, tipos, comentários e
  mensagens. `salvarContaFixa`, `ResumoPessoa`, `pessoaValida`.
- **Comentários explicam o porquê**, não o que o código já diz. Comente a
  decisão não óbvia; pule o resto.
- **Server Actions** ficam em `src/actions/`, sempre começando por validação
  com Zod (`src/lib/validators.ts`) e por `obterContexto()`, que garante o
  escopo do workspace. Devolvem `ResultadoAcao` (`{ ok, mensagem }`) — nunca
  lançam erro para a UI.
- **Leitura de dados** fica em `src/lib/dados.ts`, devolvendo DTOs
  serializáveis: `Decimal` do Prisma vira `number` ali, porque `Decimal` não
  atravessa a fronteira server → client.
- **Cálculos** ficam em `src/lib/calculos.ts`, puros, sem tocar no banco.
- **Meses** são strings `YYYY-MM` e datas são `YYYY-MM-DD`; a comparação é
  lexicográfica mesmo. O mês em foco vive num cookie (`src/lib/mes.ts`).
- **Estilo** é CSS próprio em `src/app/globals.css`, com tokens em `:root` e
  tema claro por `prefers-color-scheme`. Nunca defina cor fixa que quebre em
  um dos temas.
- **Navegação** do app logado é por abas dentro de `/dashboard`
  (`src/components/app/Shell.tsx`), trocadas por estado do React. Não crie
  rotas novas para telas do app: o app instalado no celular sai da tela cheia
  a cada mudança de URL.

## Comandos

```bash
npm run dev
```

```bash
npm run typecheck
```

```bash
npm run build
```

Banco: `npx prisma migrate deploy` aplica migrations; `npx prisma generate`
regenera o client.

⚠️ `prisma migrate dev` falha neste repositório: a migration
`20250716230000_init` tem um banner de update do Prisma colado no fim do
`migration.sql`, o que quebra o shadow database. Para uma migration nova, gere
o SQL com `prisma migrate diff --from-schema-datasource prisma/schema.prisma
--to-schema-datamodel prisma/schema.prisma --script` dentro de uma pasta
`prisma/migrations/<timestamp>_<nome>/migration.sql` e aplique com
`prisma migrate deploy`. Não edite a migration `init`: ela já está aplicada e
mudá-la invalida o checksum.

## Antes de terminar uma alteração

1. `npm run typecheck` e `npm run build` passando.
2. Entrada nova no changelog, se a mudança é visível.
3. Tópico em `GUIA` ou `DUVIDAS`, se apareceu área ou dúvida nova.
