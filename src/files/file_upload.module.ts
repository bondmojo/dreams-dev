import { Module } from '@nestjs/common';
import { FileUploadController } from './file_upload.controller';
import { FileUploadService } from './usecases/file_upload.service';
import { S3 } from '@aws-sdk/client-s3';
const Services = {
  S3_CLIENT: 'S3_CLIENT',
}
@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService, {
    provide: Services.S3_CLIENT,
    useValue: new S3({
      credentials: {
        accessKeyId: process.env.SK_S3_ACCESS_ID ?? '',
        secretAccessKey: process.env.SK_S3_SECRET_KEY ?? '',
      },
      region: process.env.SK_S3_REGION,
    }),
  }],
  exports: [FileUploadService, {
    provide: Services.S3_CLIENT,
    useValue: new S3({
      credentials: {
        accessKeyId: process.env.SK_S3_ACCESS_ID ?? '',
        secretAccessKey: process.env.SK_S3_SECRET_KEY ?? '',
      },
      region: process.env.SK_S3_REGION,
    }),
  },],
})
export class FileUploadModule { }