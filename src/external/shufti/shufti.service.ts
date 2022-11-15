import { HttpException, Injectable, HttpStatus } from "@nestjs/common";
import { firstValueFrom } from "rxjs";
import { CustomLogger } from "../../custom_logger";
import { HttpService } from "@nestjs/axios";
import { ShuftiResponseDto } from "./dto/shufti-response.dto";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { KycEventDto, KYCStatus } from "./dto/kyc-event.dto";
import { GlobalService } from "../../globals/usecases/global.service";

@Injectable()
export class ShuftiService {
    private readonly url = 'https://api.shuftipro.com';
    private readonly logger = new CustomLogger(ShuftiService.name);

    private clientId = this.globalService.isDev ? 'aad4be30637892cd60e04ede36338a4da522c9fc57a237267de0007b160f2e3f' : 'DAHH086mH3cHVcODNiz8VFsCzUSndYIiZid5ZmtgmPriqBnb1h1642582024';
    private secret = this.globalService.isDev ? '2C0yXdPyitNNQ5vlJ974sAqd9nVH4B6b' : '$2y$10$BnWZZO6Ix0Fwv7Kh1ljv0ucRtfqNMjdqs.yaqRJICPW.xzG3Cdxom';
    private readonly shuftiAuth = Buffer.from(this.clientId + ':' + this.secret).toString('base64');

    //private readonly registrationUrl = 'https://gojo.retool.com/embedded/public/228e6187-4a66-4a81-b430-a63a646f82b8';
    private readonly callbackUrl = this.globalService.isDev ? 'https://dev.api.gojo.co/dreams/v1' : 'https://nfjlmolsee.execute-api.ap-southeast-1.amazonaws.com/prod/v1';
    private readonly telegramBotUrl = this.globalService.isDev ? "https://t.me/gojo_dreams_uat_bot" : "https://t.me/dreams_cambodia_bot";

    constructor(private readonly httpService: HttpService,
        private eventEmitter: EventEmitter2, private readonly globalService: GlobalService) {
    }

    async initiateKyc(dreamerId: string, kycId: string): Promise<string> {
        const request = structuredClone(this.TEMPLATE);
        request.reference = kycId;
        request.callback_url = this.callbackUrl + '/shufti/callback?dreamerId=' + dreamerId + "&kycId=" + kycId;
        request.redirect_url = this.telegramBotUrl;
        request.country = "KH";
        request.language = "KM";

        if (this.globalService.isDev) {
            request.ttl = 15;
        }
        else {
            request.ttl = 4320;
        }

        //request.redirect_url = this.registrationUrl + "#leadId=" + dreamerId + "&kycId=" + kycId;
        const response = await firstValueFrom(this.httpService.post<ShuftiResponseDto>(
            this.url,
            request,
            {
                headers: { 'Authorization': 'BASIC ' + this.shuftiAuth }
            }
        ));
        this.logger.log(`Received response from shufti for zoho ID =${dreamerId}  Status = ${JSON.stringify(response.statusText)} and URL = ${response.data.verification_url}`);
        return response.data.verification_url;
    }

    async fetchKycData(kycId: string): Promise<ShuftiResponseDto> {
        const request = { reference: kycId };
        this.logger.log(`fetching KYC Data from ShuftiPro kyc id ${kycId}`);

        try {
            const response = await firstValueFrom(this.httpService.post<ShuftiResponseDto>(
                this.url + '/status',
                request,
                {
                    headers: { 'Authorization': 'BASIC ' + this.shuftiAuth }
                }
            ));
            this.logger.log(`Received response from shufti ${response.data}`);
            return response.data;
        }
        catch (e) {
            this.logger.log("Error Fetching kyc details from shufti" + e);
            throw new HttpException({
                status: HttpStatus.BAD_REQUEST,
                error: 'ShuftiPro Error',
            }, HttpStatus.BAD_REQUEST);
        }
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
