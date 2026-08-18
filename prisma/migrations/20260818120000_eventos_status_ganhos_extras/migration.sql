-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('EM_ANDAMENTO', 'PAGO');

-- AlterTable
ALTER TABLE "ContaVariavel" ADD COLUMN     "gastoEventoId" TEXT;

-- CreateTable
CREATE TABLE "Evento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🧳',
    "descricao" TEXT,
    "dataInicio" TEXT NOT NULL,
    "dataFim" TEXT,
    "encerrado" BOOLEAN NOT NULL DEFAULT false,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Evento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ParticipanteEvento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "eventoId" TEXT NOT NULL,
    "pessoaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParticipanteEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GastoEvento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Lazer',
    "data" TEXT NOT NULL,
    "observacao" TEXT,
    "eventoId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoEvento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GanhoExtra" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Outros',
    "pessoaId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "recorrente" BOOLEAN NOT NULL DEFAULT false,
    "observacao" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GanhoExtra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PagamentoConta" (
    "id" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "status" "StatusPagamento" NOT NULL DEFAULT 'PAGO',
    "pagoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contaFixaId" TEXT,
    "contaVariavelId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PagamentoConta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Evento_workspaceId_idx" ON "Evento"("workspaceId");

-- CreateIndex
CREATE INDEX "ParticipanteEvento_eventoId_idx" ON "ParticipanteEvento"("eventoId");

-- CreateIndex
CREATE INDEX "ParticipanteEvento_pessoaId_idx" ON "ParticipanteEvento"("pessoaId");

-- CreateIndex
CREATE INDEX "GastoEvento_eventoId_idx" ON "GastoEvento"("eventoId");

-- CreateIndex
CREATE INDEX "GastoEvento_workspaceId_idx" ON "GastoEvento"("workspaceId");

-- CreateIndex
CREATE INDEX "GanhoExtra_workspaceId_mes_idx" ON "GanhoExtra"("workspaceId", "mes");

-- CreateIndex
CREATE INDEX "GanhoExtra_pessoaId_idx" ON "GanhoExtra"("pessoaId");

-- CreateIndex
CREATE INDEX "PagamentoConta_workspaceId_mes_idx" ON "PagamentoConta"("workspaceId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoConta_contaFixaId_mes_key" ON "PagamentoConta"("contaFixaId", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "PagamentoConta_contaVariavelId_mes_key" ON "PagamentoConta"("contaVariavelId", "mes");

-- CreateIndex
CREATE INDEX "ContaVariavel_gastoEventoId_idx" ON "ContaVariavel"("gastoEventoId");

-- AddForeignKey
ALTER TABLE "ContaVariavel" ADD CONSTRAINT "ContaVariavel_gastoEventoId_fkey" FOREIGN KEY ("gastoEventoId") REFERENCES "GastoEvento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evento" ADD CONSTRAINT "Evento_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteEvento" ADD CONSTRAINT "ParticipanteEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ParticipanteEvento" ADD CONSTRAINT "ParticipanteEvento_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoEvento" ADD CONSTRAINT "GastoEvento_eventoId_fkey" FOREIGN KEY ("eventoId") REFERENCES "Evento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoEvento" ADD CONSTRAINT "GastoEvento_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanhoExtra" ADD CONSTRAINT "GanhoExtra_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GanhoExtra" ADD CONSTRAINT "GanhoExtra_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoConta" ADD CONSTRAINT "PagamentoConta_contaFixaId_fkey" FOREIGN KEY ("contaFixaId") REFERENCES "ContaFixa"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoConta" ADD CONSTRAINT "PagamentoConta_contaVariavelId_fkey" FOREIGN KEY ("contaVariavelId") REFERENCES "ContaVariavel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PagamentoConta" ADD CONSTRAINT "PagamentoConta_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

