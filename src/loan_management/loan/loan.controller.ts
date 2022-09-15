import { CreateLoanDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { LoanService } from "./usecases/loan.service";
import { CustomLogger } from "../../custom_logger";

@Controller('loan')
export class LoanController {
  private readonly logger = new CustomLogger(LoanController.name);
  constructor(
    private readonly loanService: LoanService,
  ) { }

  @Post()
  async createLoan(@Body() createLoanDto: CreateLoanDto) {
    this.logger.log(`Creating loan with request ${JSON.stringify(createLoanDto)}`);
    return await this.loanService.create(createLoanDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log(`Getting loan with request ${+id}`);
    return await this.loanService.findOne({ id: id });
  }

}
