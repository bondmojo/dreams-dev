import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../../globals/usecases/global.service"
import { Repository, In, Between } from 'typeorm';
import { ZohoLoanHelperService } from "./zoho-loan-helper.service";
import { differenceInCalendarDays } from "date-fns"
import { TransactionService } from "../../transaction/usecases/transaction.service";
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
import { ClientService } from '../../client/usecases/client.service';
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { ZohoInstallmentFields } from "src/globals/zoho_fields_mapping/Installment";
import { GetTransactionDto } from "src/loan_management/transaction/dto";
import { ZohoRepaymentScheduleHelper } from "src/loan_management/repayment_schedule/usecases/ZohoRepaymentScheduleHelper";
import { RepaymentScheduleService } from "src/loan_management/repayment_schedule/usecases/repayment_schedule.service";
import { SENSPULSE_TELEGRAM_ID_PAIR } from "../data-migration/sendpulse-telegram-id-pair";
@Injectable()
export class LoanMigrationService {
    private readonly log = new CustomLogger(LoanMigrationService.name);
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
    ) { }

    async migrateData(): Promise<any> {
        // Migrate client table data
        // await this.migrateClientData();

        // migration loan table data
        await this.migrateLoanData();

        return 'Done';
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
        }

        return model;
    }

    async migrateLoanData() {
        const loans = await this.loanRepository.find({
            relations: ['client', 'transaction'],
        });
        console.log("Total loans ==", loans.length);
        let count = 0;
        for (let i = 0; i < loans.length; i++) {
            const loan = loans[i];

            if (loan.id != "LN17817476") {
                continue;
            }
            try {

                console.log("****Start count ------------->", count, loan.id);
                /**
                * Update client_in in all transaction
                */
                //  await this.updateLoanAllTransactions(loan);

                /** 
                 * Updating Loan Tenure Info in db, zoho, sendpuse
                 * */
                // await this.updateLoanTenure(loan);

                /**
                 * Create Instalment for only disbursed & fully paid loan.
                 * For request & approved loan, the instalment will automatically create on oan disbursment.
                 */
                if (["Disbursed", "Fully Paid"].includes(loan.status)) {
                    const instalement_id = 'INS' + Math.floor(Math.random() * 100000000);
                    const ins_zoho_id = await this.createInsOnZoho(loan, instalement_id);
                    await this.createInsInDb(loan, ins_zoho_id, instalement_id);
                    await this.updateInsIdInTransactions(loan, instalement_id);
                }

                console.log("****End count ------------->", count);
                count++;
            } catch (e) {
                console.error(`Loan ${loan.id}  has Migration Error ${e}`);
            }

        }
    }

    async migrateClientData() {
        const clients = await this.clientService.find({});
        for (let i = 0; i < clients.length; i++) {
            const client = clients[i];
            try {
                console.log("Migrating Client:", i, client.id);
                const telegram_id = SENSPULSE_TELEGRAM_ID_PAIR[client.sendpulse_id as keyof typeof SENSPULSE_TELEGRAM_ID_PAIR];
                if (telegram_id) {
                    client.telegram_id = telegram_id['t_id'];
                    await this.clientService.update(client);
                }
            } catch (e) {
                console.error(`Client ${client.id}  has Migration Error ${e}`);
            }
        }
        console.log("-------- Client Migration Done");
    }

    async updateLoanTenure(loan: Loan) {
        // Update Tenure Info on Zoho
        const loan_retool_url = this.globalService.DREAMS_RETOOL_URL + "#customer_id=" + loan?.client_id;
        const zohoLoanKeyValuePairs: any = {
            Tenure: 1,
            Tenure_Type: this.globalService.LOAN_TENURE_TYPE.MONTHLY,
            Retool_URL: loan_retool_url
        };

        await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoLoanKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
        console.log('ZOHO: Loan Updation DONE ', loan.id);

        // Update Tenure info in DB
        const updateLoanDto: any = {};
        updateLoanDto.id = loan.id;
        updateLoanDto.tenure = 1;
        updateLoanDto.tenure_type = "Monthly"
        await this.loanRepository.update(updateLoanDto.id, updateLoanDto);
        console.log('DB: Loan Updation DONE ', loan.id);

        // Update Tenure info in sendpulse

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
    }

    async createInsOnZoho(loan: Loan, instalement_id: string): Promise<string> {
        const ins_db_obj = this.getInsDBOjbect(loan);
        ins_db_obj.id = instalement_id;
        const ins_zoho_record = await this.getInsZohoRecord(ins_db_obj, loan);
        const [ins_zoho_id] = await this.zohoRepaymentScheduleHelper.createZohoRepaymentSchedule([ins_zoho_record]);
        return ins_zoho_id;
    }

    async createInsInDb(loan: Loan, ins_zoho_id: string, instalement_id: string) {
        const ins_db_obj = this.getInsDBOjbect(loan);
        ins_db_obj.id = instalement_id
        ins_db_obj.zoho_repayment_schedule_id = ins_zoho_id;
        return await this.repaymentScheduleService.save(ins_db_obj);
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

    async updateLoanAllTransactions(loan: Loan) {
        const transaction_ids = loan.transaction.map(i => i.id);
        await this.transactionService.bulkUpdate(transaction_ids, { client_id: loan.client_id });
        console.log('updateLoanAllTransactions Done ', loan.id);
    }

    async updateInsIdInTransactions(loan: Loan, instalement_id: string) {
        const transaction_ids_for_ins_id_update = loan.transaction.filter(i => {
            if (['credit_repayment', 'fee_payment', 'partial_payment', 'late_fee', 'debit_wing_wei_luy_transfer_fee', 'credit_wing_wei_luy_transfer_fee'].includes(i.type)) {
                return true;
            }
            return false;

        }
        );
        const ids = transaction_ids_for_ins_id_update.map(i => i.id);
        await this.transactionService.bulkUpdate([], { repayment_schedule_id: instalement_id });
        console.log('Add Installment Ids in Loan Transaction Done ', loan.id);
    }
}
