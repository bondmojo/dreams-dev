import { MigrationInterface, QueryRunner } from "typeorm";

export class makeZohoIdAndSendPulseIdUniqueInClientTable1667448624376 implements MigrationInterface {
    name = 'makeZohoIdAndSendPulseIdUniqueInClientTable1667448624376'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` ADD UNIQUE INDEX \`IDX_139dd4f3bd8f8f392c741297cf\` (\`zoho_id\`)`);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD UNIQUE INDEX \`IDX_c1e5ec11d77d73e4867ecfe6e4\` (\`sendpulse_id\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` DROP INDEX \`IDX_c1e5ec11d77d73e4867ecfe6e4\``);
        await queryRunner.query(`ALTER TABLE \`clients\` DROP INDEX \`IDX_139dd4f3bd8f8f392c741297cf\``);
    }

}
