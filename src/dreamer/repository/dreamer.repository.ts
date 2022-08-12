import {Injectable} from "@nestjs/common";
import {DreamerModel} from "../usecases/model/dreamer.model";
import {ZohoService} from "../../external/zoho/zoho.service";
import {Record} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import {Field} from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/field";
import {Choice} from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import {CustomLogger} from "../../custom_logger";
import {PaymentDetailsRequestDto} from "../dto/payment-details-request.dto";
import {AdditionalDetailsRequestDto} from "../dto/additional-details-request.dto";

@Injectable()
export class DreamerRepository {
    private readonly COMPANY_NAME = 'GOJO';
    private readonly log = new CustomLogger(DreamerRepository.name);

    constructor(private readonly zohoservice: ZohoService) {}

    async save(dreamer: DreamerModel): Promise<string> {
        const record = new Record();

        record.addFieldValue(Field.Leads.LAST_NAME, dreamer.lastName);
        record.addFieldValue(Field.Leads.FIRST_NAME, dreamer.firstName);
        record.addFieldValue(Field.Leads.FULL_NAME, dreamer.name);
        record.addFieldValue(Field.Leads.COMPANY, this.COMPANY_NAME);
        record.addFieldValue(Field.Leads.CITY, 'default');

        record.addKeyValue('Lead_Source', new Choice('Telegram'));
        record.addKeyValue('Telegram_Chat_ID', dreamer.externalId);
        record.addKeyValue('Amount', dreamer.loanRequest.amount);
        record.addKeyValue('Points', dreamer.loanRequest.pointsAmount);
        let map: Map<string, any> = await this.zohoservice.saveRecord(record);

        this.log.log(`Successfully saved user ${dreamer.externalId} as ${map.get('id')}`);

        return (map.get('id') as bigint).toString();
    }

    async updatePaymentDetails(dreamerId: string, paymentDetails: PaymentDetailsRequestDto): Promise<string> {
        const record = new Record();
        record.addKeyValue('Provider', new Choice(paymentDetails.preferredPaymentMethod));
        record.addKeyValue('Account_Number', paymentDetails.paymentAccountNumber);

        let map: Map<string, any> = await this.zohoservice.updateRecord(dreamerId, record);

        this.log.log(`Successfully updated user ${dreamerId} data`);

        return (map.get('id') as bigint).toString();
    }

    async updateAdditionalDetails(dreamerId: string, additionalDetails: AdditionalDetailsRequestDto): Promise<string> {
        const record = new Record();
        record.addKeyValue('Address_Line_1', additionalDetails.addressLine1);
        record.addKeyValue('Address_Line_2', additionalDetails.addressLine2);
        record.addKeyValue('City', additionalDetails.city);
        record.addKeyValue('State', additionalDetails.state);
        record.addKeyValue('Zip_Code', additionalDetails.pincode);
        record.addKeyValue('Country', 'Cambodia');
        record.addKeyValue('Alternate_Phone_Number', additionalDetails.alternatePhoneNumber);
        record.addKeyValue('Type', new Choice(additionalDetails.employmentType));


        let map: Map<string, any> = await this.zohoservice.updateRecord(dreamerId, record);

        this.log.log(`Successfully updated user ${dreamerId} data`);

        return (map.get('id') as bigint).toString();
    }
}
