import { MigrationInterface, QueryRunner } from "typeorm";

export class AddHouseNoInClientTable1669277639274 implements MigrationInterface {
    name = 'AddHouseNoInClientTable1669277639274'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` CHANGE \`updated_date\` \`house_no\` timestamp NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`house_no\``);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`house_no\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`house_no\``);
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`house_no\` timestamp NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`clients\` CHANGE \`house_no\` \`updated_date\` timestamp NOT NULL`);
    }

}
