import { Injectable } from "@nestjs/common";
import { DreamerRepository } from "../repository/dreamer.repository";

@Injectable()
export class UpdateFieldsOnZohoUsecase {
    constructor(private readonly repository: DreamerRepository) { }

    async update(id: string, zohoKeyValuePairs: any, moduleName: string): Promise<string> {
        return await this.repository.updateFieldsOnZoho(id, zohoKeyValuePairs, moduleName);
    }
}
