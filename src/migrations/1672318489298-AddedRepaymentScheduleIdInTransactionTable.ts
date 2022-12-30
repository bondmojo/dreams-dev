import { MigrationInterface, QueryRunner } from "typeorm";

export class AddedRepaymentScheduleIdInTransactionTable1672318489298 implements MigrationInterface {
    name = 'AddedRepaymentScheduleIdInTransactionTable1672318489298'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD \`repayment_schedule_id\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD CONSTRAINT \`FK_7046bc1f3888d08e217829bde08\` FOREIGN KEY (\`loan_id\`) REFERENCES \`loans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD CONSTRAINT \`FK_0cc8d5e5c0fd061457187777bdf\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`transactions\` ADD CONSTRAINT \`FK_3e432a0d6602b07f816b754bf7b\` FOREIGN KEY (\`repayment_schedule_id\`) REFERENCES \`loan_repayment_schedule\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP FOREIGN KEY \`FK_3e432a0d6602b07f816b754bf7b\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP FOREIGN KEY \`FK_0cc8d5e5c0fd061457187777bdf\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP FOREIGN KEY \`FK_7046bc1f3888d08e217829bde08\``);
        await queryRunner.query(`ALTER TABLE \`transactions\` DROP COLUMN \`repayment_schedule_id\``);
    }

}
