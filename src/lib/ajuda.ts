/** Conteúdo estático da Central de Ajuda (abas "Como usar" e "Dúvidas"). */

export type TopicoAjuda = {
  titulo: string;
  paragrafos: string[];
};

export const GUIA: TopicoAjuda[] = [
  {
    titulo: "📊 Dashboard",
    paragrafos: [
      "É o resumo do mês escolhido lá em cima, no seletor de mês. Os cartões mostram quanto entrou (salários e ganhos extras), quanto saiu (contas fixas e variáveis) e o que sobrou.",
      "Mais abaixo vêm os gráficos por categoria, a evolução do ano e um cartão por pessoa, com o gasto e a sobra de cada uma.",
    ],
  },
  {
    titulo: "👥 Pessoas",
    paragrafos: [
      "Cadastre quem participa das finanças da casa e o salário de cada um. É esse cadastro que divide as contas compartilhadas.",
      "Com o e-mail preenchido, o dono ou um administrador pode enviar um convite para a pessoa acessar o app com o próprio login.",
    ],
  },
  {
    titulo: "🏠 Contas Fixas",
    paragrafos: [
      "As despesas que se repetem todo mês: aluguel, internet, energia. Basta cadastrar uma vez e informar o mês em que começaram.",
      "Compartilhada significa que o valor é dividido igualmente entre todas as pessoas cadastradas. Individual pesa só na pessoa escolhida.",
    ],
  },
  {
    titulo: "💳 Contas Variáveis",
    paragrafos: [
      "Os gastos do dia a dia e as compras parceladas, sempre no nome de uma pessoa.",
      "Escolha como pagou: cartão, Pix, dinheiro ou boleto. O selo colorido na lista ajuda a identificar cada gasto de relance.",
      "Só o cartão parcela. Ao informar o número de parcelas, o app espalha o valor pelos meses seguintes — cada mês mostra só a parcela daquele mês. As outras formas quitam no próprio mês.",
    ],
  },
  {
    titulo: "💵 Ganhos Extras",
    paragrafos: [
      "Entradas fora do salário: freela, bônus, décimo terceiro, venda de alguma coisa. Todo ganho pertence a uma pessoa.",
      "Marque 'se repete todo mês' quando for uma renda recorrente — ela passa a valer daquele mês em diante, sem precisar recadastrar.",
    ],
  },
  {
    titulo: "🧳 Eventos",
    paragrafos: [
      "Para viagens, festas e qualquer ocasião em que um grupo divide as despesas em partes iguais.",
      "Coloque no rateio quem vai. Se a pessoa é da família, escolha o nome dela na lista: a parte dela entra automaticamente nas contas variáveis e no resumo do mês. Se for alguém de fora, cadastre como convidado — essa pessoa só aumenta o número de quem divide.",
      "Cada gasto lançado é dividido pelo total de participantes. Mudou alguém no rateio ou o valor de um gasto? As partes são recalculadas na hora.",
    ],
  },
  {
    titulo: "✓ Status das contas",
    paragrafos: [
      "Toda conta tem um selo indicando se já foi paga naquele mês ou se ainda está em andamento. Clique no selo para alternar.",
      "O status vale por mês: uma conta fixa pode estar paga em um mês e em andamento no seguinte, sem que você precise cadastrar nada de novo.",
    ],
  },
  {
    titulo: "🎯 Metas",
    paragrafos: [
      "Ficam no Perfil. Cada meta tem um valor alvo e o quanto já foi guardado.",
      "No modo automático, a sobra do mês é dividida entre as metas automáticas. No modo manual, você define quanto pretende guardar por mês.",
      "Para registrar dinheiro que você guardou de verdade, use o botão Guardar no cartão da meta, no Dashboard. O valor entra na meta e sai do saldo daquele mês — afinal, o dinheiro guardado não está mais disponível para gastar.",
      "Se registrar por engano, abra o mesmo botão Guardar: os aportes do mês aparecem ali e podem ser desfeitos.",
    ],
  },
  {
    titulo: "🤖 Assistente IA",
    paragrafos: [
      "Descreva um gasto em português normal — algo como 'mercado 250 no cartão da Ana' — e o assistente monta o cadastro para você confirmar.",
      "Precisa de um token configurado no Perfil para funcionar.",
    ],
  },
  {
    titulo: "🧮 Painel Contábil",
    paragrafos: [
      "Aparece apenas para quem é da equipe de contabilidade. Mostra o relatório financeiro de cada família que autorizou o compartilhamento.",
      "A família controla esse acesso no Perfil. Ao desmarcar a opção, ela desaparece do painel — e nenhum valor é consultado.",
    ],
  },
];

export const DUVIDAS: TopicoAjuda[] = [
  {
    titulo: "Como uma conta compartilhada é dividida?",
    paragrafos: [
      "Em partes iguais entre todas as pessoas cadastradas na aba Pessoas. Se são três pessoas e a conta é de R$ 300, cada uma carrega R$ 100 no resumo dela.",
    ],
  },
  {
    titulo: "Convidei alguém e o e-mail não chegou. E agora?",
    paragrafos: [
      "O app mostra o link do convite na própria tela quando o envio falha. Copie e mande pelo WhatsApp — o link funciona igual e vale por 7 dias.",
    ],
  },
  {
    titulo: "Posso colocar alguém de fora da família em uma viagem?",
    paragrafos: [
      "Pode. Na aba Eventos, adicione a pessoa como convidado, sem vincular a ninguém cadastrado. Ela entra na divisão dos gastos, mas nenhum valor é lançado nas contas da família.",
    ],
  },
  {
    titulo: "Por que não consigo apagar uma conta variável?",
    paragrafos: [
      "Se a conta veio de um evento, ela é a parte daquela pessoa em um gasto da viagem. Apague o gasto na aba Eventos e a parte some junto.",
    ],
  },
  {
    titulo: "Por que 'Livre por dia' sumiu do cartão da pessoa?",
    paragrafos: [
      "Esse valor só aparece quando existe sobra no mês. Se os gastos passaram da renda, não há quanto gastar por dia, então o app prefere não mostrar um número negativo.",
    ],
  },
  {
    titulo: "A contabilidade consegue ver os meus dados?",
    paragrafos: [
      "Só se você autorizar. No Perfil existe uma opção de compartilhamento com a contabilidade. Desmarcada, a sua família não aparece no painel contábil de forma alguma.",
    ],
  },
  {
    titulo: "Não consigo remover uma pessoa. Por quê?",
    paragrafos: [
      "Pessoas com contas variáveis lançadas não podem ser removidas, para não deixar gastos órfãos. Apague ou transfira as contas dela antes.",
    ],
  },
];
