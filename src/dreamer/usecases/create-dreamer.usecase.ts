import { Injectable } from "@nestjs/common";
import { CreateDreamerDto } from "../dto/create-dreamer.dto";
import { DreamerModel, LoanRequest } from "./model/dreamer.model";
import { SendpluseService } from "../../external/sendpulse/sendpluse.service";
import { CustomLogger } from "../../custom_logger";
import { SendPulseContactDto } from "../../external/sendpulse/dto/send-pulse-contact.dto";
import { DreamerRepository } from "../repository/dreamer.repository";
import { GlobalService } from "../../globals/usecases/global.service";
@Injectable()
export class CreateDreamerUsecase {
    private readonly log = new CustomLogger(CreateDreamerUsecase.name);
    constructor(private readonly sendpulseService: SendpluseService,
        private readonly repository: DreamerRepository,
        private readonly globalService: GlobalService,
    ) { }

    async create(createDreamerDto: CreateDreamerDto): Promise<DreamerModel> {
        let dreamer = new DreamerModel();
        this.populateRequestData(dreamer, createDreamerDto);
        const contact = await this.sendpulseService.getContact(createDreamerDto.externalId);
        this.popluateSendPulseData(dreamer, contact);
        this.log.log("Populated Data from sendpulse");
        dreamer.id = await this.repository.saveDreamer(dreamer);
        return dreamer;
    }


    private populateRequestData(dreamer: DreamerModel, createDreamerDto: CreateDreamerDto) {
        dreamer.externalId = createDreamerDto.externalId;
        dreamer.loanRequest = new LoanRequest();
        dreamer.loanRequest.amount = Number(createDreamerDto.loanAmount);
        dreamer.loanRequest.pointsAmount = Number(createDreamerDto.pointsAmount);
        dreamer.sendpulse_url = this.globalService.BASE_SENDPULSE_URL + createDreamerDto?.externalId;
        dreamer.utmSorce = createDreamerDto.utmSorce;
        dreamer.utmMedium = createDreamerDto.utmMedium;
        dreamer.utmCampaign = createDreamerDto.utmCampaign;
    }

    private popluateSendPulseData(dreamer: DreamerModel, contact: SendPulseContactDto) {
        const data = contact.channel_data;
        dreamer.name = data.name;
        dreamer.firstName = data.first_name;
        dreamer.lastName = data.last_name ? data.last_name : '-';
    }
}
