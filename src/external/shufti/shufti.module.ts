import {Module} from "@nestjs/common";
import {ShuftiService} from "./shufti.service";
import {HttpModule} from "@nestjs/axios";
import {ShuftiController} from "./shufti.controller";

@Module({
    imports: [HttpModule],
    controllers: [ShuftiController],
    providers: [ShuftiService],
    exports: [ShuftiService]
})
export class ShuftiModule {
}
