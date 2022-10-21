import { Injectable } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { CustomLogger } from "../../custom_logger";
import { HttpService } from "@nestjs/axios";
import { ShuftiResponseDto } from "./dto/shufti-response.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { KycEventDto, KYCStatus } from "./dto/kyc-event.dto";


@Injectable()
export class ShuftiService {
    private readonly url = 'https://api.shuftipro.com';
    private readonly clientId = 'aad4be30637892cd60e04ede36338a4da522c9fc57a237267de0007b160f2e3f';
    private readonly secret = '2C0yXdPyitNNQ5vlJ974sAqd9nVH4B6b';
    //private readonly registrationUrl = 'https://gojo.retool.com/embedded/public/228e6187-4a66-4a81-b430-a63a646f82b8';
    private readonly callbackUrl = (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "local") ? 'https://dev.api.gojo.co/dreams/v1' : 'https://nfjlmolsee.execute-api.ap-southeast-1.amazonaws.com/prod/v1';
    private readonly TELEGRAM_BOT_URL = ["https://t.me/gojo_dreams_uat_bot", "https://t.me/dreams_cambodia_bot"]

    private readonly logger = new CustomLogger(ShuftiService.name);
    constructor(private readonly httpService: HttpService,
        private eventEmitter: EventEmitter2) { }

    async initiateKyc(dreamerId: string, kycId: string): Promise<string> {
        const request = structuredClone(this.TEMPLATE);
        request.reference = kycId;
        request.callback_url = this.callbackUrl + '/shufti/callback?dreamerId=' + dreamerId + "&kycId=" + kycId;

        if (process.env.NODE_ENV === "dev" || process.env.NODE_ENV === "local") {
            request.redirect_url = this.TELEGRAM_BOT_URL[0];
        }
        else {
            request.redirect_url = this.TELEGRAM_BOT_URL[1];
        }

        //request.redirect_url = this.registrationUrl + "#leadId=" + dreamerId + "&kycId=" + kycId;
        const response = await firstValueFrom(this.httpService.post<ShuftiResponseDto>(
            this.url,
            request,
            {
                headers: { 'Authorization': 'BASIC ' + btoa(this.clientId + ':' + this.secret) }
            }
        ));
        this.logger.log(`Received response from shufti ${response.statusText}`);
        return response.data.verification_url;
    }

    async fetchKycData(kycId: string): Promise<ShuftiResponseDto> {
        const request = { reference: kycId };
        const response = await firstValueFrom(this.httpService.post<ShuftiResponseDto>(
            this.url + '/status',
            request,
            {
                headers: { 'Authorization': 'BASIC ' + btoa(this.clientId + ':' + this.secret) }
            }
        ));
        this.logger.log(`Received response from shufti ${response.statusText}`);
        return response.data;
    }

    async kycCallback(dreamerId: string, kycId: string, response: ShuftiResponseDto) {
        const event: KycEventDto = this.buildEvent(dreamerId, kycId, response);
        if (response.event === 'verification.accepted') {
            const data: ShuftiResponseDto = await this.fetchKycData(kycId);
            this.logger.log(`Verification accepted for ${dreamerId} with kyc id ${kycId}`);
            event.documentProof = data.proofs.document.proof;
            event.faceProof = data.proofs.face.proof;
            event.status = KYCStatus.SUCCESS;
            this.eventEmitter.emit('kyc.callback', event);
        } else if (response.event === 'verification.declined' || response.event === 'verification.rejected') {
            const data: ShuftiResponseDto = await this.fetchKycData(kycId);
            this.logger.log(`Verification rejected for ${dreamerId} with kyc id ${kycId}`);
            event.documentProof = data.proofs?.document?.proof;
            event.faceProof = data.proofs?.face?.proof;
            event.status = KYCStatus.REJECTED;
            event.rejectionReason = data.declined_reason;
            this.eventEmitter.emit('kyc.callback', event);
        } else if (response.event === 'request.timeout' || response.event === 'verification.cancelled') {
            this.logger.log(`Verification ${response.event} for ${dreamerId} with kyc id ${kycId}`);
            event.status = response.event === 'request.timeout' ? KYCStatus.TIMED_OUT : KYCStatus.CANCELED;
            event.rejectionReason = 'Verification either timed-out or cancelled by the user';
            this.eventEmitter.emit('kyc.callback', event);
        }
    }

    private buildEvent(dreamerId: string, kycId: string, response: ShuftiResponseDto): KycEventDto {
        const event: KycEventDto = new KycEventDto();
        event.dreamerId = dreamerId;
        event.kycId = kycId;
        event.first = response.verification_data?.document?.name.first_name;
        event.last = response.verification_data?.document?.name.last_name;
        event.full = response.verification_data?.document?.name.full_name;
        event.dob = response.verification_data?.document?.dob;
        event.documentNumber = response.verification_data?.document?.document_number;
        event.gender = this.retrieveGender(response.verification_data?.document?.gender);
        return event;
    }


    private retrieveGender(gender: string) {
        if (gender == null) {
            return 'Unknown';
        } else if (gender === 'M') {
            return 'MALE';
        } else {
            return 'FEMALE';
        }
    }

    private readonly TEMPLATE = {
        reference: "<REPLACE>",
        country: "IN",
        language: "en",
        callback_url: "<REPLACE>",
        redirect_url: "<REPLACE>",
        verification_mode: "any",
        allow_offline: "0",
        allow_online: "1",
        show_consent: "1",
        decline_on_single_step: "0",
        manual_review: "0",
        show_privacy_policy: "0",
        show_results: "0",
        show_feedback_form: "0",
        allow_na_ocr_inputs: "0",
        allow_retry: "1",
        ttl: 10,
        face: {
            proof: ""
        },
        document: {
            proof: "",
            additional_proof: "",
            supported_types: [
                "id_card"
            ],
            backside_proof_required: "0",
            verification_instructions: {
                allow_paper_based: "0",
                allow_photocopy: "0",
                allow_laminated: "0",
                allow_screenshot: "0",
                allow_cropped: "0",
                allow_scanned: "0"
            },
            fetch_enhanced_data: "0",
            show_ocr_form: "0",
            name: {
                first_name: "",
                last_name: ""
            },
            dob: "",
            document_number: "",
            gender: "",
            expiry_date: ""
        }
    }
}
