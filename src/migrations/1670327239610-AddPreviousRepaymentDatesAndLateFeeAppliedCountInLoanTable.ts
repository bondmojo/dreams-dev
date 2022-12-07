import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPreviousRepaymentDatesAndLateFeeAppliedCountInLoanTable1670327239610 implements MigrationInterface {
    name = 'AddPreviousRepaymentDatesAndLateFeeAppliedCountInLoanTable1670327239610'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`late_fee_applied_count\` int UNSIGNED NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`previous_repayment_dates\` json NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`previous_repayment_dates\``);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`late_fee_applied_count\``);
    }

}
