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
import { UpdateClientDto } from "../../client/dto";

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
    ) { }


    async migrateData(): Promise<any> {
        const loans = await this.loanRepository.find({
            relations: ['client']
        });
        console.log("Total loans ==", loans.length);
        let count = 0;
        for (let i = 0; i < loans.length; i++) {
            const loan = loans[i];
            try {
                // Updating Loan Data
                const zohoLoanKeyValuePairs: any = {
                    Wing_Wei_Luy_Transfer_Fee: Number(loan.wing_wei_luy_transfer_fee),
                    Loan_Fee: this.globalService.LOAN_FEES,
                    Disbursed_Amount: loan.amount - loan.dream_point,
                };

                count++;
                console.log(count, '. Migrating loan :---------------------------------------------------------------------', loan.id);
                await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoLoanKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);
                console.log('Loan Migration DONE -------------------------------------------------------- :', loan.id);


                const sendpulse_user = await this.sendpulseService.getContact(loan.client.sendpulse_id);
                console.log("Updating Sendpulse UTM params in DB and Zoho", sendpulse_user);
                const zohoDreamerKeyValuePairs = {
                    utm_Source: sendpulse_user.variables.utm_source,
                    utm_Medium: sendpulse_user.variables.utm_medium,
                    utm_Campaign: sendpulse_user.variables.utm_campaign,
                }
                console.log("zohoDreamerKeyValuePairs ==", zohoDreamerKeyValuePairs);
                await this.zohoLoanHelperService.updateZohoFields(loan.client.zoho_id, zohoDreamerKeyValuePairs, this.globalService.ZOHO_MODULES.DREAMER);

                //    Update UTM params in DB
                const updateClientDto = new UpdateClientDto();
                updateClientDto.id = loan.client_id;
                updateClientDto.utm_source = sendpulse_user.variables.utm_source;
                updateClientDto.utm_medium = sendpulse_user.variables.utm_medium;
                updateClientDto.utm_campaign = sendpulse_user.variables.utm_campaign;
                console.log("Updating client ==", updateClientDto);
                this.clientService.update(updateClientDto);
                console.log('Client Migration DONE:--------------------------------------------------------------------- :', loan.client_id);

            } catch (e) {
                console.log(`Loan ${loan.id}  has Migration Error ${e}`);
            }
        }

        return 'Done';
    }

}
