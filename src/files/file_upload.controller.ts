import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileUploadService } from './usecases/file_upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Util } from 'src/config/util';
@Controller('files')
export class FileUploadController {
  constructor(private readonly fileUploadService: FileUploadService) { }
  @Post('/upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    try {
      const key = Util.getRandomAlphaNumericString(10, 'a');
      const upload = await this.fileUploadService.upload(key, file);
      console.log(upload);
      return key;
    } catch (err) {
      console.log('error :: ', err);
      return 'error';
    }
  }
}

