import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { DisbursedLoanDto, CreateRepaymentTransactionDto, GetLoanDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Loan } from '../entities/loan.entity';
import { LoanHelperService } from "./loan-helper.service";
import { GlobalService } from "../../../globals/usecases/global.service"
import { GetLoanResponse } from "../dto/get-loan-response.dto";
import { Repository, In, Between } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { add, addDays, endOfDay, format } from "date-fns";
import { CreateLoanApplicationUsecase } from "src/dreamer/usecases/create-loan-application.usecase";
import { CreateZohoLoanApplicationDto } from "src/dreamer/usecases/dto/create-loan-appl.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { UpdateApplicationStatusRequestDto } from "src/external/sendpulse/dto/update-application-status-request.dto";
import { UpdateLoanDto } from "../dto/update-loan.dto";
import { ZohoLoanHelperService } from "./zoho-loan-helper.service";


@Injectable()
export class LoanService {
    private readonly log = new CustomLogger(LoanService.name);
    constructor(
        @InjectRepository(Loan)
        private readonly loanRepository: Repository<Loan>,
        private readonly loanHelperService: LoanHelperService,
        private readonly globalService: GlobalService,
        private readonly dreamerCreateLoanService: CreateLoanApplicationUsecase,
        private readonly zohoLoanHelperService: ZohoLoanHelperService,
        private eventEmitter: EventEmitter2,
    ) { }

    // FIXME: Remove "any" Decorator from createLoanDto object
    async create(createLoanDto: any): Promise<Loan> {
        this.log.log("Creating Loan in LMS. Zoho Loan Required =" + createLoanDto.do_create_zoho_loan);

        createLoanDto.id = 'LN' + Math.floor(Math.random() * 100000000);
        createLoanDto.loan_fee = this.globalService.LOAN_FEES;

        // calculate outstanding balance & wing_wei_luy_transfer_fee
        createLoanDto.wing_wei_luy_transfer_fee = 0;
        createLoanDto.outstanding_amount = +createLoanDto.amount + +createLoanDto.loan_fee;
        const today = new Date(); // current time
        createLoanDto.repayment_date = add(today, { months: 1 }); // today + tenure_in_months
        // if wire_transfer_type is mobile then calc wing_wei_luy_transfer_fee and add it into outstanding_amount
        if (createLoanDto?.wire_transfer_type == this.globalService.WIRE_TRANSFER_TYPES.MOBILE) {
            const disbursed_amount = +createLoanDto.amount - +createLoanDto.dream_point;
            createLoanDto.wing_wei_luy_transfer_fee = +this.globalService.CALC_WING_WEI_LUY_TRANSFER_FEE(disbursed_amount);
            createLoanDto.outstanding_amount = +createLoanDto.outstanding_amount + +createLoanDto.wing_wei_luy_transfer_fee;
        }
        //Step 1; Create Loan in Dreams DB
        const loanFromDb = await this.loanRepository.save(createLoanDto);

        if (createLoanDto.do_create_zoho_loan) {
            //Step 2: Create Loan in Zoho
            const zohoLoanDto: CreateZohoLoanApplicationDto = await this.createLoanInZoho(createLoanDto);

            //Step 3: Update Zoho loan ID in Dreams DB
            //once loan is created in zoho, update zohoLoanID in our DB for future reference.
            // Haven't put "await" here as this action can happen be in parallel.
            this.loanHelperService.updateZohoLoanId(createLoanDto.id, zohoLoanDto.loanId);
        }

        //Step 4: Emit Loan Status 
        //emitting loan approved event in  order to notify admin
        if (createLoanDto.status === "Approved" || createLoanDto.status === "Not Qualified") {
            const updateApplStatus = new UpdateApplicationStatusRequestDto();
            updateApplStatus.sendpulse_user_id = createLoanDto.sendpulse_id;
            updateApplStatus.application_status = createLoanDto.status;
            this.eventEmitter.emit('loan.status.changed', (updateApplStatus));
        }

        //Step 5: Create transactions in Dreams DB
        //create transaction for dream_point_commited in database
        await this.loanHelperService.manageDreamPointCommitedAfterLoanCreation(createLoanDto);
        return loanFromDb;
    }

