/**
 * Histórico de atualizações mostrado na Central de Ajuda (aba Novidades).
 *
 * REGRA: toda alteração que o usuário percebe (funcionalidade nova, mudança
 * de comportamento, correção visível) entra aqui como uma nova entrada NO
 * TOPO da lista. Sem entrada, a atualização não existe para quem usa o app.
 * Os detalhes ficam em `itens`, escritos para o usuário final — nada de nome
 * de arquivo, tabela ou termo técnico.
 */

export type EntradaChangelog = {
  /** Data da atualização, no formato YYYY-MM-DD. */
  data: string;
  /** Resumo curto: é o que aparece fechado, e abre ao clicar. */
  titulo: string;
  /** O que mudou, em linguagem de usuário. */
  itens: string[];
};

/** Da mais recente para a mais antiga. */
export const CHANGELOG: EntradaChangelog[] = [
  {
    data: "2026-08-19",
    titulo: "Relatório em Excel, Perfil mais simples e correções no celular",
    itens: [
      "Novo relatório do mês no Perfil: baixe uma planilha do Excel com o resumo, um gráfico dos gastos por categoria e uma aba para cada coisa — contas fixas, contas variáveis, ganhos extras e o que foi guardado em metas.",
      "No celular, os valores dos cartões e das contas apareciam cortados pela metade. Os tamanhos foram ajustados e agora cabem inteiros na tela.",
      "O texto do app também era aumentado por conta própria pelo celular, saindo fora de proporção. Isso foi corrigido.",
      "Em telas estreitas, o botão de cadastrar agora ocupa a linha inteira, embaixo da descrição, em vez de disputar espaço com ela.",
      "O Perfil ficou mais direto: saíram as opções de exportar backup, importar backup e token da IA.",
    ],
  },
  {
    data: "2026-08-18",
    titulo: "Guardar em metas, formas de pagamento e visual renovado",
    itens: [
      "No dashboard, cada meta agora tem o botão Guardar. O valor informado entra na meta e sai do saldo do mês — guardar dinheiro passou a contar como uma saída, igual a uma conta paga.",
      "O cartão Guardado em Metas mostra quanto você separou no mês, e cada meta mostra quanto recebeu.",
      "Errou o valor? Dá para desfazer um aporte pela mesma tela, e o dinheiro volta para a sobra do mês.",
      "Nas contas variáveis você escolhe a forma de pagamento: cartão, Pix, dinheiro ou boleto. O parcelamento aparece só no cartão, e a lista mostra um selo colorido para identificar cada forma de relance.",
      "O seletor de mês foi refeito: mês e ano lado a lado, setas mais discretas e um atalho para voltar ao mês atual.",
      "As telas de entrada e a barra lateral agora exibem a logo do Fyntra no lugar do ícone genérico.",
    ],
  },
  {
    data: "2026-08-18",
    titulo: "Visual mais legível e consistente em todo o app",
    itens: [
      "O app passou a usar a fonte Inter de verdade: os textos, números e botões ficaram mais nítidos e alinhados.",
      "No tema claro, valores como a sobra, os gastos e o item de menu selecionado estavam muito claros para ler. Todas as cores foram ajustadas para ter contraste adequado nos dois temas.",
      "Valores em dinheiro agora usam dígitos de largura fixa: as colunas de valores param de dançar de uma linha para a outra.",
      "Botões, campos e menus ganharam tamanho, cantos e espaçamento padronizados.",
      "Quem navega pelo teclado agora enxerga onde está: todo botão, campo e link mostra um contorno ao receber o foco.",
      "No celular, os botões de editar e remover voltaram ao tamanho confortável para o toque.",
    ],
  },
  {
    data: "2026-08-18",
    titulo: "Central de Ajuda com as novidades do app",
    itens: [
      "Botão de ajuda no canto inferior direito, disponível em qualquer tela.",
      "Aba Novidades: o histórico de tudo que muda no app — clique no título de uma atualização para ver os detalhes.",
      "Aba Como usar: um guia rápido de cada área do Fyntra.",
      "Aba Dúvidas: as perguntas mais comuns sobre divisão de contas, convites e metas.",
      "Uma bolinha vermelha no botão avisa quando existe novidade que você ainda não leu.",
    ],
  },
  {
    data: "2026-08-18",
    titulo: "Eventos, status das contas, ganhos extras e meta manual",
    itens: [
      "Nova aba Eventos: cadastre a viagem ou a festa, coloque quem vai — inclusive quem não é da família — e cada gasto é dividido em partes iguais. A parte de quem é da família entra automaticamente nas contas variáveis dela.",
      "Todas as contas agora têm status Pago ou Em andamento, mês a mês. Clique no selo para alternar.",
      "Nova aba Ganhos Extras: freela, bônus ou venda no nome de uma pessoa, com opção de repetir todo mês. O valor soma na renda dela e na sobra da família.",
      "Metas: agora você escolhe entre contribuição automática (divide a sobra do mês) e manual (você define o valor). Também dá para registrar quanto guardou usando o botão 💰.",
      "O campo Livre por dia só aparece quando a pessoa realmente tem sobra no mês.",
      "O painel contábil passou a mostrar os ganhos extras e o status de cada conta.",
    ],
  },
  {
    data: "2026-08-10",
    titulo: "Você decide se a contabilidade vê os seus dados",
    itens: [
      "Nova opção no Perfil para autorizar (ou não) que a contabilidade acompanhe as finanças da sua família.",
      "Com a opção desmarcada, a família some do painel contábil por completo — nem o nome aparece.",
    ],
  },
  {
    data: "2026-07-25",
    titulo: "Recuperação de senha e ajustes visuais",
    itens: [
      "Esqueceu a senha? Agora dá para receber um link de redefinição por e-mail.",
      "Troca de senha direto pelo Perfil.",
      "Tema claro e tema escuro acompanhando a configuração do seu celular ou computador.",
      "Navegação reorganizada em abas, sem recarregar a tela.",
    ],
  },
  {
    data: "2026-07-24",
    titulo: "Fyntra no celular e convites por e-mail",
    itens: [
      "O app pode ser instalado na tela de início do celular e abrir em tela cheia.",
      "Convide as pessoas da casa por e-mail para que cada uma acompanhe as contas com o próprio login.",
    ],
  },
];

/** Data da entrada mais recente — usada para sinalizar novidade não lida. */
export const ULTIMA_ATUALIZACAO = CHANGELOG[0]?.data ?? "";
