import {CreateDreamerDto} from './dto/create-dreamer.dto';
import {Body, Controller, Param, Post} from '@nestjs/common';
import {AdditionalDetailsRequestDto} from "./dto/additional-details-request.dto";
import {CreateDreamerUsecase} from "./usecases/create-dreamer.usecase";

@Controller('dreamers')
export class DreamerController {
  constructor(private readonly createDreamerUsecase: CreateDreamerUsecase) {}

  @Post()
  async createDreamer(@Body() createDreamerRequestDto: CreateDreamerDto) {
    return await this.createDreamerUsecase.create(createDreamerRequestDto);
  }

  @Post(':dreamerId/additional_details')
  updateAdditionalDetails(
    @Param() params: any,
    @Body() request: AdditionalDetailsRequestDto,
  ) {
    return params.dreamerId;
  }
}
