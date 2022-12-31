import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedDueDateInRepaymentScheduleTable1672411739755 implements MigrationInterface {
    name = 'AddedDueDateInRepaymentScheduleTable1672411739755'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD \`paid_date\` date NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP COLUMN \`paid_date\``);
    }

}
