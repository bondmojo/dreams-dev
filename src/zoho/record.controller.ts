import { Controller, Get, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { RecordService } from './record.service';
import express, {Request, Response} from 'express';
import { DreamerDto } from './dto/dreamer.dto'; 


@Controller("dreamer")
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Get()
  getHello(): string {
//    return this.recordService.getHello();
    return "";
  }

  @Post()
async newDreamer(@Body() dreamer: DreamerDto, @Res() res: Response ) {

    console.log("------New Dreamer Received from SendPulse-----------"+ JSON.stringify(dreamer));

    if(!dreamer.lastName || dreamer.lastName==""){
      dreamer.lastName=dreamer.firstName;
    }

  let recordId;
  try{
    recordId= await this.recordService.createRecords("Leads", dreamer);
    console.log("------- record ID---------" + recordId);  
    res.status(HttpStatus.OK).send({recordInserted: ""+ recordId});

  }catch(error){
    console.log("ERROR INSERTING RECORD" + JSON.stringify(error));
     res.status(HttpStatus.BAD_REQUEST).send({message : JSON.stringify(error)});
  }
    return "";
  }
}
