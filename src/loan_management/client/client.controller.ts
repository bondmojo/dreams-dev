import { CreateClientAndLoanDto } from './dto/create-client-and-loan.dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { ClientService } from "./usecases/client.service";
import { CustomLogger } from "../../custom_logger";
import { MethodParamsRespLogger } from 'src/decorator';
@Controller('client')
export class ClientController {
  private readonly logger = new CustomLogger(ClientController.name);
  constructor(
    private readonly clientService: ClientService,
  ) { }

  @Post()
  @MethodParamsRespLogger(new CustomLogger(ClientController.name))
  async createClientAndLoan(@Body() createClientAndLoanDto: CreateClientAndLoanDto) {
    return await this.clientService.create(createClientAndLoanDto);
  }

  @Get(':id')
  @MethodParamsRespLogger(new CustomLogger(ClientController.name))
  async findOne(@Param('id') id: string) {
    return await this.clientService.get({ id: id });
  }

  @Get(':id/contracturl')
  @MethodParamsRespLogger(new CustomLogger(ClientController.name))
  async contracturl(@Param('id') id: string) {
    return await this.clientService.getContracturl(id);
  }

}
