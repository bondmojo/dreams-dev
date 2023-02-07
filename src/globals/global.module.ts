import { Module, Global } from "@nestjs/common";
import { GlobalService } from "./usecases/global.service";
import { GlobalController } from './global.controller';
@Global()
@Module({
    providers: [{
        provide: GlobalService,
        useValue: new GlobalService()
    }],
    exports: [GlobalService],
    controllers: [GlobalController]
})
export class GlobalModule {

}
