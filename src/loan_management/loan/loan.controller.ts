import { DisbursedLoanDto, CreateLoanDto } from './dto';
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

  @Post('disbursed')
  async disbursed(@Body() disbursedLoanDto: DisbursedLoanDto) {
    this.logger.log(`Disbursed loan with request ${JSON.stringify(disbursedLoanDto)}`);
    return await this.loanService.disbursed(disbursedLoanDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    this.logger.log('Getting loan with request id ='  +id);
    return await this.loanService.findOne({ id: id });
  }

}
