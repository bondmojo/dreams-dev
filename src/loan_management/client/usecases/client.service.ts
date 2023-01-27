import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientAndLoanDto, CreateClientDto, GetClientDto, UpdateClientDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { LoanService } from "../../loan/usecases/loan.service";
import { OnEvent } from "@nestjs/event-emitter";
import { GlobalService } from "../../../globals/usecases/global.service"
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
import { format } from 'date-fns';
import { MethodParamsRespLogger } from "src/decorator";
@Injectable()
export class ClientService {
    private readonly log = new CustomLogger(ClientService.name);
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly loanService: LoanService,
        private readonly globalService: GlobalService,
        private readonly sendpulseService: SendpluseService
    ) { }

    async create(createClientAndLoanDto: CreateClientAndLoanDto): Promise<Client> {
        try {
            // Generating client id
            const createClientDto: CreateClientDto = createClientAndLoanDto;
            createClientDto.id = createClientAndLoanDto.client_id = 'CL' + Math.floor(Math.random() * 100000000);
            const clientFromDb = await this.clientRepository.save(createClientDto);
            const clientClone = { ...clientFromDb };

            //
            this.sendpulseService.createClientId(clientClone);

            // Create loan for client request object
            await this.loanService.create(createClientAndLoanDto);
            return clientFromDb;
        } catch (error) {
            this.log.error(`CLIENT SERVICE: ERROR OCCURED WHILE RUNNING create:  ${error}`);
        }
    }

    async get(fields: GetClientDto): Promise<any> {
        try {
            const client = await this.clientRepository.findOne({
                where: fields,
            });
            // appending max_credit_amount to client object
            const max_credit_amount = this.globalService.TIER_AMOUNT[client.tier];
            const today_date = format(new Date(), 'do MMMM yyyy');
            return { ...client, max_credit_amount: max_credit_amount, today_date: today_date };
        } catch (error) {
            this.log.error(`CLIENT SERVICE: ERROR OCCURED WHILE RUNNING get:  ${error}`);
        }
    }

    async findbySendpulseId(id: string): Promise<Client[] | any> {
        const client = await this.clientRepository.findOneBy({ sendpulse_id: id });
        return client;
    }

    async findbyZohoId(id: string): Promise<Client[] | any> {
        const client = await this.clientRepository.findOneBy({ zoho_id: id });
        return client;
    }

    async findbyId(clientId: string): Promise<Client[] | any> {
        const client = await this.clientRepository.findOneBy({ id: clientId });
        return client;
    }

    @OnEvent('client.update')
    async update(updateClientDto: UpdateClientDto) {
        return await this.clientRepository.update(updateClientDto.id, updateClientDto);
    }

    async getContracturl(clientId: string): Promise<Client[] | any> {
        try {
            const client = await this.clientRepository.findOne({ where: { id: clientId }, });

            //FIXME: Currently fetching only Approved Record. Considering there will only be one approved record in DB.
            const loan = await this.loanService.findOneForInternalUse({
                client_id: clientId,
                status: this.globalService.LOAN_STATUS.APPROVED
            })
            if (!loan) {
                return 'No approved loan found for user!';
            }

            const has_successfully_paid_loan = (await this.loanService.findOneForInternalUse({
                client_id: clientId,
                status: this.globalService.LOAN_STATUS.FULLY_PAID
            })) ? true : false;

            const now = new Date();
            let JOTFORM_CONTRACT_URL = process.env.NODE_ENV === "production" ? this.globalService.JOTFORM_CONTRACT_URL.PROD : this.globalService.JOTFORM_CONTRACT_URL.DEV;
            JOTFORM_CONTRACT_URL = JOTFORM_CONTRACT_URL +
                '?date[month]=' + (now.getMonth() + 1) +
                '&date[day]=' + now.getDate() +
                '&date[year]=' + now.getFullYear() +
                '&todaysDate[month]=' + (now.getMonth() + 1) +
                '&todaysDate[day]=' + now.getDate() +
                '&todaysDate[year]=' + now.getFullYear() +
                '&name[first]=' + (client?.first ?? '') +
                '&name[last]=' + (client?.last ?? '') +
                '&streetAddress=' + (client?.street ?? '') +
                '&village=' + (client?.village ?? '') +
                '&commune=' + (client?.commune ?? '') +
                '&district=' + (client?.district ?? '') +
                '&province=' + (client?.province ?? '') +
                '&borrowAmount=' + (loan.amount ?? '') +
                '&repaymentAmount=' + (loan.outstanding_amount ?? '') +
                '&repaymentDate=' + (loan.repayment_date ?? '') +
                '&nationalId=' + (client?.national_id ?? '') +
                '&phoneNumber=' + (client?.mobile ?? '') +
                '&clientId=' + (client?.zoho_id ?? '') +
                '&clientId=' + (client?.zoho_id ?? '') +
                '&hasSuccessfullyPaidLoan=' + (has_successfully_paid_loan ?? '') +
                '&lmsLoanId=' + (loan?.id ?? '');

            this.log.log(`JOTFORM_CONTRACT_URL ==> ${JOTFORM_CONTRACT_URL}`);

            return { contract_form_url: encodeURI(JOTFORM_CONTRACT_URL) };
        } catch (error) {
            this.log.error(`CLIENT SERVICE: ERROR OCCURED WHILE RUNNING getContracturl:  ${error}`);
        }
    }
}
