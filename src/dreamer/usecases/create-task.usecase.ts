import {Injectable} from "@nestjs/common";
import {CreateDreamerDto} from "../dto/create-dreamer.dto";
import {DreamerModel, LoanRequest} from "./model/dreamer.model";
import {SendpluseService} from "../../external/sendpulse/sendpluse.service";
import {CustomLogger} from "../../custom_logger";
import {SendPulseContactDto} from "../../external/sendpulse/dto/send-pulse-contact.dto";
import {DreamerRepository} from "../repository/dreamer.repository";

@Injectable()
export class CreateTaskUsecase {
    private readonly log = new CustomLogger(CreateTaskUsecase.name);
    constructor( private readonly repository: DreamerRepository) {}

    async create(): Promise<string> {
        
        const id = await this.repository.createTask();
        return id;
    }
}
