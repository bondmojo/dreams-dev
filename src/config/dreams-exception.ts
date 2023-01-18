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

    public readonly DRM_ERROR = 0;

}