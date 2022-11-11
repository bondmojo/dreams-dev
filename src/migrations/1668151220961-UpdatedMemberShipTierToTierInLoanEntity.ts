import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatedMemberShipTierToTierInLoanEntity1668151220961 implements MigrationInterface {
    name = 'UpdatedMemberShipTierToTierInLoanEntity1668151220961'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_f6835889afae4b0f7a2199c81f\` ON \`loans\``);
        await queryRunner.query(`ALTER TABLE \`loans\` CHANGE \`mombership_tier\` \`tier\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`tier\``);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`tier\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD UNIQUE INDEX \`IDX_ac91ef2fc83f5a417d2205106e\` (\`tier\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP INDEX \`IDX_ac91ef2fc83f5a417d2205106e\``);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`tier\``);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`tier\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loans\` CHANGE \`tier\` \`mombership_tier\` varchar(255) NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_f6835889afae4b0f7a2199c81f\` ON \`loans\` (\`mombership_tier\`)`);
    }

}
