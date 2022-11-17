import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMembershipTierInLoanEntity1667996097538 implements MigrationInterface {
    name = 'AddedMembershipTierInLoanEntity1667996097538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`tier\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`tier\``);
    }

}
