import { Injectable } from "@nestjs/common";
import { SendpluseService } from "../../external/sendpulse/sendpluse.service";
import { CustomLogger } from "../../custom_logger";
import { SendPulseContactDto } from "../../external/sendpulse/dto/send-pulse-contact.dto";
import { DreamerRepository } from "../repository/dreamer.repository";
import { ZohoTaskRequest } from "./dto/zoho-task-request.dto";
import { OnEvent } from "@nestjs/event-emitter";
import { GlobalService } from "../../globals/usecases/global.service";
import { Client } from "../../loan_management/client/entities/client.entity";
import { ClientService } from "../../loan_management/client/usecases/client.service";

@Injectable()
export class CreateZohoTaskUsecase {
    private readonly log = new CustomLogger(CreateZohoTaskUsecase.name);
    constructor(private readonly repository: DreamerRepository,
        private readonly clientService: ClientService,
        private readonly global: GlobalService) { }

    async createPaymentRecievedTask(zoho_id: string): Promise<string> {
        const client = await this.clientService.findbyZohoId(zoho_id);
        if (!client) {
            return 'User Not Found For Current Zoho Id'
        }
        const task = new ZohoTaskRequest();
        task.dreamservice_customer_id = client.id;
        task.due_date = new Date();
        task.assign_to = this.global.DISBURSEMENT_TASK_ASSIGNEE;
        task.subject = "Payment Recieved of " + client.full_en;
        task.status = "Not Started";
        const id = await this.repository.createTask(client.zoho_id, task);
        return id;
    }

    @OnEvent('loan.approved')
    async createDisbursementTask(client: Client): Promise<string> {
        this.log.log("Received Loan Approved EVENT: now createDisbursementTask =" + JSON.stringify(client));
        const task = new ZohoTaskRequest();
        task.assign_to = this.global.DISBURSEMENT_TASK_ASSIGNEE;
        task.subject = "Disburse Loan to " + client.full_en;
        task.dreamservice_customer_id = client.id;
        task.due_date = new Date();
        task.status = "Not Started";
        const id = await this.repository.createTask(client.zoho_id, task);
        return id;
    }
}
