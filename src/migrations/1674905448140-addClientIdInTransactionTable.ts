import { MigrationInterface, QueryRunner } from "typeorm";

export class addClientIdInTransactionTable1674905448140 implements MigrationInterface {
    name = 'addClientIdInTransactionTable1674905448140'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`client_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_ebb352c973d8a85e8779a15ff35\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_ebb352c973d8a85e8779a15ff35\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`client_id\``);
    }

}
