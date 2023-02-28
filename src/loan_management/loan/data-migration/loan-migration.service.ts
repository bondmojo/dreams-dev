import { Injectable, Inject } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../../globals/usecases/global.service"
import { Repository } from 'typeorm';
import { ZohoLoanHelperService } from "../usecases/zoho-loan-helper.service";
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
import { ClientService } from '../../client/usecases/client.service';
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { ZohoInstallmentFields } from "src/globals/zoho_fields_mapping/Installment";
import { GetTransactionDto } from "src/loan_management/transaction/dto";
import { ZohoRepaymentScheduleHelper } from "src/loan_management/repayment_schedule/usecases/ZohoRepaymentScheduleHelper";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { SENSPULSE_TELEGRAM_ID_PAIR } from "./sendpulse-telegram-id-pair";
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
@Injectable()
/**
 * Note: before writing new migration code please create new file in data-migration/versions folder and paste this file data over there to maintain migration history.
 * Feature: Tenure 
 * Version: V2
 * Date: Faburary 2023
 * Developed by: Nitesh Soni
 * Work done in this migration file
 * 1. Database: Adding telegram ids in all clients records
 * 2. Database: Adding client Ids in all transactions of all loans
 * 3. Zoho, Sendpulse and Database: Updating tenure and tenure type variables. 
 * 4. Zoho, Database: Creating instalment for existing loans.
 * 5. Database: Adding instalment id in existing transactions. 
 */
