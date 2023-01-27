import { Injectable } from "@nestjs/common";
import { Field } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/field";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { User } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/users/user";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { GlobalService } from "src/globals/usecases/global.service";
import { CustomLogger } from "../../../../../custom_logger";
import { ZohoService } from "../../../core/zoho.service";
import { PaymentDetailsRequestDto } from "../dto/payment-details-request.dto";
import { CreateZohoLoanApplicationDto } from "../dto/create-loan-appl.dto";
import { DreamerRepository } from "../../dreamer/repository/dreamer.repository";
import { MethodParamsRespLogger } from "src/decorator";
@Injectable()
export class ZohoLoanRepository {
    private readonly log = new CustomLogger(ZohoLoanRepository.name);

    constructor(private readonly zohoservice: ZohoService,
        private readonly globalService: GlobalService,
        private readonly dreamerRepository: DreamerRepository
    ) { }

    async createLoanApplication(dreamerId: string, loanDto: CreateZohoLoanApplicationDto): Promise<CreateZohoLoanApplicationDto> {

        const dreamerModel = this.dreamerRepository.getDreamer(dreamerId);

        const record = new Record();
        //Set dreamerId/leadid
        const id = BigInt(dreamerId);
        const dreamer = new Record();
        dreamer.setId(id);

        const user = new User();
        //Assign to lead owner(Kalyana)
        user.setId(BigInt(process.env.ZOHO_LEAD_OWNER_ID));
        record.addFieldValue(Field.Leads.OWNER, user);

        record.addKeyValue("Dreamer_Name", dreamer);
        record.addKeyValue("Name", loanDto.lmsLoanId);

        record.addKeyValue("Loan_Ammount", Number(loanDto.loanAmount));
        record.addKeyValue('Outstanding_Balance', Number(loanDto.outstanding_amount));
        record.addKeyValue("Membership_Point", Number(loanDto.dreamPoints));
        record.addKeyValue('Disbursed_Amount', Number(loanDto.disbursed_amount));
        record.addKeyValue('Loan_Fee', Number(loanDto.loan_fee));
        record.addKeyValue('Wing_Wei_Luy_Transfer_Fee', Number(loanDto.wing_wei_luy_transfer_fee));
        record.addKeyValue('Sendpulse_URL', loanDto.sendpulse_url);
        record.addKeyValue('Retool_URL', loanDto.retool_url);


        record.addKeyValue('Provider_Bank', loanDto.preferredPaymentMethod);
        record.addKeyValue('Account_No', loanDto.paymentAccountNumber);
        record.addKeyValue('Payment_Via', loanDto.paymentVia);

        record.addKeyValue('Tenure', loanDto.tenure);
        record.addKeyValue('Tenure_Type', loanDto.tenureType);

        record.addKeyValue("Loan_Status", new Choice(loanDto.loanStatus));
        if (!loanDto.membershipTier) {
            this.log.log("no membership tier found. for =" + (await dreamerModel).name);
            loanDto.membershipTier = "1";
        }
        record.addKeyValue("Loan_Tier_Membership", '' + loanDto.membershipTier);

        const map: Map<string, any> = await this.zohoservice.saveRecord(record, 'Loans');
        this.log.log(`Successfully saved user loan for zoho user ${dreamerId} as ${map.get('id')}`);

        loanDto.loanId = (map.get('id') as bigint).toString();
        return loanDto;
    }

    async updateLoanPaymentDetails(id: string, paymentDetails: PaymentDetailsRequestDto): Promise<string> {
        const record = new Record();

        record.addKeyValue('Payment_Via', paymentDetails.paymentVia);
        record.addKeyValue('Account_No', paymentDetails.paymentAccountNumber);
        record.addKeyValue('Provider_Bank', paymentDetails.preferredPaymentMethod);

        const map: Map<string, any> = await this.zohoservice.updateRecord(id, record, "Loans");

        this.log.log(`Successfully updated user ${id} data`);

        return (map.get('id') as bigint).toString();
    }

}
