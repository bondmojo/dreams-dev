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
import { CustomLogger } from "../../custom_logger";
import { KycEventDto, KYCStatus } from "../../external/shufti/dto/kyc-event.dto";
import { ZohoService } from "../../external/zoho/zoho.service";
import { AdditionalDetailsRequestDto } from "../dto/additional-details-request.dto";
import { PaymentDetailsRequestDto } from "../dto/payment-details-request.dto";
import { CreateZohoLoanApplicationDto } from "../usecases/dto/create-loan-appl.dto";
import { ZohoTaskRequest } from "../usecases/dto/zoho-task-request.dto";
import { DreamerModel } from "../usecases/model/dreamer.model";

@Injectable()
export class DreamerRepository {
    private readonly COMPANY_NAME = 'GOJO';
    private readonly log = new CustomLogger(DreamerRepository.name);

    constructor(private readonly zohoservice: ZohoService,
        private readonly globalService: GlobalService,
    ) { }

    async getDreamer(dreamer: string): Promise<DreamerModel> {
        const dreamerModel = new DreamerModel();
        const record: Record = await this.zohoservice.getDreamerRecord(dreamer);
        dreamerModel.id = record.getKeyValue(Field.Leads.ID.getAPIName());
        dreamerModel.externalId = record.getKeyValue('Telegram_Chat_ID');
        dreamerModel.name = record.getKeyValue(Field.Leads.FULL_NAME.getAPIName());
        dreamerModel.status = record.getKeyValue(Field.Leads.LEAD_STATUS.getAPIName());
        //TODO: Map other values as required
        return dreamerModel;
    }

    async createTask(dreamerId: string, taskDetails: ZohoTaskRequest) {
        const taskRecord = new Record();
        const today = new Date();
        const user = new User();
        user.setEmail(taskDetails.assign_to);

        //Set dreamerId/leadid
        const id = BigInt(dreamerId);
        const whatId = new Record();
        whatId.setId(id);
        //whatId.addKeyValue("name", "LN3990696");

        taskRecord.addFieldValue(Field.Tasks.WHAT_ID, whatId);

        taskRecord.addFieldValue(Field.Tasks.SUBJECT, taskDetails.subject);
        taskRecord.addFieldValue(Field.Tasks.CREATED_TIME, today);
        taskRecord.addFieldValue(Field.Tasks.STATUS, new Choice(taskDetails.status));
        taskRecord.addFieldValue(Field.Tasks.OWNER, user);

        if (taskDetails?.dreamservice_customer_id) {
            const retoolUrl = this.globalService.BASE_RETOOL_URL + "#customer_id=" + taskDetails?.dreamservice_customer_id;
            taskRecord.addFieldValue(Field.Tasks.DESCRIPTION, retoolUrl);
            this.log.log(`createTask. Retool URL = ${retoolUrl}`);
        }

        if (taskDetails?.sendpulse_url_required && taskDetails?.sendpulse_id) {
            const sendpulseUrl = this.globalService.BASE_SENDPULSE_URL + taskDetails?.sendpulse_id;
            taskRecord.addFieldValue(Field.Tasks.DESCRIPTION, sendpulseUrl);
            this.log.log(`createTask. Sendpulse URL = ${sendpulseUrl}`);
        }

        taskRecord.addFieldValue(Field.Tasks.DUE_DATE, taskDetails.due_date); //FIXME:: move outside

        taskRecord.addKeyValue("$se_module", "Leads");
        //taskRecord.addKeyValue("Retool_Url", taskDetails.retool_url);

        const map: Map<string, any> = await this.zohoservice.saveRecord(taskRecord, "Tasks");
        this.log.log(`Successfully saved user as ${map.get('id')}`);
        return (map.get('id') as bigint).toString();
    }

    async createLoanApplication(dreamerId: string, loanDto: CreateZohoLoanApplicationDto): Promise<CreateZohoLoanApplicationDto> {

        const dreamerModel = this.getDreamer(dreamerId);

        const record = new Record();
        //Set dreamerId/leadid
        const id = BigInt(dreamerId);
        const dreamer = new Record();
        dreamer.setId(id);

        const user = new User();
        //Assign Kalyana as lead owner
        user.setId(BigInt("408266000000551006"));
        record.addFieldValue(Field.Leads.OWNER, user);

        record.addKeyValue("Dreamer_Name", dreamer);
        record.addKeyValue("Name", loanDto.lmsLoanId);

        record.addKeyValue("Loan_Ammount", Number(loanDto.loanAmount));
        record.addKeyValue("Membership_Point", Number(loanDto.dreamPoints));

        record.addKeyValue('Provider_Bank', loanDto.preferredPaymentMethod);
        record.addKeyValue('Account_No', loanDto.paymentAccountNumber);
        record.addKeyValue('Payment_Via', loanDto.paymentVia);

        record.addKeyValue("Loan_Status", new Choice(loanDto.loanStatus));

        if (!loanDto.membershipTier) {
            this.log.log("no membership tier found. for =" + (await dreamerModel).name);
            loanDto.membershipTier = "1";
        }
        record.addKeyValue("Loan_Tier_Membership", loanDto.membershipTier);

        const map: Map<string, any> = await this.zohoservice.saveRecord(record, 'Loans');
        this.log.log(`Successfully saved user loan for zoho user ${dreamerId} as ${map.get('id')}`);

        loanDto.loanId = (map.get('id') as bigint).toString();
        return loanDto;
    }

