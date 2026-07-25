-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "TipoContaFixa" AS ENUM ('COMPARTILHADA', 'INDIVIDUAL');

-- CreateTable
CREATE TABLE "Configuracao" (
    "id" TEXT NOT NULL,
    "divisaoPorSalario" BOOLEAN NOT NULL DEFAULT false,
    "openaiApiKey" TEXT,
    "workspaceId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Configuracao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaFixa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Outros',
    "tipo" "TipoContaFixa" NOT NULL DEFAULT 'COMPARTILHADA',
    "pessoaId" TEXT,
    "dataInicio" TEXT NOT NULL,
    "dataFim" TEXT,
    "observacao" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaFixa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContaVariavel" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "valorTotal" DECIMAL(15,2) NOT NULL,
    "valorParcela" DECIMAL(15,2) NOT NULL,
    "categoria" TEXT NOT NULL DEFAULT 'Outros',
    "pessoaId" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "mesInicio" TEXT NOT NULL,
    "mesFim" TEXT NOT NULL,
    "parcelas" INTEGER NOT NULL DEFAULT 1,
    "observacao" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContaVariavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meta" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "emoji" TEXT NOT NULL DEFAULT '🎯',
    "valorAlvo" DECIMAL(15,2) NOT NULL,
    "valorAtual" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "contribuicaoMensal" DECIMAL(15,2),
    "cor" TEXT NOT NULL DEFAULT '#10b981',
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pessoa" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "salario" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pessoa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Workspace" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Workspace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkspaceMembro" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WorkspaceMembro_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Configuracao_workspaceId_key" ON "Configuracao"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "ContaFixa_dataInicio_idx" ON "ContaFixa"("dataInicio" ASC);

-- CreateIndex
CREATE INDEX "ContaFixa_workspaceId_idx" ON "ContaFixa"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "ContaVariavel_mesInicio_mesFim_idx" ON "ContaVariavel"("mesInicio" ASC, "mesFim" ASC);

-- CreateIndex
CREATE INDEX "ContaVariavel_workspaceId_idx" ON "ContaVariavel"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "Meta_workspaceId_idx" ON "Meta"("workspaceId" ASC);

-- CreateIndex
CREATE INDEX "Pessoa_workspaceId_idx" ON "Pessoa"("workspaceId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email" ASC);

-- CreateIndex
CREATE INDEX "WorkspaceMembro_userId_idx" ON "WorkspaceMembro"("userId" ASC);

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMembro_workspaceId_userId_key" ON "WorkspaceMembro"("workspaceId" ASC, "userId" ASC);

-- AddForeignKey
ALTER TABLE "Configuracao" ADD CONSTRAINT "Configuracao_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaFixa" ADD CONSTRAINT "ContaFixa_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaFixa" ADD CONSTRAINT "ContaFixa_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaVariavel" ADD CONSTRAINT "ContaVariavel_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContaVariavel" ADD CONSTRAINT "ContaVariavel_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meta" ADD CONSTRAINT "Meta_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pessoa" ADD CONSTRAINT "Pessoa_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembro" ADD CONSTRAINT "WorkspaceMembro_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkspaceMembro" ADD CONSTRAINT "WorkspaceMembro_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.9.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
