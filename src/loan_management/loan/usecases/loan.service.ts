import { BadRequestException, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InjectRepository } from '@nestjs/typeorm';
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { add } from "date-fns";
import { UpdateApplicationStatusRequestDto } from "src/external/sendpulse/dto/update-application-status-request.dto";
import { CreateZohoLoanApplicationDto } from "src/external/zoho/dreams/zoho-loans/dto/create-loan-appl.dto";
import { CreateLoanApplicationUsecase } from "src/external/zoho/dreams/zoho-loans/usecases/create-loan-application.usecase";
import { CreateRepaymentScheduleDto } from "src/loan_management/repayment_schedule/dto/create-repayment-schedule.dto";
import { CreateRepaymentScheduleUsecase } from "src/loan_management/repayment_schedule/usecases/create_repayment_schedule.service";
import { Repository } from 'typeorm';
import { CustomLogger } from "../../../custom_logger";
import { GlobalService } from "../../../globals/usecases/global.service";
import { CreateRepaymentTransactionDto, DisbursedLoanDto, GetLoanDto, VideoReceivedCallbackDto } from "../dto";
import { GetLoanResponse } from "../dto/get-loan-response.dto";
import { UpdateLoanDto } from "../dto/update-loan.dto";
import { Loan } from '../entities/loan.entity';
import { LoanHelperService } from "./loan-helper.service";
import { SendpulseLoanHelperService } from "./sendpulse-loan-helper.service";
import { ZohoLoanHelperService } from "./zoho-loan-helper.service";

