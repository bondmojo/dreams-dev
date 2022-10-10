import { Module } from '@nestjs/common';
import { FileUploadController } from './file_upload.controller';
import { FileUploadService } from './usecases/file_upload.service';
import { S3 } from '@aws-sdk/client-s3';

/* const Services = {
  S3_CLIENT: 'S3_CLIENT',
} */

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService],
  exports: [FileUploadService],
})
export class FileUploadModule { }