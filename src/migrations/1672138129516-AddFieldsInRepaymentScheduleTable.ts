import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFieldsInRepaymentScheduleTable1672138129516 implements MigrationInterface {
    name = 'AddFieldsInRepaymentScheduleTable1672138129516'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD \`scheduling_status\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD \`zoho_loan_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD CONSTRAINT \`FK_7046bc1f3888d08e217829bde08\` FOREIGN KEY (\`loan_id\`) REFERENCES \`loans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD CONSTRAINT \`FK_0cc8d5e5c0fd061457187777bdf\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP FOREIGN KEY \`FK_0cc8d5e5c0fd061457187777bdf\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP FOREIGN KEY \`FK_7046bc1f3888d08e217829bde08\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP COLUMN \`zoho_loan_id\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP COLUMN \`scheduling_status\``);
    }

}
