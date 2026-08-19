-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('CARTAO', 'PIX', 'DINHEIRO', 'BOLETO');

-- AlterTable
ALTER TABLE "ContaVariavel" ADD COLUMN     "formaPagamento" "FormaPagamento" NOT NULL DEFAULT 'CARTAO';

-- CreateTable
CREATE TABLE "AporteMeta" (
    "id" TEXT NOT NULL,
    "metaId" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL,
    "data" TEXT NOT NULL,
    "mes" TEXT NOT NULL,
    "observacao" TEXT,
    "workspaceId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AporteMeta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AporteMeta_workspaceId_mes_idx" ON "AporteMeta"("workspaceId", "mes");

-- CreateIndex
CREATE INDEX "AporteMeta_metaId_idx" ON "AporteMeta"("metaId");

-- AddForeignKey
ALTER TABLE "AporteMeta" ADD CONSTRAINT "AporteMeta_metaId_fkey" FOREIGN KEY ("metaId") REFERENCES "Meta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AporteMeta" ADD CONSTRAINT "AporteMeta_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

