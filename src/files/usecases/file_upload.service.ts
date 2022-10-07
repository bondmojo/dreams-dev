import { Injectable } from '@nestjs/common';
import {
    GetObjectCommandOutput,
    PutObjectCommandOutput,
    S3,
} from '@aws-sdk/client-s3';
import { Inject } from '@nestjs/common';

const Services = {
    S3_CLIENT: 'S3_CLIENT',
}
@Injectable()
export class FileUploadService {
    constructor(@Inject(Services.S3_CLIENT) private readonly s3Client: S3) { }
    async upload(
        key: string,
        file: Express.Multer.File
    ): Promise<PutObjectCommandOutput> {

        return await this.s3Client.putObject({
            Bucket: process.env.SK_S3_SYSTEM_DATA_BUCKET,
            Key: `${key}`,
            Body: file.buffer,
            ACL: 'public-read',
            ContentType: file.mimetype,
        });
    }
}
