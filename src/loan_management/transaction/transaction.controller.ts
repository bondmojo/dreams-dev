import { CreateTransactionDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { TransactionService } from "./usecases/transaction.service";
import { CustomLogger } from "../../custom_logger";

@Controller('transaction')
export class TransactionController {
  private readonly logger = new CustomLogger(TransactionController.name);
  constructor(
    private readonly transactionService: TransactionService,
  ) { }

  @Post()
  async createTransaction(@Body() createTransactionDto: CreateTransactionDto) {
    this.logger.log(`Creating transaction with request ${JSON.stringify(createTransactionDto)}`);
    return await this.transactionService.create(createTransactionDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Getting transaction with request ${+id}`);
    return await this.transactionService.findOne({ id: id });
  }

}
