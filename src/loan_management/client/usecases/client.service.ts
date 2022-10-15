import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientAndLoanDto, CreateClientDto, GetClientDto, UpdateClientDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { LoanService } from "../../loan/usecases/loan.service";
import { OnEvent } from "@nestjs/event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { GlobalService } from "../../../globals/usecases/global.service"

@Injectable()
export class ClientService {
    private readonly log = new CustomLogger(ClientService.name);
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly loanService: LoanService,
        private eventEmitter: EventEmitter2,
        private readonly globalService: GlobalService
    ) { }

    async create(createClientAndLoanDto: CreateClientAndLoanDto): Promise<Client> {
        // Generating client id
        const createClientDto: CreateClientDto = createClientAndLoanDto;
        createClientDto.id = createClientAndLoanDto.client_id = 'CL' + Math.floor(Math.random() * 100000000);
        const clientFromDb = await this.clientRepository.save(createClientDto);
        const clientClone = { ...clientFromDb };

        // Create loan for client request object
        await this.loanService.create(createClientAndLoanDto);

        //emitting loan approved event in  order to notify admin
        this.eventEmitter.emit('loan.approved', (clientClone));
        return clientFromDb;
    }

    async findOne(fields: GetClientDto): Promise<Client | null> {
        this.log.log("findOne =" + JSON.stringify(fields));
        const client = await this.clientRepository.findOne({
            where: fields,
        });
        return client;
    }

    async findbySendpulseId(id: string): Promise<Client[] | any> {
        this.log.log("findbySendpulseId =" + id);
        const client = await this.clientRepository.findOneBy({ sendpulse_id: id });
        return client;
    }

    async findbyZohoId(id: string): Promise<Client[] | any> {
        this.log.log("findbyZohoId =" + id);
        const client = await this.clientRepository.findOneBy({ zoho_id: id });
        return client;
    }

    async findbyId(clientId: string): Promise<Client[] | any> {
        this.log.log("findbyId =" + clientId);
        const client = await this.clientRepository.findOneBy({ id: clientId });
        return client;
    }

    @OnEvent('client.update')
    async update(updateClientDto: UpdateClientDto) {
        this.log.log(`Updating client with data ${JSON.stringify(updateClientDto)}`);
        await this.clientRepository.update(updateClientDto.id, updateClientDto);
    }

    async getContracturl(clientId: string): Promise<Client[] | any> {
        const client = await this.clientRepository.findOne({ where: { id: clientId }, });
        const loan = await this.loanService.findOneForInternalUse({
            client_id: clientId,
            status: this.globalService.LOAN_STATUS.APPROVED
        })
        if (!loan) {
            return 'No approved loan found for user!';
        }
        const now = new Date();

        let JOTFORM_CONTRACT_URL = process.env.NODE_ENV === "production" ? this.globalService.JOTFORM_CONTRACT_URL.PROD : this.globalService.JOTFORM_CONTRACT_URL.DEV;
        JOTFORM_CONTRACT_URL = JOTFORM_CONTRACT_URL +
            '?date[month]=' + now.getMonth() +
            '&date[day]=' + now.getDate() +
            '&date[year]=' + now.getFullYear() +
            '&todaysDate[month]=' + now.getMonth() +
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
            '&repaymentDate=' + '' +
            '&nationalId=' + (client?.national_id ?? '') +
            '&phoneNumber=' + (client?.mobile ?? '') +
            '&clientId=' + (client?.sendpulse_id ?? '');

        this.log.log(`JOTFORM_CONTRACT_URL ==> ${JOTFORM_CONTRACT_URL}`);
        return { contract_form_url: JOTFORM_CONTRACT_URL };
    }
}
