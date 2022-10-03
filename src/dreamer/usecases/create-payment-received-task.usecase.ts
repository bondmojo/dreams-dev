import {Injectable} from "@nestjs/common";
import {CreateDreamerDto} from "../dto/create-dreamer.dto";
import {DreamerModel, LoanRequest} from "./model/dreamer.model";
import {SendpluseService} from "../../external/sendpulse/sendpluse.service";
import {CustomLogger} from "../../custom_logger";
import {SendPulseContactDto} from "../../external/sendpulse/dto/send-pulse-contact.dto";
import {DreamerRepository} from "../repository/dreamer.repository";
import { ZohoTaskRequest } from "./dto/zoho-task-request.dto";

@Injectable()
export class CreatePaymentReceivedTaskUsecase {
    private readonly log = new CustomLogger(CreatePaymentReceivedTaskUsecase.name);
    constructor( private readonly repository: DreamerRepository) {}

    async create(dreamerId: string, task: ZohoTaskRequest): Promise<string>{
        
        const id = await this.repository.createPaymentReceivedTask(dreamerId, task);
        return id;
    }
}
