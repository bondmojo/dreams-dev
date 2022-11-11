import { Injectable } from "@nestjs/common";
import { CustomLogger } from "../../custom_logger";
import { DreamerRepository } from "../repository/dreamer.repository";
import { CreateLoanApplicationDto } from "./dto/create-loan-appl.dto";


@Injectable()
export class CreateLoanApplicationUsecase {
    private readonly log = new CustomLogger(CreateLoanApplicationUsecase.name);
    constructor(private readonly repository: DreamerRepository) { }

    async create(createLoanDto: CreateLoanApplicationDto) {
        return await this.repository.createLoanApplication(createLoanDto.dreamerId, createLoanDto);
    }

}