import { MethodParamsRespLogger } from "src/decorator";
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
        private readonly sendpulseLoanHelperService: SendpulseLoanHelperService,
        private eventEmitter: EventEmitter2,
        private readonly createRepaymentScheduleUsecase: CreateRepaymentScheduleUsecase,
    ) { }

    //FIXME: Remove "any" Decorator from createLoanDto object
    //FIXME2: Atomic property is critical here. we are performing multiple actions here.
    //Even, If one Query/Insert in DB fails. all Insertion needs to be reverted. TODO later on
    //FIXME3: Error Handling needs to be done.

    async create(createLoanDto: any): Promise<Loan> {
        try {
            if (!createLoanDto.tenure_in_months) {
                createLoanDto.tenure_in_months = 1;
            }
            createLoanDto.id = 'LN' + Math.floor(Math.random() * 100000000);
            createLoanDto.loan_fee = createLoanDto.tenure_in_months * this.globalService.LOAN_FEES;

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
            this.log.log("Loan Created in LMS. " + loanFromDb.id);

            if (createLoanDto.do_create_zoho_loan) {
                //Step 2: Create Loan in Zoho
                const zohoLoanDto: CreateZohoLoanApplicationDto = await this.createLoanInZoho(createLoanDto);
                this.log.log("Loan Created in zoho. " + zohoLoanDto.dreamerId);

                //Step 3: Update Zoho loan ID in Dreams DB
                //once loan is created in zoho, update zohoLoanID in our DB for future reference.
                // Haven't put "await" here as this action can happen be in parallel.
                this.loanHelperService.updateZohoLoanId(createLoanDto.id, zohoLoanDto.loanId);
                this.log.log("Loan Updated in zoho. " + zohoLoanDto.dreamerId);
            }

            this.sendpulseLoanHelperService.triggerVideoVerificationFlowIfClientHasSuccessfullyPaidLoan(createLoanDto);
            //Step 4: Emit Loan Status 
            //emitting loan approved event in  order to notify admin
            if (createLoanDto.status === this.globalService.LOAN_STATUS.APPROVED
                || createLoanDto.status === this.globalService.LOAN_STATUS.NOT_QUALIFIED) {
                const updateApplStatus = new UpdateApplicationStatusRequestDto();
                updateApplStatus.sendpulse_user_id = createLoanDto.sendpulse_id;
                updateApplStatus.application_status = createLoanDto.status;
                this.eventEmitter.emit('loan.status.changed', (updateApplStatus));
                this.log.log("emit:loan.status.changed");

            }

            //Step 5: Create transactions in Dreams DB
            //create transaction for dream_point_commited in database
            await this.loanHelperService.manageDreamPointCommitedAfterLoanCreation(createLoanDto);
            this.log.log("Created Transaction");

            return loanFromDb;
        } catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING create:  ${error}`);
        }
    }

    async update(updateLoanDto: UpdateLoanDto) {
        this.log.log(`Updating Loan with data ${JSON.stringify(updateLoanDto)}`);
        await this.loanRepository.update(updateLoanDto.id, updateLoanDto);
    }

    @MethodParamsRespLogger(new CustomLogger(LoanService.name))
    async createLoanInZoho(createLoanDto: any): Promise<any> {
        try {
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
            zohoLoanDto.disbursed_amount = createLoanDto.amount - createLoanDto.dream_point;
            zohoLoanDto.wing_wei_luy_transfer_fee = createLoanDto.wing_wei_luy_transfer_fee;
            zohoLoanDto.loan_fee = createLoanDto.loan_fee;
            zohoLoanDto.outstanding_amount = createLoanDto.outstanding_amount;
            zohoLoanDto.sendpulse_url = this.globalService.BASE_SENDPULSE_URL + createLoanDto?.sendpulse_id;;
            zohoLoanDto.retool_url = this.globalService.BASE_RETOOL_URL + "#customer_id=" + createLoanDto?.client_id;;
            return await this.dreamerCreateLoanService.create(zohoLoanDto);
        } catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING createLoanInZoho:  ${error}`);
        }
    }

    async findOneForInternalUse(fields: object): Promise<any> {
        const loan = await this.loanRepository.findOne({
            where: fields,
            order: { ['created_at']: 'DESC' }
        });
        return loan;
    }

    async findAll(client_id: string): Promise<Loan[]> {

        const loans = await this.loanRepository.findBy(
            {
                'client_id': client_id
            },
        );
        return loans;
    }

    async findOne(fields: GetLoanDto): Promise<GetLoanResponse | null> {
        try {
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
            loanResponse.wingCode = "" + loan?.wing_code;
            loanResponse.outstandingBalance = "" + loan?.outstanding_amount;
            loanResponse.membershipTier = client?.tier;
            loanResponse.lastTransactionAmount = "" + await this.loanHelperService.getLoanLastPartialPaymentAmount(loan.id);
            loanResponse.dreamPointsEarned = "" + client?.dream_points_earned;
            loanResponse.nextLoanAmount = "" + this.globalService.TIER_AMOUNT[+client?.tier];
            return loanResponse;
        } catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING findOne:  ${error}`);
        }
    }

    async updateLoanStatus(updateLoanDto: UpdateLoanDto): Promise<any> {
        try {
            updateLoanDto.status = (updateLoanDto.status === "Rejected") ? this.globalService.LOAN_STATUS.NOT_QUALIFIED : updateLoanDto.status;

            await this.loanRepository.update(updateLoanDto.id, { status: updateLoanDto.status });
            if (updateLoanDto.status === this.globalService.LOAN_STATUS.APPROVED
                || updateLoanDto.status === this.globalService.LOAN_STATUS.NOT_QUALIFIED) {

                const updateApplStatus = new UpdateApplicationStatusRequestDto();
                updateApplStatus.sendpulse_user_id = updateLoanDto.sendpulse_user_id;
                updateApplStatus.application_status = updateLoanDto.status;
                this.eventEmitter.emit('loan.status.changed', (updateApplStatus));
            }
            else if (updateLoanDto.status === this.globalService.LOAN_STATUS.CONTRACT_SIGNED) {
                this.log.log(`LOAN SERVICE: Contract Signed: now running Flow_4.8`);
                this.sendpulseLoanHelperService.triggerFlow(updateLoanDto.sendpulse_user_id, this.globalService.SENDPULSE_FLOW['FLOW_4.8']);
            }
        } catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING updateLoanStatus:  ${error}`);
        }
    }

    async disbursed(disbursedLoanDto: DisbursedLoanDto): Promise<any> {
        try {
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
            const zohoKeyValuePairs = {
                Loan_Status: new Choice(this.globalService.ZOHO_LOAN_STATUS.DISBURSED),
                Disbursal_Date: new Date(),
                Repayment_Date: new Date(loan.repayment_date),
                Payment_Status: new Choice(this.globalService.LOAN_PAYMENT_STATUS.PENDING),
            };
            await this.zohoLoanHelperService.updateZohoFields(loan.zoho_loan_id, zohoKeyValuePairs, this.globalService.ZOHO_MODULES.LOAN);

            const crpSch = new CreateRepaymentScheduleDto();
            crpSch.client_id = loan.client_id;
            // loan amount is equal to loan_amount + extra fees
            crpSch.loan_amount = loan.amount + loan.wing_wei_luy_transfer_fee;
            crpSch.loan_id = loan.id;
            crpSch.loan_tenure_in_months = loan.tenure_in_months;
            crpSch.zoho_loan_id = loan.zoho_loan_id;

            this.log.debug("creating repayment schedule for loan" + JSON.stringify(crpSch));
            await this.createRepaymentScheduleUsecase.create(crpSch);

            return disbursedResponse;
        }
        catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING disbursed:  ${error}`);
        }
    }

    async createRepaymentTransaction(createRepaymentTransactionDto: CreateRepaymentTransactionDto): Promise<any> {
        try {
            if (createRepaymentTransactionDto.type == this.globalService.REPAYMENT_TRANSACTION_TYPE.CLIENT_CREDIT) {
                return await this.loanHelperService.handleClientCreditRepayments(createRepaymentTransactionDto);
            }

            if (createRepaymentTransactionDto.type == this.globalService.REPAYMENT_TRANSACTION_TYPE.DREAM_POINT_REFUND) {
                return await this.loanHelperService.handleDreamPointRefundRepayments(createRepaymentTransactionDto);
            }

            return false;
        } catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING createRepaymentTransaction:  ${error}`);
        }
    }

    async videoReceivedCallback(videoReceivedCallbackDto: VideoReceivedCallbackDto): Promise<any> {
        try {
            // FIXME: handle if requested loans are more then one
            const loan = await this.loanRepository.findOne({
                where: {
                    client_id: videoReceivedCallbackDto.client_id,
                    status: this.globalService.LOAN_STATUS.REQUESTED
                },
                order: { ['created_at']: 'DESC' }
            });

            if (!loan) {
                this.log.log(`Requested Loan not found for ${videoReceivedCallbackDto.client_id}`);
                throw new BadRequestException(`No Requested loan found for client id ${videoReceivedCallbackDto.client_id}`);
            }

            await this.zohoLoanHelperService.updateZohoLoanStatus(loan.zoho_loan_id, this.globalService.ZOHO_LOAN_STATUS.VIDEO_REQUEST_SUBMITTED, this.globalService.ZOHO_MODULES.LOAN);
            await this.sendpulseLoanHelperService.triggerFlow(videoReceivedCallbackDto.sendpulse_id, this.globalService.SENDPULSE_FLOW['FLOW_4.9']);
            return true;
        } catch (error) {
            this.log.error(`LOAN SERVICE: ERROR OCCURED WHILE RUNNING videoReceivedCallback:  ${error}`);
        }
    }


}
