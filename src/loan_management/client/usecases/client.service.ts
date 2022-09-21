import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientAndLoanDto, GetClientDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { LoanService } from "../../loan/usecases/loan.service";

@Injectable()
export class ClientService {
    private readonly log = new CustomLogger(ClientService.name);
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
        private readonly loanService: LoanService,
    ) { }

    async create(createClientAndLoanDto: CreateClientAndLoanDto): Promise<Client> {

        // Generating client id
        createClientAndLoanDto.id = createClientAndLoanDto.client_id = 'CL' + Math.floor(Math.random() * 100000000);
        const clientFromDb = await this.clientRepository.save(createClientAndLoanDto);

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

    async findbyId(clientId: string): Promise<Client | null> {
        const client = await this.clientRepository.findOneBy({
            id : clientId
        });
        return client;
    }

}
