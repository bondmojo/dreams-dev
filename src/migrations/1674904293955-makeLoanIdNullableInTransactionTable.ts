import { MigrationInterface, QueryRunner } from "typeorm";

export class makeLoanIdNullableInTransactionTable1674904293955 implements MigrationInterface {
    name = 'makeLoanIdNullableInTransactionTable1674904293955'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_5101fa7a2a4dce364c002f9fad4\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`loan_id\` \`loan_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_5101fa7a2a4dce364c002f9fad4\` FOREIGN KEY (\`loan_id\`) REFERENCES \`loans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_5101fa7a2a4dce364c002f9fad4\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` CHANGE \`loan_id\` \`loan_id\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_5101fa7a2a4dce364c002f9fad4\` FOREIGN KEY (\`loan_id\`) REFERENCES \`loans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
