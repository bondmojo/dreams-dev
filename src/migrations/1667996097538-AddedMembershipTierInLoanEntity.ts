import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedMembershipTierInLoanEntity1667996097538 implements MigrationInterface {
    name = 'AddedMembershipTierInLoanEntity1667996097538'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`mombership_tier\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD UNIQUE INDEX \`IDX_f6835889afae4b0f7a2199c81f\` (\`mombership_tier\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP INDEX \`IDX_f6835889afae4b0f7a2199c81f\``);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`mombership_tier\``);
    }

}
