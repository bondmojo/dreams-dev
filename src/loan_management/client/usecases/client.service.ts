import { ConsoleLogger, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientAndLoanDto, CreateClientDto, GetClientDto, UpdateClientDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { LoanService } from "../../loan/usecases/loan.service";
import { OnEvent } from "@nestjs/event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";


@Injectable()
export class ClientService {
    private readonly log = new CustomLogger(ClientService.name);
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly loanService: LoanService,
        private eventEmitter: EventEmitter2
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

}
