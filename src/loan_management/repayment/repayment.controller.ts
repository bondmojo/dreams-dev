import { ProcessRepaymentDto } from './dto';
import { CustomLogger } from "../../custom_logger";
import { Body, Controller, Post } from '@nestjs/common';
import { RepaymentService } from "./services/repayment.service";

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
