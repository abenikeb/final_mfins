-- AlterTable
ALTER TABLE "MemberBalance" ADD COLUMN     "costOfShare" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "membershipFee" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "registrationFee" DECIMAL(65,30) NOT NULL DEFAULT 0.00,
ADD COLUMN     "willingDeposit" DECIMAL(65,30) NOT NULL DEFAULT 0.00;
