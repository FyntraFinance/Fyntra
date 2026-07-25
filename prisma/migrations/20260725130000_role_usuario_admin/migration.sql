-- CreateEnum
CREATE TYPE "PapelUsuario" AS ENUM ('USUARIO', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "PapelUsuario" NOT NULL DEFAULT 'USUARIO';
