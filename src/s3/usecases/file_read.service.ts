import {
    GetObjectCommandOutput, S3
} from '@aws-sdk/client-s3';
import { AssumeRoleCommand, STSClient } from "@aws-sdk/client-sts";
import { Body, Injectable } from '@nestjs/common';
import { read } from 'fs';
import { CustomLogger } from 'src/custom_logger';
import { Readable } from 'stream';
import { GlobalService } from "../../globals/usecases/global.service";

@Injectable()
export class ReadFileService {
    private readonly logger = new CustomLogger(ReadFileService.name);
    private readonly stsClient = new STSClient({ region: process.env.SK_S3_REGION });
    private readonly params = {
        RoleArn: process.env.ROLE_ARN_FOR_S3, //ARN_OF_ROLE_TO_ASSUME
        RoleSessionName: "session1",
        DurationSeconds: 900,
    };

    constructor() { }

    //Implementation NEEDED. Half cooked code
    async readFile(key: string): Promise<any> {
        try {
            this.logger.log("Reading File= " + key);
            let s3ClientParams;
            if (process.env.NODE_ENV == 'local') {
                this.logger.log("STS Client Request Params =" + JSON.stringify(this.params));
                const data = await this.stsClient.send(new AssumeRoleCommand(this.params));
                this.logger.log("STS Client response =" + JSON.stringify(data));

                const rolecreds = {
                    accessKeyId: data.Credentials?.AccessKeyId,
                    secretAccessKey: data.Credentials?.SecretAccessKey,
                    sessionToken: data.Credentials?.SessionToken,
                };

                s3ClientParams = {
                    credentials: {
                        accessKeyId: rolecreds.accessKeyId ?? 'AKIA6L3THESLIAJO6RQ7',
                        secretAccessKey: rolecreds.secretAccessKey ?? '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',
                        sessionToken: rolecreds.sessionToken
                    },
                    region: process.env.SK_S3_REGION,
                };
            }
            else {
                s3ClientParams = { region: process.env.SK_S3_REGION }
            }

            const s3Client = new S3(s3ClientParams);

            const bucketParams = {
                Bucket: process.env.SK_S3_SYSTEM_DATA_BUCKET,
                Key: `${key}`,
                ACL: 'public-read',
            };

            const data: GetObjectCommandOutput = await s3Client.getObject(bucketParams);

            let readableStream: Readable;

            if ("on" in data.Body) {
                readableStream = data.Body as Readable;
            } else {
                throw new Error("Body is not a Readable stream");
            }
            let dataString: string = "";

            return new Promise<string>((resolve, reject) => {
                readableStream.on('data', (chunk) => {
                    dataString += chunk.toString();
                    console.log("=====on=====" + dataString);
                });

                readableStream.on('end', () => {
                    resolve(dataString);
                    console.log("====end======" + dataString);

                });

                readableStream.on('error', (err) => {
                    console.log("====error======");
                    reject(err);
                });
            });

            //readableStream.pipe(str)

            //this.logger.log(" file body " + dataString);
            //return dataString;
            //return `${this.globalService.AWS_IMAGE_PREFIX_URLS.PAYMENT_REPCEIPTS}${key}`;
        } catch (error) {
            this.logger.error(`FILES SERVICE: ERROR OCCURED WHILE RUNNING upload:  ${error}`);
        }
    }
}
