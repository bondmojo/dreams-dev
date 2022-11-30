import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { GlobalService } from "../../../globals/usecases/global.service"
import { Repository, In, Between } from 'typeorm';
import { ZohoLoanHelperService } from "./zoho-loan-helper.service";
import { differenceInCalendarDays } from "date-fns"
import { TransactionService } from "../../transaction/usecases/transaction.service";

@Injectable()
export class LoanMigrationService {
    private readonly log = new CustomLogger(LoanMigrationService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly globalService: GlobalService,
        private readonly zohoLoanHelperService: ZohoLoanHelperService,
        private readonly transactionService: TransactionService,
    ) { }


    async migrateData(): Promise<any> {
        const loans = await this.loanRepository.find({
            relations: ['client']
        });
        console.log("Total loans ==", loans.length);
        let count = 0;
        for (let i = 0; i < loans.length; i++) {
            let loan = loans[i];
            try {
                // Updating Loan Data
                const paid_amount = await this.transactionService.getTotalPaidAmount(loan.id);
                const zohoLoanKeyValuePairs: any = {
                    Disbursal_Date: new Date(loan.disbursed_date),
                    Repayment_Date: new Date(loan.repayment_date),
                    Retool_URL: this.globalService.BASE_RETOOL_URL + "#customer_id=" + loan.client.id,
                    Sendpulse_URL: this.globalService.BASE_SENDPULSE_URL + loan.client.sendpulse_id,
                    Loan_Tier_Membership: '' + (loan.tier ? loan.tier : 1),
                    Outstanding_Balance: loan.outstanding_amount,
                    Paid_Amount: paid_amount,
                };
                if (loan.paid_date) {
                    zohoLoanKeyValuePairs.Last_Repaid_Date = new Date(loan.paid_date);
                    zohoLoanKeyValuePairs.Days_Fully_Paid = differenceInCalendarDays(new Date(loan.paid_date), new Date(loan.disbursed_date));
                }
                count++;
                console.log(count, '. Migrating loan :---------------------------------------------------------------------', loan.id);
                await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoLoanKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
                console.log('Loan Migration DONE -------------------------------------------------------- :', loan.id);

                // Updating sendpulse url in Dreamer
                console.log('Migrating Client:--------------------------------------------------------------------- :', loan.client.id);
                const zohoDreamerKeyValuePairs = {
                    Sendpulse_URL: this.globalService.BASE_SENDPULSE_URL + loan.client.sendpulse_id,
                }
                await this.zohoLoanHelperService.updateZohoFields(loan.client.zoho_id, zohoDreamerKeyValuePairs, this.globalService.ZOHO_MODULES.DREAMER);
                console.log('Client Migration DONE:--------------------------------------------------------------------- :', loan.id);

            } catch (e) {
                console.log(`Loan ${loan.id}  has Migration Error ${e}`);
            }
        }

        return 'Done';
    }

}
