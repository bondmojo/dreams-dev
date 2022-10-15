import { Injectable } from '@nestjs/common';
import {
    PutObjectCommandOutput,
    PutObjectCommand,
    S3,
} from '@aws-sdk/client-s3';
import { Inject } from '@nestjs/common';
import { STSClient } from "@aws-sdk/client-sts";
import { AssumeRoleCommand } from "@aws-sdk/client-sts"
import { CustomLogger } from 'src/custom_logger';
import { GlobalService } from "../../globals/usecases/global.service"

@Injectable()
export class FileUploadService {
    private readonly logger = new CustomLogger(FileUploadService.name);
    private readonly stsClient = new STSClient({ region: process.env.SK_S3_REGION });
    private readonly params = {
        RoleArn: process.env.ROLE_ARN_FOR_S3, //ARN_OF_ROLE_TO_ASSUME
        RoleSessionName: "session1",
        DurationSeconds: 900,
    };

    constructor(private readonly globalService: GlobalService) { }
    async upload(
        key: string,
        file: Express.Multer.File
    ): Promise<any> {
        this.logger.log("Uploading File.");
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
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype,
        };

        await s3Client.putObject(bucketParams);
        return `${this.globalService.AWS_IMAGE_PREFIX_URLS.PAYMENT_REPCEIPTS}${key}`;
    }
}
