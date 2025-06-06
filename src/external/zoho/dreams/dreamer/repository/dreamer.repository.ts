import { Injectable } from "@nestjs/common";
import { Field } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/field";
import { Record } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record";
import { User } from "@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/users/user";
import { Choice } from "@zohocrm/typescript-sdk-2.0/utils/util/choice";
import { StreamWrapper } from "@zohocrm/typescript-sdk-2.0/utils/util/stream_wrapper";
import { createWriteStream } from "fs";
import got from "got";
import * as os from "os";
import * as path from 'path';
import { GlobalService } from "src/globals/usecases/global.service";
import { promises } from "stream";
import { CustomLogger } from "../../../../../custom_logger";
import { KycEventDto, KYCStatus } from "../../../../shufti/dto/kyc-event.dto";
import { ZohoService } from "../../../core/zoho.service";
import { AdditionalDetailsRequestDto } from "../dto/additional-details-request.dto";
import { PaymentDetailsRequestDto } from "../dto/payment-details-request.dto";
import { DreamerModel } from "../usecases/model/dreamer.model";
import { MethodParamsRespLogger } from "src/decorator";
@Injectable()
export class DreamerRepository {
    private readonly COMPANY_NAME = 'GOJO';
    private readonly log = new CustomLogger(DreamerRepository.name);

    constructor(private readonly zohoservice: ZohoService,
        private readonly globalService: GlobalService,
    ) { }

    async getDreamer(dreamer: string): Promise<DreamerModel> {
        try {
            const dreamerModel = new DreamerModel();
            const record: Record = await this.zohoservice.getDreamerRecord(dreamer);
            dreamerModel.id = record.getKeyValue(Field.Leads.ID.getAPIName());
            dreamerModel.externalId = record.getKeyValue('Telegram_Chat_ID');
            dreamerModel.name = record.getKeyValue(Field.Leads.FULL_NAME.getAPIName());
            dreamerModel.status = record.getKeyValue(Field.Leads.LEAD_STATUS.getAPIName());
            //TODO: Map other values as required
            return dreamerModel;
        } catch (error) {
            this.log.error(`DREAMER REPO: ERROR OCCURED WHILE RUNNING getDreamer :  ${error}`);
        }
    }

    async saveDreamer(dreamer: DreamerModel): Promise<string> {
        try {
            const record = new Record();

            record.addFieldValue(Field.Leads.LAST_NAME, dreamer.lastName);
            record.addFieldValue(Field.Leads.FIRST_NAME, dreamer.firstName);
            record.addFieldValue(Field.Leads.FULL_NAME, dreamer.name);
            record.addFieldValue(Field.Leads.COMPANY, this.COMPANY_NAME);
            record.addFieldValue(Field.Leads.CITY, 'default');
            record.addFieldValue(Field.Leads.EMAIL, "mohit.joshi@gojo.co");
            record.addFieldValue(Field.Leads.LEAD_STATUS, new Choice('New'));

            const user = new User();
            //Assign to lead owner(Kalyana)
            user.setId(BigInt(process.env.ZOHO_LEAD_OWNER_ID));
            record.addFieldValue(Field.Leads.OWNER, user);

            //Moving this data to loan module
            //record.addKeyValue('Amount', dreamer.loanRequest.amount);
            //record.addKeyValue('Points', dreamer.loanRequest.pointsAmount);
            record.addKeyValue('Lead_Source', new Choice('Telegram'));
            record.addKeyValue('Telegram_Chat_ID', dreamer.externalId);
            record.addKeyValue('Amount', dreamer.loanRequest.amount);
            record.addKeyValue('Points', dreamer.loanRequest.pointsAmount);
            record.addKeyValue('Sendpulse_URL', dreamer.sendpulse_url);

            // UTM Params
            record.addKeyValue('utm_Source', dreamer.utmSorce);
            record.addKeyValue('utm_Medium', dreamer.utmMedium);
            record.addKeyValue('utm_Campaign', dreamer.utmCampaign);
            record.addKeyValue('Telegram_Id', "" + dreamer.telegram_id);

            //Tenure details
            record.addKeyValue('Tenure', dreamer.tenure);
            record.addKeyValue('Tenure_Type', dreamer.tenureType);


            this.log.log(`Trying to save dreamer on zoho: ${JSON.stringify(Object.fromEntries(record.getKeyValues()))}`);
            const map: Map<string, any> = await this.zohoservice.saveRecord(record, 'Leads');

            this.log.log(`Successfully saved user ${dreamer.externalId} as ${map.get('id')}`);

            return (map.get('id') as bigint).toString();
        } catch (error) {
            this.log.error(`DREAMER REPO: ERROR OCCURED WHILE RUNNING saveDreamer :  ${error}`);
        }
    }

    async updatePaymentDetails(id: string, paymentDetails: PaymentDetailsRequestDto): Promise<string> {
        const record = new Record();

        record.addKeyValue('Payment_Via', paymentDetails.paymentVia);
        record.addKeyValue('Account_Number', paymentDetails.paymentAccountNumber);
        record.addKeyValue('Provider', new Choice(paymentDetails.preferredPaymentMethod));

        this.log.log(`Trying to update payment details on zoho: ${JSON.stringify(Object.fromEntries(record.getKeyValues()))}`);
        const map: Map<string, any> = await this.zohoservice.updateRecord(id, record, "Leads");

        this.log.log(`Successfully updated user ${id} data`);

        return (map.get('id') as bigint).toString();
    }

