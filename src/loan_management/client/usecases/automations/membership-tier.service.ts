import { BadRequestException, Injectable } from "@nestjs/common";
import { UpdateMembershipTierDto } from "../../dto";
import { CustomLogger } from "../../../../custom_logger";
import { Client } from '../../entities/client.entity';
import { GlobalService } from "../../../../globals/usecases/global.service"
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
import { ClientService } from "../client.service";
@Injectable()
export class MembershipTierService {
    private readonly log = new CustomLogger(MembershipTierService.name);
    constructor(
        private readonly globalService: GlobalService,
        private readonly sendpulseService: SendpluseService,
        private readonly clientService: ClientService,
    ) { }

    async update(updateMembershipTierDto: UpdateMembershipTierDto): Promise<any> {
        try {
            if (!updateMembershipTierDto.zoho_id || !updateMembershipTierDto.tier) {
                throw new BadRequestException('Zoho Id or Tier is missing.');
            }
            const client = await this.clientService.findbyZohoId(
                updateMembershipTierDto.zoho_id
            );
            if (!client) {
                throw new BadRequestException(`Client Not Found with Zoho Id ${updateMembershipTierDto.zoho_id}`);
            }

            const updateClientDto: any = {
                id: client.id,
                tier: '' + updateMembershipTierDto.tier,
            };
            await this.updateSendpulseFieldsAsPerClientTier(client, updateMembershipTierDto.tier);
            return await this.clientService.update(updateClientDto);
        } catch (error) {
            this.log.error(`MEMBERSHIP SERVICE ERROR: ERROR OCCURED WHILE RUNNING refundDreamPoint:  ${error}`);
            throw error;
        }


    }

    async updateSendpulseFieldsAsPerClientTier(client: Client, tier: number): Promise<any> {
        const new_tier = tier;
        const new_max_credit_amount = this.globalService.TIER_AMOUNT[new_tier];
        const new_next_loan_amount = this.globalService.TIER_AMOUNT[new_tier + 1];
        await this.sendpulseService.updateSendpulseVariable({
            variable_name: 'Tier',
            variable_id: this.globalService.SENDPULSE_VARIABLE_ID.TIER,
            variable_value: '' + new_tier,
            contact_id: client.sendpulse_id,
        });
        await this.sendpulseService.updateSendpulseVariable({
            variable_name: 'maxCreditAmount',
            variable_id: this.globalService.SENDPULSE_VARIABLE_ID.MAX_CREDIT_AMOUNT,
            variable_value: '' + new_max_credit_amount,
            contact_id: client.sendpulse_id,
        });
        await this.sendpulseService.updateSendpulseVariable({
            variable_name: 'nextLoanAmount',
            variable_id: this.globalService.SENDPULSE_VARIABLE_ID.NEXT_LOAN_AMOUNT,
            variable_value: '' + new_next_loan_amount,
            contact_id: client.sendpulse_id,
        });
        return;
    }

}
