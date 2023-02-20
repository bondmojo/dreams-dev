import { Module, Global } from "@nestjs/common";
import { GlobalService } from "./usecases/global.service";
import { GlobalController } from './global.controller';
import { S3Module } from "src/s3/S3.module";
import { ReadFileService } from "src/s3/usecases/file_read.service";
@Global()
@Module({
    imports: [S3Module],
    providers: [{
        provide: GlobalService,
        useValue: new GlobalService(new ReadFileService())
    }],
    exports: [GlobalService],
    controllers: [GlobalController]
})
export class GlobalModule {

}
