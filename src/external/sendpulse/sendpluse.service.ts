import { HttpException, HttpStatus, Injectable } from "@nestjs/common";
import { SendPulseContactDto } from "./dto/send-pulse-contact.dto";
import { HttpService } from "@nestjs/axios";
import { SendPulseTokenDto } from "./dto/send-pulse-token.dto";
import { firstValueFrom } from 'rxjs';
import { CustomLogger } from "../../custom_logger";
import { SendPulseResponseDto } from "./dto/send-pulse-response.dto";
import { DreamerModel } from "../../dreamer/usecases/model/dreamer.model";
import { SetVariableRequestDto } from "./dto/set-variable-request.dto";
import { RunFlowModel } from "./model/run-flow-model";
import { OnEvent } from "@nestjs/event-emitter";
import { Client } from "../../loan_management/client/entities/client.entity";
import { UpdateApplicationStatusRequestDto } from './dto/update-application-status-request.dto';
import { GlobalService } from "../../globals/usecases/global.service";




@Injectable()
export class SendpluseService {
    private readonly url = 'https://api.sendpulse.com';
    private readonly log = new CustomLogger(SendpluseService.name);
    private access_token_expiry_time = 0;
    private token: String;

    private readonly APPLICATION_STATUS = ["Approved", "Not Qualified", "Disbursed"]

    constructor(private readonly httpService: HttpService, private readonly globalService: GlobalService) { }

    async getContact(id: string): Promise<SendPulseContactDto> {
        await this.checkAndGenerateToken();

        try {
            const response = await firstValueFrom(this.httpService.get<SendPulseResponseDto<SendPulseContactDto>>(
                this.url + '/telegram/contacts/get',
                {
                    headers: { 'Authorization': 'Bearer ' + this.token },
                    params: { id: id }
                }
            ));
            this.log.log(`Successfully retrieved user data from send pulse ${response.statusText}`)
            return response.data.data;
        }
        catch (error) {
            this.log.log('send pulse error' + error);
            throw new HttpException({
                status: HttpStatus.BAD_GATEWAY,
                error: 'sendpulse is not reachable',
            }, HttpStatus.BAD_GATEWAY);
        }

    }

    async runFlowV2(model: RunFlowModel) {
        await this.checkAndGenerateToken();
        try {
            const response = await firstValueFrom(this.httpService.post<SendPulseResponseDto<SendPulseContactDto>>(
                this.url + '/telegram/flows/run',
                { contact_id: model.contact_id, flow_id: model.flow_id, external_data: model.external_data },
                {
                    headers: { 'Authorization': 'Bearer ' + this.token },
                }
            ));
            this.log.log(`Successfully initiated flow ${model.flow_id} with response ${response.statusText}`);
        } catch (ex) {
            this.log.error("ERROR OCCURED WHILE RUNNING runFlowV2 =" + JSON.stringify(ex));
        }
    }

    async runFlow(model: DreamerModel, flow: string): Promise<any> {
        await this.checkAndGenerateToken();

        const response = await firstValueFrom(this.httpService.post<SendPulseResponseDto<SendPulseContactDto>>(
            this.url + '/telegram/flows/run',
            { contact_id: model.externalId, flow_id: flow, external_data: model.external_data },
            {
                headers: { 'Authorization': 'Bearer ' + this.token },
            }
        ));
        this.log.log(`Successfully initiated flow ${flow} with response ${response.statusText}`);
        return response.status;
    }

    async setVariable(variableDto: SetVariableRequestDto): Promise<string> {
        await this.checkAndGenerateToken();

        this.log.log("Set Send pulse variable =" + JSON.stringify(variableDto));
        try {
            const response = await firstValueFrom(this.httpService.post<SendPulseResponseDto<SendPulseContactDto>>(
                this.url + '/telegram/contacts/setVariable',
                { contact_id: variableDto.contact_id, variable_id: variableDto.variable_id, variable_value: variableDto.variable_value },
                {
                    headers: { 'Authorization': 'Bearer ' + this.token },
                }
            ));
            this.log.log("Set SendpulseVariable response=" + response.status);
            return response.statusText;
        }
        catch (error) {
            this.log.log("setVariable: Exception occured" + JSON.stringify(error));
            throw error;
        }
    }

    @OnEvent('loan.approved')
    async createClientId(client: Client): Promise<string> {
        this.log.log("Received Loan Approved EVENT: now CREATING CLIENT IN SENDPULSE =" + JSON.stringify(client));

        const variableDto = new SetVariableRequestDto();
        //Client ID Variable
        variableDto.variable_id = this.globalService.SENDPULSE_VARIABLE_ID.CLIENT_ID;
        variableDto.variable_value = client.id;
        variableDto.contact_id = client.sendpulse_id;

        await this.setVariable(variableDto);

        const applStatus = new UpdateApplicationStatusRequestDto();
        applStatus.sendpulse_user_id = client.sendpulse_id;
        applStatus.application_status = this.APPLICATION_STATUS[0];

        return await this.updateApplicationStatus(applStatus);
    }

    async updateApplicationStatus(reqData: UpdateApplicationStatusRequestDto) {
        this.log.log(`Running flow for sendpulse user ${reqData.sendpulse_user_id} with application status =` + reqData.application_status);

        let flowId;
        const applStatus = reqData.application_status;

        switch (applStatus) {
            case this.APPLICATION_STATUS[0]:
                flowId = this.globalService.SENDPULSE_FLOW.APPLICATION_STATUS_FLOW_ID.Approved;
                break;
            case this.APPLICATION_STATUS[1]:
                flowId = this.globalService.SENDPULSE_FLOW.APPLICATION_STATUS_FLOW_ID['Not Qualified'];
                break;
            case this.APPLICATION_STATUS[2]:
                const transfertypeDto = new SetVariableRequestDto();
                transfertypeDto.contact_id = reqData.sendpulse_user_id;
                transfertypeDto.variable_name = "activeLoanId";
                transfertypeDto.variable_id = this.globalService.SENDPULSE_VARIABLE_ID.ACTIVE_LOAN_ID;
                transfertypeDto.variable_value = "" + reqData.loan_id;
                await this.setVariable(transfertypeDto);

                flowId = this.globalService.SENDPULSE_FLOW.APPLICATION_STATUS_FLOW_ID.Disbursed;
                break;
        }
        if (flowId) {
            const model = new DreamerModel();
            model.externalId = reqData.sendpulse_user_id;
            model.external_data = {};

            this.log.log("Running " + applStatus + "Flow. FlowId =" + flowId);
            return await this.runFlow(model, flowId);
        }

        return HttpStatus.NOT_FOUND;

    }

    async checkAndGenerateToken(): Promise<string> {
        if (Date.now() < this.access_token_expiry_time && this.token) {
            this.log.log("Valid token Available.");
            return "" + this.token;
        }

        const clientId = '4b0aae3eeb0b3fc5fa57b615d02705cb';
        const clientSecret = 'd3e1f76dc3ed1b0094c3eff38bfa15e7';
        const granttype = 'client_credentials';
        const response = await firstValueFrom(this.httpService.post<SendPulseTokenDto>(
            this.url + '/oauth/access_token',
            { client_id: clientId, client_secret: clientSecret, grant_type: granttype },
        ));
        this.token = response.data.access_token;
        this.access_token_expiry_time = Date.now() + response.data.expires_in * 1000;

        this.log.log(`Generated token from the sendpulse server which expires in ` + this.access_token_expiry_time);
        return response.data.access_token;
    }
}
