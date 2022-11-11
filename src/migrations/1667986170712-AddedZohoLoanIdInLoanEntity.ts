import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedZohoLoanIdInLoanEntity1667986170712 implements MigrationInterface {
    name = 'AddedZohoLoanIdInLoanEntity1667986170712'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_139dd4f3bd8f8f392c741297cf\` ON \`clients\``);
        await queryRunner.query(`DROP INDEX \`IDX_c1e5ec11d77d73e4867ecfe6e4\` ON \`clients\``);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD \`zoho_loan_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loans\` ADD UNIQUE INDEX \`IDX_50284506b964f7356897344d07\` (\`zoho_loan_id\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` DROP INDEX \`IDX_50284506b964f7356897344d07\``);
        await queryRunner.query(`ALTER TABLE \`loans\` DROP COLUMN \`zoho_loan_id\``);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_c1e5ec11d77d73e4867ecfe6e4\` ON \`clients\` (\`sendpulse_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_139dd4f3bd8f8f392c741297cf\` ON \`clients\` (\`zoho_id\`)`);
    }

}
