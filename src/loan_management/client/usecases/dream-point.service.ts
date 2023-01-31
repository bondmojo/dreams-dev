import { BadRequestException, Injectable } from "@nestjs/common";
import { InjectRepository } from '@nestjs/typeorm';
import { RefundDreamPointDto } from "../dto";
import { CustomLogger } from "../../../custom_logger";
import { Client } from '../entities/client.entity';
import { Repository } from 'typeorm';
import { GlobalService } from "../../../globals/usecases/global.service"
import { SendpluseService } from "src/external/sendpulse/sendpluse.service";
import { Equal } from "typeorm"
import { TransactionService } from "src/loan_management/transaction/usecases/transaction.service";
import { ClientService } from "./client.service";
@Injectable()
export class DreamPointService {
    private readonly log = new CustomLogger(DreamPointService.name);
    constructor(
        private readonly globalService: GlobalService,
        private readonly sendpulseService: SendpluseService,
        private readonly clientService: ClientService,
        private readonly transactionService: TransactionService,
    ) { }

    async refund(refundDreamPointDto: RefundDreamPointDto): Promise<any> {
        try {
            if (!refundDreamPointDto.amount) {
                throw new BadRequestException('Please Enter correct amount.');
            }
            const client = await this.clientService.findbyId(
                refundDreamPointDto.client_id
            );

            const dream_points_earned = client.dream_points_earned;
            if (dream_points_earned < refundDreamPointDto.amount) {
                throw new BadRequestException('Amount is Greater then Dream Point Balance.');
            }

            // Create Dream Point Refund Transaction
            const transactionDto = {
                client_id: refundDreamPointDto.client_id,
                amount: refundDreamPointDto.amount,
                image: refundDreamPointDto.image,
                type: this.globalService.TRANSACTION_TYPE.DREAM_POINT_REFUND,
                note: refundDreamPointDto.note,
            }
            await this.transactionService.create(transactionDto);

            // FIXME: When user refund dream point set update client tier to 1
            // await this.updateSendpulseFieldsAsPerClientTier(client, 1);

            // Update Client Data
            const updateClientDto = {
                id: client.id,
                // tier: 1,
                dream_points_earned: dream_points_earned - refundDreamPointDto.amount,
            };
            return await this.clientService.update(updateClientDto);
        } catch (error) {
            this.log.error(`DREAM POINT SERVICE: ERROR OCCURED WHILE RUNNING refundDreamPoint:  ${error}`);
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
