import { Module } from '@nestjs/common';
import { FileUploadController } from './file_upload.controller';
import { ReadFileService } from './usecases/file_read.service';
import { FileUploadService } from './usecases/file_upload.service';

@Module({
  controllers: [FileUploadController],
  providers: [FileUploadService, ReadFileService],
  exports: [FileUploadService, ReadFileService],
})
export class S3Module { }