    async saveDreamer(dreamer: DreamerModel): Promise<string> {
        const record = new Record();

        record.addFieldValue(Field.Leads.LAST_NAME, dreamer.lastName);
        record.addFieldValue(Field.Leads.FIRST_NAME, dreamer.firstName);
        record.addFieldValue(Field.Leads.FULL_NAME, dreamer.name);
        record.addFieldValue(Field.Leads.COMPANY, this.COMPANY_NAME);
        record.addFieldValue(Field.Leads.CITY, 'default');
        record.addFieldValue(Field.Leads.EMAIL, "mohit.joshi@gojo.co");
        record.addFieldValue(Field.Leads.LEAD_STATUS, new Choice('New'));

        const user = new User();
        //Assign Kalyana as lead owner
        user.setId(BigInt("408266000000551006"));
        record.addFieldValue(Field.Leads.OWNER, user);

        //Moving this data to loan module
        //record.addKeyValue('Amount', dreamer.loanRequest.amount);
        //record.addKeyValue('Points', dreamer.loanRequest.pointsAmount);
        record.addKeyValue('Lead_Source', new Choice('Telegram'));
        record.addKeyValue('Telegram_Chat_ID', dreamer.externalId);
        record.addKeyValue('Amount', dreamer.loanRequest.amount);
        record.addKeyValue('Points', dreamer.loanRequest.pointsAmount);
        // UTM Params
        record.addKeyValue('utm_Source', dreamer.utmSorce);
        record.addKeyValue('utm_Medium', dreamer.utmMedium);
        record.addKeyValue('utm_Campaign', dreamer.utmCampaign);

        const map: Map<string, any> = await this.zohoservice.saveRecord(record, 'Leads');

        this.log.log(`Successfully saved user ${dreamer.externalId} as ${map.get('id')}`);

        return (map.get('id') as bigint).toString();
    }

    async updatePaymentDetails(id: string, paymentDetails: PaymentDetailsRequestDto, moduleName: string): Promise<string> {
        const record = new Record();

        record.addKeyValue('Account_No', paymentDetails.paymentAccountNumber);
        record.addKeyValue('Payment_Via', paymentDetails.paymentVia);

        if (moduleName === "Leads")
            record.addKeyValue('Provider', new Choice(paymentDetails.preferredPaymentMethod));
        else
            record.addKeyValue('Provider_Bank', paymentDetails.preferredPaymentMethod);

        const map: Map<string, any> = await this.zohoservice.updateRecord(id, record, moduleName);

        this.log.log(`Successfully updated user ${id} data`);

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
        record.addKeyValue('Lead_Status', new Choice("KYC Details Submitted-2"));

        //FIXME: Module name shall come from GlobalConstants
        const map: Map<string, any> = await this.zohoservice.updateRecord(dreamerId, record, 'Leads');

        this.log.log(`Successfully updated user ${dreamerId} data`);

        return (map.get('id') as bigint).toString();
    }

    async saveKycInitialDetails(dreamerId: string, kycId: string): Promise<string> {
        const record = new Record();
        record.addKeyValue('KYC_Id', kycId);
        record.addKeyValue('Successful_KYC_Time', new Date());
        record.addKeyValue('KYC_Status', new Choice('Initiated'));

        //FIXME: Module name shall come from GlobalConstants
        const map: Map<string, any> = await this.zohoservice.updateRecord(dreamerId, record, 'Leads');

        this.log.log(`Successfully updated user ${dreamerId} data`);

        return (map.get('id') as bigint).toString();
    }

    async updatekycDetails(event: KycEventDto): Promise<string> {
        this.log.log("Event received");
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
        const map: Map<string, any> = await this.zohoservice.updateRecord(event.dreamerId, record, 'Leads');

        this.log.log(`Successfully updated user ${event.dreamerId} data`);

        return (map.get('id') as bigint).toString();
    }

    async addDocument(record: Record, filesToDeletes: string[], dreamerId: string, kycId: string, proof: string, name: string, field: string) {
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
    }

    async updateFieldsOnZoho(id: string, zohoKeyValuePairs: any, moduleName: string): Promise<string> {
        // zohoDataKeyValuePair should be key value pair
        const record = new Record();
        Object.keys(zohoKeyValuePairs).forEach(key => {
            record.addKeyValue(key, zohoKeyValuePairs[key]);
        });

        const map: Map<string, any> = await this.zohoservice.updateRecord(id, record, moduleName);

        console.log(`Zoho Fields Successfully updated = Modue: ${moduleName} , UserModuleId:  ${id}, Fields ${JSON.stringify(zohoKeyValuePairs)}`);

        return (map.get('id') as bigint).toString();
    }

}
