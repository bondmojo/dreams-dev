import { MigrationInterface, QueryRunner } from "typeorm";

export class FixTenureTypeDefaultVaue1675855547032 implements MigrationInterface {
    name = 'FixTenureTypeDefaultVaue1675855547032'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` CHANGE \`tenure_type\` \`tenure_type\` varchar(255) NOT NULL DEFAULT 'Monthly'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loans\` CHANGE \`tenure_type\` \`tenure_type\` varchar(255) NOT NULL DEFAULT 'monthly'`);
    }

}