    async updateAdditionalDetails(dreamerId: string, additionalDetails: AdditionalDetailsRequestDto): Promise<string> {
        try {
            // FIXME :: replace with updateFieldsOnZoho
            const record = new Record();
            record.addKeyValue('Address_Line_1', additionalDetails.addressLine1);
            record.addKeyValue('Address_Line_2', additionalDetails.addressLine2);
            record.addKeyValue('City', additionalDetails.city);
            record.addKeyValue('State', additionalDetails.state);
            record.addKeyValue('Zip_Code', additionalDetails.pincode);
            record.addKeyValue('Country', 'Cambodia');
            record.addKeyValue('Alternate_Phone_Number', additionalDetails.alternatePhoneNumber);
            record.addKeyValue('Type', new Choice(additionalDetails.employmentType));
            record.addKeyValue('Lead_Status', new Choice("KYC Details Submitted-2"));

            //FIXME: Module name shall come from GlobalConstants
            this.log.log(`Trying to update additional details on zoho: ${JSON.stringify(Object.fromEntries(record.getKeyValues()))}`);
            const map: Map<string, any> = await this.zohoservice.updateRecord(dreamerId, record, 'Leads');

            this.log.log(`Successfully updated user ${dreamerId} data`);

            return (map.get('id') as bigint).toString();
        } catch (error) {
            this.log.error(`DREAMER REPO: ERROR OCCURED WHILE RUNNING updateAdditionalDetails :  ${error}`);
        }
    }

    async saveKycInitialDetails(dreamerId: string, kycId: string): Promise<string> {
        try {
            // FIXME :: replace with updateFieldsOnZoho
            const record = new Record();
            record.addKeyValue('KYC_Id', kycId);
            record.addKeyValue('Successful_KYC_Time', new Date());
            record.addKeyValue('KYC_Status', new Choice('Initiated'));

            //FIXME: Module name shall come from GlobalConstants
            this.log.log(`Trying to save Kyc Initial Details on Zoho: ${JSON.stringify(Object.fromEntries(record.getKeyValues()))}`);
            const map: Map<string, any> = await this.zohoservice.updateRecord(dreamerId, record, 'Leads');

            this.log.log(`Successfully updated user ${dreamerId} data`);

            return (map.get('id') as bigint).toString();
        } catch (error) {
            this.log.error(`DREAMER REPO: ERROR OCCURED WHILE RUNNING saveKycInitialDetails :  ${error}`);
        }
    }

    async updatekycDetails(event: KycEventDto): Promise<string> {
        try {
            const filesToDeletes: string[] = [];
            const record = new Record();
            record.addKeyValue('KYC_End_Time', new Date());
            record.addFieldValue(Field.Leads.LEAD_STATUS, new Choice('KYC Submitted'));
            if (event.status == KYCStatus.SUCCESS || event.status == KYCStatus.REJECTED) {

                try {
                    if (event.dob) {
                        const today = new Date();
                        const dateOfBirth = new Date(event.dob);

                        let age = today.getFullYear() - dateOfBirth.getFullYear();
                        const m = today.getMonth() - dateOfBirth.getMonth();

                        if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
                            age--;
                        }
                        this.log.log("Now Adding Age in Zoho=" + age);
                        record.addKeyValue('Age', age);
                    }
                } catch (error) {
                    this.log.log("Error in Calculating Age " + error);
                }
                record.addKeyValue('National_Id', event.documentNumber);
                record.addKeyValue('First_Name_On_Document', event.first);
                record.addKeyValue('Last_Name_On_Document', event.last);
                record.addKeyValue('DOB_On_Document', event.dob);
                record.addKeyValue('Name1', event.full);
                record.addKeyValue('Gender_On_Document', new Choice(event.gender));
                record.addKeyValue('KYC_Rejection_Reason', event.rejectionReason);
                record.addKeyValue('KYC_Status', new Choice(event.status == KYCStatus.SUCCESS ? 'Success' : 'Failed'));
                await this.addDocument(record, filesToDeletes, event.dreamerId, event.kycId, event.documentProof, 'document', 'KYC_Documents');
                await this.addDocument(record, filesToDeletes, event.dreamerId, event.kycId, event.faceProof, 'face', 'KYC_Documents');
            } else {
                record.addKeyValue('KYC_Status', new Choice('Failed'));
                record.addKeyValue('KYC_Rejection_Reason', event.rejectionReason);
            }
            //FIXME: Module name shall come from GlobalConstants
            this.log.log(`Trying to update KYC Details on Zoho: ${JSON.stringify(Object.fromEntries(record.getKeyValues()))}`);
            const map: Map<string, any> = await this.zohoservice.updateRecord(event.dreamerId, record, 'Leads');

            this.log.log(`Successfully updated user ${event.dreamerId} data`);

            return (map.get('id') as bigint).toString();
        } catch (error) {
            this.log.error(`DREAMER REPO: error in update Kyc Details :  ${error}`);
        }
    }

    async addDocument(record: Record, filesToDeletes: string[], dreamerId: string, kycId: string, proof: string, name: string, field: string) {
        try {
            if (proof) {
                const fileName = `${dreamerId}-${kycId}-${name}.jpg`;
                const fileLocation = path.join(os.tmpdir(), fileName);
                this.log.log(`File will be generated at ${fileLocation}`);

                await promises.pipeline(got.stream(proof), createWriteStream(fileLocation));

                const streamWrapper = new StreamWrapper(undefined, undefined, fileLocation);
                const map: Map<string, any> = await this.zohoservice.uploadAttachments(dreamerId, streamWrapper);

                const fileId = (map.get('id')).toString();
                this.log.log(`Attachment uploaded to the Zoho server ${fileId}`);
            }
        } catch (error) {
            this.log.error(`DREAMER REPO: ERROR OCCURED WHILE RUNNING addDocument :  ${error}`);
        }

    }
}
