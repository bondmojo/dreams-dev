import {Injectable} from "@nestjs/common";
import {SendpluseService} from "../../external/sendpulse/sendpluse.service";
import {CustomLogger} from "../../custom_logger";
import {SendPulseContactDto} from "../../external/sendpulse/dto/send-pulse-contact.dto";
import {DreamerRepository} from "../repository/dreamer.repository";
import { ZohoTaskRequest } from "./dto/zoho-task-request.dto";
import { OnEvent } from "@nestjs/event-emitter";
import { UpdateApplicationStatusRequestDto } from "src/external/sendpulse/dto/update-application-status-request.dto";
import { GlobalService } from "src/globals/usecases/global.service";

@Injectable()
export class CreateZohoTaskUsecase {
    private readonly log = new CustomLogger(CreateZohoTaskUsecase.name);
    constructor( private readonly repository: DreamerRepository,
        private readonly global: GlobalService) {}

    async create(dreamerId: string, task: ZohoTaskRequest): Promise<string>{
        const id = await this.repository.createTask(dreamerId, task);
        return id;
    }

    @OnEvent('loan.disbursed')
    async createDisbursementTask(applStatus : UpdateApplicationStatusRequestDto): Promise<string>{
        this.log.log("RECEIVED EVENT: createDisbursementTask =" + JSON.stringify(applStatus));
        const task =new ZohoTaskRequest();
        task.assign_to =this.global.DISBURSEMENT_TASK_ASSIGNEE;
        task.subject = "Disburse Loan to "+ applStatus.full_name;
        task.dreamservice_customer_id= applStatus.client_id;
       
        const id = await this.repository.createTask(applStatus.dreamer_id, task);
        return id;
    }
}
