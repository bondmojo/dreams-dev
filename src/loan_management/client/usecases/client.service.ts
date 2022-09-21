import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientAndLoanDto, CreateClientDto, GetClientDto, UpdateClientDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { LoanService } from "../../loan/usecases/loan.service";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class ClientService {
    private readonly logger = new CustomLogger(ClientService.name);
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly loanService: LoanService,
    ) { }

    async create(createClientAndLoanDto: CreateClientAndLoanDto): Promise<Client> {
        // Generating client id
        const createClientDto: CreateClientDto = createClientAndLoanDto;
        createClientDto.id = createClientAndLoanDto.client_id = 'CL' + Math.floor(Math.random() * 100000000);
        const clientFromDb = await this.clientRepository.save(createClientDto);

        // Create loan for client request object
        await this.loanService.create(createClientAndLoanDto);;
        return clientFromDb;
    }

    async findOne(fields: GetClientDto): Promise<Client | null> {
        const client = await this.clientRepository.findOne({
            where: fields,
        });
        return client;
    }

    @OnEvent('client.update')
    async update(updateClientDto: UpdateClientDto) {
        this.logger.log(`Updating client with data ${JSON.stringify(updateClientDto)}`);
        await this.clientRepository.update(updateClientDto.id, updateClientDto);
    }

}
