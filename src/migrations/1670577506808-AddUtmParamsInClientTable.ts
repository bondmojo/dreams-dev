import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUtmParamsInClientTable1670577506808 implements MigrationInterface {
    name = 'AddUtmParamsInClientTable1670577506808'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`utm_source\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`utm_campaign\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`utm_medium\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`utm_medium\``);
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`utm_campaign\``);
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`utm_source\``);
    }

}
