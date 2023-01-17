import { MigrationInterface, QueryRunner } from "typeorm";

export class RepaymentScheduleAlter1673628687550 implements MigrationInterface {
    name = 'RepaymentScheduleAlter1673628687550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` CHANGE \`ins_number\` \`instalment_number\` int NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`loan_repayment_schedule\` CHANGE \`instalment_number\` \`ins_number\` int NOT NULL`);
    }

}
