import { Controller, Get } from "@nestjs/common";
import { CustomLogger } from "../custom_logger";

@Controller("admin")
export class HealthCheckController {

    private readonly logger = new CustomLogger(HealthCheckController.name);
    @Get("health")
    check() {
        this.logger.log(`HealthCheckController ENV vairable = ${process.env.NODE_ENV}`);
        return {
            status: 'OK'
        }
    }
}
