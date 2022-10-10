import { Injectable } from '@nestjs/common';
import {
    PutObjectCommandOutput,
    S3,
} from '@aws-sdk/client-s3';
import { Inject } from '@nestjs/common';
import { STSClient } from "@aws-sdk/client-sts";
import { AssumeRoleCommand } from "@aws-sdk/client-sts"
import { CustomLogger } from 'src/custom_logger';

@Injectable()
export class FileUploadService {
    private readonly logger = new CustomLogger(FileUploadService.name);
    private readonly stsClient = new STSClient({ region: process.env.SK_S3_REGION });
    private readonly params = {
        RoleArn: process.env.ROLE_ARN_FOR_S3, //ARN_OF_ROLE_TO_ASSUME
        RoleSessionName: "session1",
        DurationSeconds: 900,
    };

    constructor() { }
    async upload(
        key: string,
        file: Express.Multer.File
    ): Promise<PutObjectCommandOutput> {

        this.logger.log("STS Client Request Params =" + JSON.stringify(this.params));
        /*         const data = await this.stsClient.send(new AssumeRoleCommand(this.params));
                this.logger.log("STS Client response =" + JSON.stringify(data));
        
                const rolecreds = {
                    accessKeyId: data.Credentials?.AccessKeyId,
                    secretAccessKey: data.Credentials?.SecretAccessKey,
                    sessionToken: data.Credentials?.SessionToken,
                }; */

        const s3Client = new S3({
            region: process.env.SK_S3_REGION,
        });

        return await s3Client.putObject({
            Bucket: process.env.SK_S3_SYSTEM_DATA_BUCKET,
            Key: `${key}`,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype,
        });
    }
}