export class LoanMigrationService {
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly globalService: GlobalService,
        private readonly zohoLoanHelperService: ZohoLoanHelperService,
        private readonly transactionService: TransactionService,
        private readonly sendpulseService: SendpluseService,
        private readonly clientService: ClientService,
        private readonly zohoRepaymentScheduleHelper: ZohoRepaymentScheduleHelper,
        private readonly repaymentScheduleService: RepaymentScheduleService,
        @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger
    ) {

    }

    async migrateData(): Promise<any> {
        //Get All Clients from database
        const clients: any[] = await this.clientService.find({}, ['loan']);
        for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            if (client.id != "CL98164989") {
                continue;
            }

            try {
                this.logger.info(`🚀 Starting Migration For 🙍‍♂️ ${client.full_en}(${client.id}) `)
                // Add telegram ids to all clients
                await this.migrateTelegramId(client);

                // Running migration on client loan
                const loans = client.loan;
                if (loans.length == 0) {
                    this.logger.info(`🚫 NO LOANS FOUND FOR USER ${client.full_en}(${client.id}) `)
                }
                for (let j = 0; j < loans.length; j++) {
                    try {
                        const loan = await this.loanRepository.findOne({
                            where: { id: loans[j].id },
                            relations: ['client', 'transaction'],
                        });

                        // adding client_id in all transacations
                        await this.updateClientIdInLoanAllTransactions(loan);

                        // Updating Loan Tenure Info in db, zoho, sendpuse
                        await this.updateLoanTenure(loan);

                        if (["Disbursed", "Fully Paid"].includes(loan.status)) {
                            const instalement_id = 'INS' + Math.floor(Math.random() * 100000000);
                            const ins_zoho_id = await this.createInsOnZoho(loan, instalement_id);
                            await this.createInsInDb(loan, ins_zoho_id, instalement_id);
                            await this.updateInsIdInTransactions(loan, instalement_id);
                        }

                    } catch (error) {
                        this.logger.info(`❌ Error in loan for loop ${client.full_en}(${client.id}) = ${error}`);
                        this.logger.error(`❌ Error in loan for loop ${client.full_en}(${client.id}) = ${error}`);
                    }
                }

                this.logger.info(`🥂 Done migration for ${client.full_en}(${client.id}) 🙌`);
                this.logger.info(`⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳ PREPARING SYSTEM FOR NEXT USER MIGRATION ⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳⏳`);
            } catch (error) {
                this.logger.info(`Error: User = ${client}`);
            }
        }
        return 'Data Migration Done 😃';
    }

    async getInsZohoRecord(ins_db_obj: any, loan: Loan): Promise<any> {
        const zohoRepaymentSchedulePair: any = {};
        const id = BigInt(ins_db_obj.zoho_loan_id);
        const zoholoanID = new Record();
        zoholoanID.setId(id);

        const dreamer_id = BigInt(loan.client.zoho_id);
        const ZohoDreamerID = new Record();
        ZohoDreamerID.setId(dreamer_id);

        zohoRepaymentSchedulePair[ZohoInstallmentFields.dreamer_name] = ZohoDreamerID;
        zohoRepaymentSchedulePair[ZohoInstallmentFields.name] = ins_db_obj.id;
        zohoRepaymentSchedulePair[ZohoInstallmentFields.loan_id] = zoholoanID;
        zohoRepaymentSchedulePair[ZohoInstallmentFields.total_paid_amount] = Number(ins_db_obj.total_paid_amount);
        zohoRepaymentSchedulePair[ZohoInstallmentFields.overdue_amount] = Number(ins_db_obj.ins_overdue_amount);
        zohoRepaymentSchedulePair[ZohoInstallmentFields.repayment_status] = new Choice(this.globalService.INSTALMENT_PAYMENT_STATUS_STR[ins_db_obj.repayment_status]);

        zohoRepaymentSchedulePair[ZohoInstallmentFields.additional_fee] = Number(ins_db_obj.ins_additional_fee);
        zohoRepaymentSchedulePair[ZohoInstallmentFields.principal_amount] = Number(ins_db_obj.ins_principal_amount);
        zohoRepaymentSchedulePair[ZohoInstallmentFields.repayment_date] = ins_db_obj.due_date;
        zohoRepaymentSchedulePair[ZohoInstallmentFields.installment_status] = new Choice(this.globalService.INSTALMENT_SCHEDULING_STATUS_STR[ins_db_obj.scheduling_status]);
        zohoRepaymentSchedulePair[ZohoInstallmentFields.installment_fees] = Number(ins_db_obj.ins_membership_fee);

        let previous_repayment_dates: any = ins_db_obj.previous_repayment_dates ?? [];
        previous_repayment_dates = (previous_repayment_dates.toString()).replace(/,/g, " \n ");
        zohoRepaymentSchedulePair[ZohoInstallmentFields.previous_repayment_dates] = previous_repayment_dates;
        // add last paid date from last partial paid transaction
        const getLastTransactionDto = new GetTransactionDto();
        getLastTransactionDto.loan_id = ins_db_obj.loan_id;
        getLastTransactionDto.type = "partial_payment";
        const loan_last_transaction = await this.transactionService.findOne(getLastTransactionDto)
        if (loan_last_transaction) {
            zohoRepaymentSchedulePair[ZohoInstallmentFields.last_paid_date] = new Date(loan_last_transaction.created_at);
        }

        //todo add other fields
        return zohoRepaymentSchedulePair;
    }


    getInsDBOjbect(loan: Loan): any {
        const model: any = {};
        const now = new Date();

        model.loan_id = loan.id;
        model.client_id = loan.client_id;
        model.ins_number = 1;
        model.zoho_loan_id = loan.zoho_loan_id;
        model.ins_additional_fee = Number(loan.late_fee);
        model.ins_principal_amount = Number(loan.amount.toFixed(2)) + Number(loan.wing_wei_luy_transfer_fee);
        model.ins_membership_fee = this.globalService.INSTALMENT_MEMBERSHIP_FEE;
        model.ins_overdue_amount = Number((loan.outstanding_amount).toFixed(2));
        model.total_paid_amount = model.ins_principal_amount + model.ins_membership_fee + model.ins_additional_fee - model.ins_overdue_amount;

        model.repayment_status = this.getRepaymentStatus(loan.payment_status);
        model.scheduling_status = loan.status == "Disbursed" ? this.globalService.INSTALMENT_SCHEDULING_STATUS.SCHEDULED : this.globalService.INSTALMENT_SCHEDULING_STATUS.COMPLETED;
        model.grace_period = this.globalService.INSTALMENT_GRACE_PERIOD_DAYS;
        model.number_of_penalties = loan.late_fee_applied_count;
        model.ins_from_date = new Date(loan.disbursed_date);
        model.ins_to_date = new Date(loan.repayment_date);
        model.due_date = new Date(loan.repayment_date);
        model.currency = "USD";
        model.previous_repayment_dates = loan.previous_repayment_dates;
        if (loan.paid_date) {
            model.paid_date = new Date(loan.paid_date);
            // if loan has partial paid amount then repayment_status should be partial paid
            if (model.repayment_status == 100) {
                model.repayment_status = 200;
            }
        }

        return model;
    }

    async migrateTelegramId(client: any) {
        try {
            const telegram_id = SENSPULSE_TELEGRAM_ID_PAIR[client.sendpulse_id as keyof typeof SENSPULSE_TELEGRAM_ID_PAIR];
            if (telegram_id) {
                client.telegram_id = telegram_id['t_id'];
                await this.clientService.update(client);
            }
            this.logger.info(`👍 TELEGRAM ID MIGRATION DONE SUCCESSFULLY ${client.full_en}(${client.id})`);
        } catch (error) {
            this.logger.info(`❌ ERROR IN migrateTelegramId ${client.full_en}(${client.id}) ${error}`);
            this.logger.error(`❌ ERROR IN migrateTelegramId ${client.full_en}(${client.id}) ${error}`);
        }

    }

    async updateLoanTenure(loan: Loan) {
        // Update Tenure Info on Zoho
        try {
            const loan_retool_url = this.globalService.DREAMS_RETOOL_URL + "#customer_id=" + loan?.client_id;
            const zohoLoanKeyValuePairs: any = {
                Tenure: 1,
                Tenure_Type: this.globalService.LOAN_TENURE_TYPE.MONTHLY,
                Retool_URL: loan_retool_url
            };

            await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoLoanKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
            this.logger.info(`👍 ZOHO: LOAN TENURE UPDATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
        } catch (error) {
            this.logger.info(`❌ ZOHO: ERROR IN LOAN TENURE UPDATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
            this.logger.error(`❌ ZOHO: ERROR IN LOAN TENURE UPDATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
        }

        // Update Tenure info in database
        try {
            const updateLoanDto: any = {};
            updateLoanDto.id = loan.id;
            updateLoanDto.tenure = 1;
            updateLoanDto.tenure_type = "Monthly"
            await this.loanRepository.update(updateLoanDto.id, updateLoanDto);
            this.logger.info(`👍 DATABASE: LOAN TENURE UPDATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
        } catch (error) {
            this.logger.info(`❌ DATABASE: ERROR IN LOAN TENURE UPDATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
            this.logger.error(`❌ DATABASE: ERROR IN LOAN TENURE UPDATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
        }

        // Update Tenure info in sendpulse
        try {
            await this.sendpulseService.updateSendpulseVariable({
                variable_name: 'tenure',
                variable_id: this.globalService.SENDPULSE_VARIABLE_ID.TENURE,
                variable_value: '1',
                contact_id: loan.client.sendpulse_id,
            });
            await this.sendpulseService.updateSendpulseVariable({
                variable_name: 'tenureType',
                variable_id: this.globalService.SENDPULSE_VARIABLE_ID.TENURE_TYPE,
                variable_value: 'Monthly',
                contact_id: loan.client.sendpulse_id,
            });
            this.logger.info(`👍 SENDPULSE: LOAN TENURE UPDATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
        } catch (error) {
            this.logger.info(`❌ SENDPULSE: ERROR IN LOAN TENURE UPDATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
            this.logger.error(`❌ SENDPULSE: ERROR IN LOAN TENURE UPDATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
        }
    }

    async createInsOnZoho(loan: Loan, instalement_id: string): Promise<string> {
        try {
            const ins_db_obj = this.getInsDBOjbect(loan);
            ins_db_obj.id = instalement_id;
            const ins_zoho_record = await this.getInsZohoRecord(ins_db_obj, loan);
            const [ins_zoho_id] = await this.zohoRepaymentScheduleHelper.createZohoRepaymentSchedule([ins_zoho_record]);
            this.logger.info(`👍 ZOHO: INSTALMENT CREATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
            return ins_zoho_id;
        } catch (error) {
            this.logger.info(`❌ ZOHO: ERROR IN INSTALMENT CREATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
            this.logger.error(`❌ ZOHO: ERROR IN INSTALMENT CREATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
        }
    }

    async createInsInDb(loan: Loan, ins_zoho_id: string, instalement_id: string) {
        try {
            const ins_db_obj = this.getInsDBOjbect(loan);
            ins_db_obj.id = instalement_id
            ins_db_obj.zoho_repayment_schedule_id = ins_zoho_id;
            this.logger.info(`👍 DATABASE: INSTALMENT CREATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
            return await this.repaymentScheduleService.save(ins_db_obj);
        } catch (error) {
            this.logger.info(`❌ DATABASE: ERROR IN INSTALMENT CREATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
            this.logger.error(`❌ DATABASE: ERROR IN INSTALMENT CREATION ${loan.client.full_en}(${loan.client.id}) ${error}`);
        }
    }

    getRepaymentStatus(loan_payment_status: string): any {
        switch (loan_payment_status) {
            case "Pending":
                return this.globalService.INSTALMENT_PAYMENT_STATUS.NOT_PAID;
            case "Paid On Time":
                return this.globalService.INSTALMENT_PAYMENT_STATUS.PAID_ON_TIME;
            case "Paid Late":
                return this.globalService.INSTALMENT_PAYMENT_STATUS.PAID_LATE;
            case "Payment Due":
                return this.globalService.INSTALMENT_PAYMENT_STATUS.PAYMENT_DUE;
            case "Payment Rescheduled":
                return this.globalService.INSTALMENT_PAYMENT_STATUS.PAYMENT_RESCHEDULED;
            default:
                return this.globalService.INSTALMENT_PAYMENT_STATUS.NOT_PAID;
        }
    }

    async updateClientIdInLoanAllTransactions(loan: Loan) {
        try {
            const transaction_ids = loan.transaction.map(i => i.id);
            await this.transactionService.bulkUpdate(transaction_ids, { client_id: loan.client_id });
            this.logger.info(`👍 DATABASE: UPDATE CLIENT ID IN LOAN's ALL TRANSACTION MIGRATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
        } catch (e) {
            this.logger.info(`❌ DATABASE: ERROR IN UPDATE CLIENT ID IN LOAN's ALL TRANSACTION MIGRATION ${loan.client.full_en}(${loan.client.id}) ${e}`);
            this.logger.error(`❌ DATABASE: ERROR IN UPDATE CLIENT ID IN LOAN's ALL TRANSACTION MIGRATION ${loan.client.full_en}(${loan.client.id}) ${e}`);
        }
    }

    async updateInsIdInTransactions(loan: Loan, instalement_id: string) {
        try {
            const transaction_ids_for_ins_id_update = loan.transaction.filter(i => {
                if (['credit_repayment', 'fee_payment', 'partial_payment', 'late_fee', 'debit_wing_wei_luy_transfer_fee', 'credit_wing_wei_luy_transfer_fee'].includes(i.type)) {
                    return true;
                }
                return false;
            }
            );
            const ids = transaction_ids_for_ins_id_update.map(i => i.id);
            await this.transactionService.bulkUpdate(ids, { repayment_schedule_id: instalement_id });
            this.logger.info(`👍 DATABASE: INSTALMENT IDs IN TRANSACTION UPDATION DONE SUCCESSFULLY ${loan.client.full_en}(${loan.client.id})`);
        } catch (e) {
            this.logger.info(`❌ DATABASE: ERROR IN INSTALMENT IDs IN TRANSACTION UPDATION ${loan.client.full_en}(${loan.client.id}) ${e}`);
            this.logger.error(`❌ DATABASE: ERROR IN INSTALMENT IDs IN TRANSACTION UPDATION ${loan.client.full_en}(${loan.client.id}) ${e}`);
        }
    }
}
