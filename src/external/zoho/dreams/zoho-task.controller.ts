import { Body, Controller, Param, Post } from '@nestjs/common';
import { ZohoTaskRequest } from 'src/external/zoho/dreams/task/zoho-task-request.dto';
import { CustomLogger } from "../../../custom_logger";
import { CreateDreamerUsecase } from "./dreamer/usecases/create-dreamer.usecase";
import { CreateZohoTaskUsecase } from './task/create-zoho-task.usecase';
import { InitiateKycUsecase } from "./dreamer/usecases/initiate-kyc.usecase";
import { UpdateAdditionalDetailsUsecase } from "./dreamer/usecases/update-additional-details.usecase";
import { UpdatePaymentDetailsUsecase } from "./dreamer/usecases/update-payment-details.usecase";

@Controller('task')
export class ZohoTaskController {
  private readonly logger = new CustomLogger(ZohoTaskController.name);
  constructor(
    private readonly createTaskUsecase: CreateZohoTaskUsecase,

  ) { }

  //FIXME: Replace this with generic Task
  @Post(':id/create_payment_recieved_task')
  async createPaymentTask(
    @Param('id') id: string) {
    this.logger.log(`Creating payment recieved task with request ${JSON.stringify(id)}`);
    return await this.createTaskUsecase.createPaymentRecievedTask(id);
  }

  @Post(':id/create_ticket')
  async createTask(
    @Body() zohoTask: ZohoTaskRequest) {
    this.logger.log(`Creating zoho task with request ${JSON.stringify(zohoTask)}`);
    return await this.createTaskUsecase.createTask(zohoTask);
  }
}
