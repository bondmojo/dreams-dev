import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedPaymentStatusAndLateFeeInLoan1669977877748 implements MigrationInterface {
    name = 'AddedPaymentStatusAndLateFeeInLoan1669977877748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`payment_status\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`late_fee\` float NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`late_fee\``);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`payment_status\``);
    }

}
