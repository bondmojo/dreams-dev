import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRepaymentScheduleTable1672747917766 implements MigrationInterface {
    name = 'AddRepaymentScheduleTable1672747917766'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`loan_repayment_schedule\` (\`id\` varchar(255) NOT NULL, \`instalment_number\` int NOT NULL, \`loan_id\` varchar(255) NOT NULL, \`client_id\` varchar(255) NOT NULL, \`ins_overdue_amount\` decimal(10,2) NOT NULL, \`ins_principal_amount\` decimal(10,2) NOT NULL, \`ins_membership_fee\` decimal(10,2) NOT NULL DEFAULT '3.00', \`ins_additional_fee\` decimal(10,2) NOT NULL DEFAULT '0.00', \`total_paid_amount\` decimal(10,2) NOT NULL DEFAULT '0.00', \`repayment_status\` varchar(255) NOT NULL, \`scheduling_status\` varchar(255) NOT NULL, \`grace_period\` int NOT NULL, \`number_of_penalties\` int UNSIGNED NOT NULL DEFAULT '0', \`previous_repayment_dates\` json NULL, \`ins_from_date\` date NOT NULL, \`ins_to_date\` date NOT NULL, \`due_date\` date NOT NULL, \`paid_date\` date NULL, \`zoho_loan_id\` varchar(255) NULL, \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD CONSTRAINT \`FK_7046bc1f3888d08e217829bde08\` FOREIGN KEY (\`loan_id\`) REFERENCES \`loans\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` ADD CONSTRAINT \`FK_0cc8d5e5c0fd061457187777bdf\` FOREIGN KEY (\`client_id\`) REFERENCES \`clients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP FOREIGN KEY \`FK_0cc8d5e5c0fd061457187777bdf\``);
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` DROP FOREIGN KEY \`FK_7046bc1f3888d08e217829bde08\``);
        await queryRunner.query(`DROP TABLE \`loan_repayment_schedule\``);
    }

}
