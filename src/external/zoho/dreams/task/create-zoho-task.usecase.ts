import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../../../custom_logger";
import { DreamerRepository } from "../dreamer/repository/dreamer.repository";
import { ZohoTaskRequest } from "./zoho-task-request.dto";
import { GlobalService } from "../../../../globals/usecases/global.service";
import { Client } from "../../../../loan_management/client/entities/client.entity";
import { ClientService } from "../../../../loan_management/client/usecases/client.service";
import { DreamerModel } from '../dreamer/usecases/model/dreamer.model';
import { SendpluseService } from '../../../sendpulse/sendpluse.service';
import { ZohoTaskRepository } from "./zoho-task.repository";

@Injectable()
export class CreateZohoTaskUsecase {
    private readonly log = new CustomLogger(CreateZohoTaskUsecase.name);
    private readonly TASK_TYPE = { RECEIVED_VIDEO: 'received_video' };

    constructor(private readonly repository: ZohoTaskRepository,
        private readonly clientService: ClientService,
        private readonly global: GlobalService,
        private readonly sendpluseService: SendpluseService
    ) { }

    async createTask(task: ZohoTaskRequest): Promise<string> {
        if (!task.dreamer_id && task.sendpulse_id) {
            const client = await this.clientService.findbySendpulseId(task.sendpulse_id);
            task.dreamer_id = client.zoho_id;
        }

        if (task.retool_url_required && task.retool_url_required === "true" && task.dreamer_id) {
            const client = await this.clientService.findbyZohoId(task.dreamer_id);
            task.dreamservice_customer_id = client.id;
        }

        task.due_date = new Date();
        if (!task.assign_to)
            task.assign_to = this.global.DISBURSEMENT_TASK_ASSIGNEE;
        task.status = "Not Started";
        const id = await this.repository.createTask(task.dreamer_id, task);

        // Do other actions on behalf of type
        if (task?.type) {
            switch (task.type) {
                case this.TASK_TYPE.RECEIVED_VIDEO:
                    this.triggerSendpulseFlow(task, this.global.SENDPULSE_FLOW['FLOW_4.9']);
            }
        }
        return id;
    }

    //FIXME: Replace this with generic Task
    async createPaymentRecievedTask(zoho_id: string): Promise<string> {
        const client = await this.clientService.findbyZohoId(zoho_id);
        if (!client) {
            return 'User Not Found For Current Zoho Id'
        }
        const task = new ZohoTaskRequest();
        task.dreamservice_customer_id = client.id;
        //task.due_date = new Date();
        task.assign_to = this.global.DISBURSEMENT_TASK_ASSIGNEE;
        task.subject = "Action Required: Payment Received from " + client.full_en;
        task.status = "Not Started";
        const id = await this.repository.createTask(client.zoho_id, task);
        return id;
    }

    async triggerSendpulseFlow(task: ZohoTaskRequest, flow_id: string) {
        const model = new DreamerModel();
        model.externalId = task.sendpulse_id;
        this.log.log("Running Sendpulse Flow " + " flow_id =" + flow_id);
        return await this.sendpluseService.runFlow(model, flow_id);
    }
}
