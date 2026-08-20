-- AlterTable
ALTER TABLE "AporteMeta" ADD COLUMN     "pessoaId" TEXT;

-- AlterTable
ALTER TABLE "ContaFixa" ADD COLUMN     "diaVencimento" INTEGER;

-- AlterTable
ALTER TABLE "ContaVariavel" ADD COLUMN     "diaVencimento" INTEGER;

-- AlterTable
ALTER TABLE "ParticipanteEvento" ADD COLUMN     "valorPago" DECIMAL(15,2) NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InscricaoPush" (
    "id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "diasAntes" INTEGER NOT NULL DEFAULT 3,
    "resumoDiario" BOOLEAN NOT NULL DEFAULT true,
    "ultimoEnvio" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InscricaoPush_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "InscricaoPush_endpoint_key" ON "InscricaoPush"("endpoint");

-- CreateIndex
CREATE INDEX "InscricaoPush_workspaceId_idx" ON "InscricaoPush"("workspaceId");

-- CreateIndex
CREATE INDEX "InscricaoPush_userId_idx" ON "InscricaoPush"("userId");

-- AddForeignKey
ALTER TABLE "AporteMeta" ADD CONSTRAINT "AporteMeta_pessoaId_fkey" FOREIGN KEY ("pessoaId") REFERENCES "Pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InscricaoPush" ADD CONSTRAINT "InscricaoPush_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

