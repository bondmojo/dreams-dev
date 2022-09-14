import { CreateClientDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { ClientService } from "./usecases/client.service";
import { CustomLogger } from "../../custom_logger";

@Controller('client')
export class ClientController {
  private readonly logger = new CustomLogger(ClientController.name);
  constructor(
    private readonly clientService: ClientService,
  ) { }

  @Post('create')
  async createClient(@Body() createClientRequestDto: CreateClientDto) {
    this.logger.log(`Creating client with request ${JSON.stringify(createClientRequestDto)}`);
    return await this.clientService.create(createClientRequestDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Getting client with request ${+id}`);
    return await this.clientService.findOne({ id: id });
  }

}
