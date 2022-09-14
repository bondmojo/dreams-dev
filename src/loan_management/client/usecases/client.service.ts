import { Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { CreateClientDto, GetClientDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../../../entities/client.entity';
import { Repository } from 'typeorm';

@Injectable()
export class ClientService {
    private readonly log = new CustomLogger(ClientService.name);
    constructor(
        @InjectRepository(Client)
        private readonly clientRepository: Repository<Client>,
    ) { }

    async create(createClientDto: CreateClientDto): Promise<Client> {
        const clientFromDb = await this.clientRepository.save(createClientDto);
        return clientFromDb;
    }

    async findOne(fields: GetClientDto): Promise<Client | null> {
        const client = await this.clientRepository.findOne({
            where: fields,
        });
        return client;
    }

}
