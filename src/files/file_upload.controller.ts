import { Controller, Post, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileUploadService } from './usecases/file_upload.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { Util } from 'src/config/util';
@Controller('files')
export class FileUploadController {

  private readonly S3_PAYMENT_FOLDER = "PaymentRepceipts/";
  private readonly S3_PAYMENT_FILE_TYPE = ".jpg";

  constructor(private readonly fileUploadService: FileUploadService) { }


  @Post('uploadPaymentReceipt')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPaymentReceipt(@UploadedFile() file: Express.Multer.File) {
    try {
      const key = Util.getRandomAlphaNumericString(10, 'a');
      const upload = await this.fileUploadService.upload(this.S3_PAYMENT_FOLDER + key + this.S3_PAYMENT_FILE_TYPE, file);
      console.log(upload);
      return key;
    } catch (err) {
      console.log('error :: ', err);
      return 'error';
    }
  }
}