    async createLoanInZoho(createLoanDto: any) {

        const zohoLoanDto = new CreateZohoLoanApplicationDto();
        zohoLoanDto.lmsLoanId = createLoanDto.id;
        zohoLoanDto.dreamPoints = createLoanDto.dream_point;
        zohoLoanDto.dreamerId = createLoanDto.zoho_id;
        zohoLoanDto.loanAmount = createLoanDto.amount;
        //FIXME: STATUS Shall come from API body
        zohoLoanDto.loanStatus = createLoanDto.status;
        zohoLoanDto.paymentAccountNumber = createLoanDto.acc_number;
        zohoLoanDto.preferredPaymentMethod = createLoanDto.acc_provider_type;
        zohoLoanDto.paymentVia = createLoanDto.wire_transfer_type;
        zohoLoanDto.membershipTier = createLoanDto.membership_tier;

        return await this.dreamerCreateLoanService.create(zohoLoanDto);
    }

    async findOneForInternalUse(fields: object): Promise<any> {
        const loan = await this.loanRepository.findOne({
            where: fields,
            order: { ['created_at']: 'DESC' }
        });
        return loan;
    }

    async findOne(fields: GetLoanDto): Promise<GetLoanResponse | null> {
        const loan = await this.loanRepository.findOne({
            where: fields,
            relations: ['client']
        });
        this.log.log("LOAN DATA =" + JSON.stringify(loan));

        const loanResponse = new GetLoanResponse();
        if (!loan) {
            loanResponse.status = false;
            return loanResponse
        }
        const client = loan?.client;
        loanResponse.status = true;
        loanResponse.dreamPoints = "" + (client?.dream_points_earned + client?.dream_points_committed);
        loanResponse.loanAmount = "" + (loan?.amount - loan?.dream_point);
        loanResponse.wireTransferType = loan?.wire_transfer_type;
        loanResponse.loanStatus = loan?.status;
        loanResponse.dueDate = "" + loan?.repayment_date;
        loanResponse.outstandingBalance = "" + loan?.outstanding_amount;
        loanResponse.membershipTier = client?.tier;
        loanResponse.lastTransactionAmount = "" + await this.loanHelperService.getLoanLastPartialPaymentAmount(loan.id);
        loanResponse.dreamPointsEarned = "" + client?.dream_points_earned;
        loanResponse.nextLoanAmount = "" + this.globalService.TIER_AMOUNT[+client?.tier];
        return loanResponse;
    }

    async updateLoanStatus(loanId: string, updateLoanDto: UpdateLoanDto): Promise<any> {
        updateLoanDto.status = (updateLoanDto.status === "Rejected") ? "Not Qualified" : updateLoanDto.status;

        await this.loanRepository.update(loanId, { status: updateLoanDto.status });
        if (updateLoanDto.status === "Approved" || updateLoanDto.status === "Rejected") {

            const updateApplStatus = new UpdateApplicationStatusRequestDto();
            updateApplStatus.sendpulse_user_id = updateLoanDto.sendpulse_user_id;
            updateApplStatus.application_status = updateLoanDto.status;
            this.eventEmitter.emit('loan.status.changed', (updateApplStatus));
        }

    }

    async disbursed(disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        const disbursedResponse = { status: true };
        const loan = await this.loanRepository.findOne({
            where: { id: disbursedLoanDto.loan_id },
            relations: ['client']
        });

        if (!loan || loan.status != this.globalService.LOAN_STATUS.APPROVED) {
            throw new BadRequestException('Forbidden', 'No Approved loan found for loan id');
        }
        await this.loanHelperService.createCreditDisbursementTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.checkAndCreateWingTransferFeeTransaction(loan, disbursedLoanDto);
        await this.loanHelperService.updateLoanDataAfterDisbursement(loan, disbursedLoanDto);
        await this.loanHelperService.triggerSendpulseUpdateApplicationStatus(loan, disbursedLoanDto);

        await this.zohoLoanHelperService.updateZohoLoanStatus(loan.zoho_loan_id, this.globalService.ZOHO_LOAN_STATUS.DISBURSED, this.globalService.ZOHO_MODULES.LOAN);
        return disbursedResponse;
    }

    async createRepaymentTransaction(createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        if (createRepaymentTransactionDto.type == this.globalService.REPAYMENT_TRANSACTION_TYPE.CLIENT_CREDIT) {
            return await this.loanHelperService.handleClientCreditRepayments(createRepaymentTransactionDto);
        }

        if (createRepaymentTransactionDto.type == this.globalService.REPAYMENT_TRANSACTION_TYPE.DREAM_POINT_REFUND) {
            return await this.loanHelperService.handleDreamPointRefundRepayments(createRepaymentTransactionDto);
        }

        return false;
    }
}
