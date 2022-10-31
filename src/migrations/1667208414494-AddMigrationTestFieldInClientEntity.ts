import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMigrationTestFieldInClientEntity1667208414494 implements MigrationInterface {
    name = 'AddMigrationTestFieldInClientEntity1667208414494'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` ADD \`migration_test\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`clients\` DROP COLUMN \`migration_test\``);
    }

}
