import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCurrencyInRepaymentSchedule1672917676972 implements MigrationInterface {
    name = 'AddCurrencyInRepaymentSchedule1672917676972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD \`currency\` varchar(255) NULL DEFAULT 'USD'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP COLUMN \`currency\``);
    }

}
