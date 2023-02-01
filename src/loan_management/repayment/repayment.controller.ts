import { ProcessRepaymentDto } from './dto';
import { CustomLogger } from "../../custom_logger";
import { Body, Controller, Post } from '@nestjs/common';
import { RepaymentService } from "./services/repayment.service";
import { MethodParamsRespLogger } from 'src/decorator';
@Controller('repayment')
export class RepaymentController {
  private readonly logger = new CustomLogger(RepaymentController.name);
  constructor(
    private readonly repaymentService: RepaymentService,
  ) { }

  @Post('process')
  @MethodParamsRespLogger(new CustomLogger(RepaymentController.name))
  async processRepayment(@Body() processRepaymentDto: ProcessRepaymentDto) {
    return await this.repaymentService.process(processRepaymentDto);
  }

}
