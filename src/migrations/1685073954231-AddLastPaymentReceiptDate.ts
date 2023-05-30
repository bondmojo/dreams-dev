import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLastPaymentReceiptDate1685073954231 implements MigrationInterface {
    name = 'AddLastPaymentReceiptDate1685073954231'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD \`last_payment_receipt_date\` date NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP COLUMN \`last_payment_receipt_date\``);
    }

}
