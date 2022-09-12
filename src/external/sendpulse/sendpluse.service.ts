import {HttpException, HttpStatus, Injectable} from "@nestjs/common";
import {SendPulseContactDto} from "./dto/send-pulse-contact.dto";
import {RunFlowRequestDto} from "./dto/run-flow-request.dto";
import {HttpService} from "@nestjs/axios";
import {SendPulseTokenDto} from "./dto/send-pulse-token.dto";
import { firstValueFrom } from 'rxjs';
import {CustomLogger} from "../../custom_logger";
import {SendPulseResponseDto} from "./dto/send-pulse-response.dto";
import {DreamerModel} from "../../dreamer/usecases/model/dreamer.model";
import { SendpulseModule } from "./sendpulse.module";
import { SetVariableRequestDto } from "./dto/set-variable-request.dto";

@Injectable()
export class SendpluseService{
    private readonly url = 'https://api.sendpulse.com';
    private readonly log = new CustomLogger(SendpluseService.name);
    private access_token_expiry_time =0;
    private token: String;

    constructor(private readonly httpService: HttpService) {}

    async getContact(id: string): Promise<SendPulseContactDto> {
        await this.checkAndGenerateToken();
        
        try{
        const response = await firstValueFrom(this.httpService.get<SendPulseResponseDto<SendPulseContactDto>>(
            this.url+'/telegram/contacts/get',
            {
                headers: {'Authorization': 'Bearer '+ this.token},
                params: {id: id}
            }
        ));
        this.log.log(`Successfully retrieved user data from send pulse ${response.statusText}`)
        return response.data.data;
        }
        catch(error){
            this.log.log('send pulse error' + error);
            throw new HttpException({
                status: HttpStatus.BAD_GATEWAY,
                error: 'sendpulse is not reachable',
              }, HttpStatus.BAD_GATEWAY);
        }

    }

    async runFlow(model: DreamerModel, flow: string) {
        await this.checkAndGenerateToken();
        
        const response = await firstValueFrom(this.httpService.post<SendPulseResponseDto<SendPulseContactDto>>(
            this.url+'/telegram/flows/run',
            {contact_id: model.externalId, flow_id: flow, external_data: model.external_data}, 
            {
                headers: {'Authorization': 'Bearer '+ this.token},
            }
        ));
        this.log.log(`Successfully initiated flow ${flow} with response ${response.statusText}`)
    }

    async setVariable(variableDto: SetVariableRequestDto): Promise<string>{
        await this.checkAndGenerateToken();

        this.log.log("Set Send pulse variable ="+ JSON.stringify(variableDto));
        try{
        const response = await firstValueFrom(this.httpService.post<SendPulseResponseDto<SendPulseContactDto>>(
            this.url+'/telegram/contacts/setVariable',
            {contact_id: variableDto.contact_id, variable_id: variableDto.variable_id, variable_value: variableDto.variable_value}, 
            {
                headers: {'Authorization': 'Bearer '+ this.token},
            }
        ));
        this.log.log("Set SendpulseVariable response="+ response.status);
        return response.statusText;
        }
        catch(error){
            this.log.log("setVariable: Exception occured" + JSON.stringify(error));
        }
        return "ERROR";
    }

    async checkAndGenerateToken(): Promise<string> {
        if(Date.now() < this.access_token_expiry_time){
           this.log.log("Valid token Available.")
        }

        const clientId = '4b0aae3eeb0b3fc5fa57b615d02705cb';
        const clientSecret = 'd3e1f76dc3ed1b0094c3eff38bfa15e7';
        const granttype = 'client_credentials';
        const response = await firstValueFrom(this.httpService.post<SendPulseTokenDto>(
            this.url+'/oauth/access_token',
            {client_id: clientId, client_secret: clientSecret, grant_type: granttype},
        ));
        this.access_token_expiry_time= Date.now() + response.data.expires_in*1000;

        this.log.log(`Generated token from the sendpulse server which expires in ` + this.access_token_expiry_time);
        return response.data.access_token;
    }
}
