import {Injectable} from "@nestjs/common";
import {SendPulseContactDto} from "./dto/send-pulse-contact.dto";
import {RunFlowRequestDto} from "./dto/run-flow-request.dto";
import {HttpService} from "@nestjs/axios";
import {SendPulseTokenDto} from "./dto/send-pulse-token.dto";
import { firstValueFrom } from 'rxjs';
import {CustomLogger} from "../../custom_logger";
import {SendPulseResponseDto} from "./dto/send-pulse-response.dto";
import {DreamerModel} from "../../dreamer/usecases/model/dreamer.model";

@Injectable()
export class SendpluseService{
    private readonly url = 'https://api.sendpulse.com';
    private readonly log = new CustomLogger(SendpluseService.name);
    constructor(private readonly httpService: HttpService) {}

    async getContact(id: string): Promise<SendPulseContactDto> {
        const token = await this.generateToken();
        this.log.log("Token successfully generated");
        const response = await firstValueFrom(this.httpService.get<SendPulseResponseDto<SendPulseContactDto>>(
            this.url+'/telegram/contacts/get',
            {
                headers: {'Authorization': 'Bearer '+ token},
                params: {id: id}
            }
        ));
        this.log.log(`Successfully retrieved user data from send pulse ${response.statusText}`)
        return response.data.data;
    }

    async runFlow(model: DreamerModel, flow: string) {
        const token = await this.generateToken();
        this.log.log("Token successfully generated");
        const response = await firstValueFrom(this.httpService.post<SendPulseResponseDto<SendPulseContactDto>>(
            this.url+'/telegram/flows/run',
            {contact_id: model.externalId, flow_id: flow},
            {
                headers: {'Authorization': 'Bearer '+ token},
            }
        ));
        this.log.log(`Successfully initiated flow ${flow} with response ${response.statusText}`)
    }

    async generateToken(): Promise<string> {
        const clientId = '4b0aae3eeb0b3fc5fa57b615d02705cb';
        const clientSecret = 'd3e1f76dc3ed1b0094c3eff38bfa15e7';
        const granttype = 'client_credentials';
        const response = await firstValueFrom(this.httpService.post<SendPulseTokenDto>(
            this.url+'/oauth/access_token',
            {client_id: clientId, client_secret: clientSecret, grant_type: granttype},
        ));
        this.log.log(`Received token from the sendpulse server`);
        return response.data.access_token;
    }
}
