import {Injectable} from "@nestjs/common";
import {CreateDreamerDto} from "../dto/create-dreamer.dto";
import {DreamerModel, LoanRequest} from "./model/dreamer.model";
import {SendpluseService} from "../../external/sendpulse/sendpluse.service";
import {CustomLogger} from "../../custom_logger";
import {SendPulseContactDto} from "../../external/sendpulse/dto/send-pulse-contact.dto";
import {DreamerRepository} from "../repository/dreamer.repository";

@Injectable()
export class CreateDreamerUsecase {
    private readonly log = new CustomLogger(CreateDreamerUsecase.name);
    constructor(private readonly sendpulseService: SendpluseService, private readonly repository: DreamerRepository) {}

    async create(createDreamerDto: CreateDreamerDto): Promise<DreamerModel> {
        let dreamer = new DreamerModel();
        this.populateRequestData(dreamer, createDreamerDto);
        const contact = await this.sendpulseService.getContact(createDreamerDto.externalId);
        this.popluateSendPulseData(dreamer, contact);
        this.log.log("Populated Data from sendpulse");
        dreamer.id = await this.repository.save(dreamer);
        return dreamer;
    }


    private populateRequestData(dreamer: DreamerModel, createDreamerDto: CreateDreamerDto) {
        dreamer.externalId = createDreamerDto.externalId;
        dreamer.loanRequest = new LoanRequest();
        dreamer.loanRequest.amount = createDreamerDto.loanAmount;
        dreamer.loanRequest.pointsAmount = createDreamerDto.pointsAmount;
    }

    private popluateSendPulseData(dreamer: DreamerModel, contact: SendPulseContactDto) {
        const data = contact.channel_data;
        dreamer.name = data.name;
        dreamer.firstName = data.first_name;
        dreamer.lastName = data.last_name? data.last_name: '-';
    }
}
