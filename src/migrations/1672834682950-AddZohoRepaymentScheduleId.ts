import { MigrationInterface, QueryRunner } from "typeorm";

export class AddZohoRepaymentScheduleId1672834682950 implements MigrationInterface {
    name = 'AddZohoRepaymentScheduleId1672834682950'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD \`zoho_repayment_schedule_id\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP COLUMN \`zoho_repayment_schedule_id\``);
    }

}
