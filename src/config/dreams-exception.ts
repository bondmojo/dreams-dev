import { threadId } from "worker_threads";

export class DreamsException extends Error {

    private readonly code: number;
    private readonly messsage: string;

    constructor(code: number, messsage: string) {
        super(messsage);
        this.code = code;
        this.message = messsage;
    };
}

export class DreamsCode {

    public static readonly DRM_ERROR = 0;
    public static readonly CLIENT_NOT_FOUND = 1;
    public static readonly LOAN_NOT_FOUND = 2;
    public static readonly SENDPULSE_ID_NOT_FOUND = 3;
    public static readonly TELEGRAM_ID_NOT_FOUND = 4;


    public static readonly INVALID_LOAN_STATUS = 5;
    public static readonly INVALID_DATA = 100;
    public static readonly UNKNOWN_ERROR = 1000;



}