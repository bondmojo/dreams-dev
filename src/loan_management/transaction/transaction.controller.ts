import { CreateTransactionDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { TransactionService } from "./usecases/transaction.service";
import { CustomLogger } from "../../custom_logger";
import { MethodParamsRespLogger } from 'src/decorator';
@Controller('transaction')
export class TransactionController {
  private readonly logger = new CustomLogger(TransactionController.name);
  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  @Post()
  @MethodParamsRespLogger(new CustomLogger(TransactionController.name))
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    return await this.transactionService.create(createTransactionDto);
  }

  @Get(':id')
  @MethodParamsRespLogger(new CustomLogger(TransactionController.name))
  async findOne(@Param('id') id: string) {
    return await this.transactionService.findOne({ id: id });
  }

}
