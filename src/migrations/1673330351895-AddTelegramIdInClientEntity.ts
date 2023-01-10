import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTelegramIdInClientEntity1673330351895 implements MigrationInterface {
    name = 'AddTelegramIdInClientEntity1673330351895'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`telegram_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD UNIQUE INDEX \`IDX_5e40ea575e0e969375b53a8bc0\` (\`telegram_id\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` DROP INDEX \`IDX_5e40ea575e0e969375b53a8bc0\``);
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`telegram_id\``);
    }

}
