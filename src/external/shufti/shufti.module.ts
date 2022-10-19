import { Module } from "@nestjs/common";
import { ShuftiService } from "./shufti.service";
import { HttpModule } from "@nestjs/axios";
import { ShuftiController } from "./shufti.controller";
import { GlobalModule } from "src/globals/global.module";

@Module({
    imports: [HttpModule, GlobalModule],
    controllers: [ShuftiController],
    providers: [ShuftiService],
    exports: [ShuftiService]
})
export class ShuftiModule {
}
