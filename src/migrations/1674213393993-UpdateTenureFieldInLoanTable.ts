import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTenureFieldInLoanTable1674213393993 implements MigrationInterface {
    name = 'UpdateTenureFieldInLoanTable1674213393993'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`tenure_in_months\``);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`tenure\` int NOT NULL DEFAULT '1'`);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`tenure_type\` varchar(255) NOT NULL DEFAULT 'monthly'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`tenure_type\``);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`tenure\``);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`tenure_in_months\` int NULL`);
    }

}
