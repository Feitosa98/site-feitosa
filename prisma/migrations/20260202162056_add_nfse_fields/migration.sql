-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "linkConsulta" TEXT,
ADD COLUMN     "mensagemErro" TEXT,
ADD COLUMN     "protocolo" TEXT,
ADD COLUMN     "xmlDps" TEXT,
ADD COLUMN     "xmlNfse" TEXT,
ALTER COLUMN "status" SET DEFAULT 'PENDENTE';
