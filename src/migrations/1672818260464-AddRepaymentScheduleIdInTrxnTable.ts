import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRepaymentScheduleTable1672818260464 implements MigrationInterface {
    name = 'AddRepaymentScheduleTable1672818260464'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`repayment_schedule_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_3e432a0d6602b07f816b754bf7b\` FOREIGN KEY (\`repayment_schedule_id\`) REFERENCES \`loan_repayment_schedule\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_3e432a0d6602b07f816b754bf7b\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`repayment_schedule_id\``);
    }

}
