import { ProcessRepaymentDto } from './dto';
import { Body, Controller, Param, Post, Get } from '@nestjs/common';
import { RepaymentService } from "./repayment.service";
import { CustomLogger } from "../../custom_logger";

@Controller('repayment')
export class RepaymentController {
  private readonly logger = new CustomLogger(RepaymentController.name);
  constructor(
    private readonly repaymentService: RepaymentService,
  ) { }

  @Post('process')
  async processRepayment(@Body() processRepaymentDto: ProcessRepaymentDto) {
    this.logger.log(`Processing Repayment For ${JSON.stringify(processRepaymentDto)}`);
    return await this.repaymentService.process(processRepaymentDto);
  }

}
