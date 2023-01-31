import { Body, Controller, Param, Post } from '@nestjs/common';
import { ZohoTaskRequest } from 'src/external/zoho/dreams/task/zoho-task-request.dto';
import { CustomLogger } from "../../../custom_logger";
import { CreateZohoTaskUsecase } from './task/create-zoho-task.usecase';
import { MethodParamsRespLogger } from 'src/decorator';
@Controller('/zoho/tasks')
export class ZohoTaskController {
  private readonly logger = new CustomLogger(ZohoTaskController.name);
  constructor(
    private readonly createTaskUsecase: CreateZohoTaskUsecase,

  ) { }

  //FIXME: Replace this with generic Task
  @Post(':dreamer_id/create_payment_recieved_task')
  @MethodParamsRespLogger(new CustomLogger(ZohoTaskController.name))
  async createPaymentTask(
    @Param('dreamer_id') id: string) {
    return await this.createTaskUsecase.createPaymentRecievedTask(id);
  }

  @Post(':dreamer_id/create_ticket')
  @MethodParamsRespLogger(new CustomLogger(ZohoTaskController.name))
  async createTask(
    @Body() zohoTask: ZohoTaskRequest) {
    return await this.createTaskUsecase.createTask(zohoTask);
  }
}
