import {Controller, Get} from "@nestjs/common";

@Controller("admin")
export class HealthCheckController {
    @Get("health")
    check() {
        return {
            status: 'OK'
        }
    }
}
