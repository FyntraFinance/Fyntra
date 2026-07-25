-- CreateEnum
CREATE TYPE "StatusConvite" AS ENUM ('PENDENTE', 'ACEITO', 'EXPIRADO', 'CANCELADO');

-- AlterTable
ALTER TABLE "Configuracao" ADD COLUMN     "poeApiKey" TEXT;

-- AlterTable
ALTER TABLE "Pessoa" ADD COLUMN     "email" TEXT,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Convite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'MEMBER',
    "status" "StatusConvite" NOT NULL DEFAULT 'PENDENTE',
    "workspaceId" TEXT NOT NULL,
    "pessoaId" TEXT,
    "convidadoPorId" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "aceitoEm" TIMESTAMP(3),
    "enviadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Convite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Convite_token_key" ON "Convite"("token");

-- CreateIndex
CREATE INDEX "Convite_workspaceId_idx" ON "Convite"("workspaceId");

-- CreateIndex
CREATE INDEX "Convite_email_idx" ON "Convite"("email");

-- CreateIndex
CREATE INDEX "Convite_pessoaId_idx" ON "Convite"("pessoaId");

-- CreateIndex
CREATE INDEX "Pessoa_userId_idx" ON "Pessoa"("userId");

-- AddForeignKey
ALTER TABLE "Pessoa" ADD CONSTRAINT "Pessoa_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Convite" ADD CONSTRAINT "Convite_convidadoPorId_fkey" FOREIGN KEY ("convidadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

