import { Injectable } from "@nestjs/common";
import { DreamerDto } from "./dto/dreamer.dto";


const fs = require("fs");
const path = require("path");
const {RecordOperations} = require("zcrmsdk/core/com/zoho/crm/api/record/record_operations");
const ZCRMRecord = require("zcrmsdk/core/com/zoho/crm/api/record/record").MasterModel;
const BodyWrapper = require("zcrmsdk/core/com/zoho/crm/api/record/body_wrapper").BodyWrapper;
const ActionWrapper = require("zcrmsdk/core/com/zoho/crm/api/record/action_wrapper").ActionWrapper;

const RecordField = require("zcrmsdk/core/com/zoho/crm/api/record/field").Field;
const APIException = require("zcrmsdk/core/com/zoho/crm/api/record/api_exception").APIException;
const SuccessResponse = require("zcrmsdk/core/com/zoho/crm/api/record/success_response").SuccessResponse;
const HeaderMap = require("zcrmsdk/routes/header_map").HeaderMap;
const Initializer = require( "zcrmsdk/routes/initializer").Initializer;

@Injectable()
export class RecordService{
    /**
     *  Create Records
     * This method is used to create records of a module and print the response.
     * @param {String} moduleAPIName The API Name of the module to create records.
     */
    async createRecords(moduleAPIName: String, lead: DreamerDto) {
        //example
        //let moduleAPIName = "Leads";
        
        //Get instance of RecordOperations Class
        let recordOperations = new RecordOperations();

        //Get instance of BodyWrapper Class that will contain the request body
        let request = new BodyWrapper();

        //Array to hold Record instances
        let recordsArray = [];

        //Get instance of Record Class
        let record = new ZCRMRecord();

        /* Value to Record's fields can be provided in any of the following ways */

        /*
         * Call addFieldValue method that takes two arguments
         * Import the "zcrmsdk/core/com/zoho/crm/api/record/field" file
         * 1 -> Call Field "." and choose the module from the displayed list and press "." and choose the field name from the displayed list.
         * 2 -> Value
         */
        record.addFieldValue(RecordField.Leads.LAST_NAME, lead.lastName);

        record.addFieldValue(RecordField.Leads.FIRST_NAME, lead.firstName);

        record.addFieldValue(RecordField.Leads.COMPANY, lead.company);

        record.addFieldValue(RecordField.Leads.CITY, lead.city);

        //Add Record instance to the array
        recordsArray.push(record);

        //Set the array to data in BodyWrapper instance
        request.setData(recordsArray);

         //Get instance of HeaderMap Class
        let headerInstance = new HeaderMap();

        console.log("NOW TRYING POST");
        let createdRecordedId;

        // await headerInstance.add(CreateRecordsHeader.X_EXTERNAL, "Leads.External");

        //Call createRecords method that takes BodyWrapper instance and moduleAPIName as parameters
        let response = await recordOperations.createRecords(moduleAPIName, request, headerInstance);

        console.log("RESPONSE POST =" +JSON.stringify(response));


        if(response != null){

            //Get the status code from response
            console.log("Status Code: " + response.statusCode);

            //Get object from response
            let responseObject = response.object;

            if(responseObject != null){

                //Check if expected ActionWrapper instance is received 
                if(responseObject instanceof ActionWrapper){

                    //Get the array of obtained ActionResponse instances
                    let actionResponses: [] = responseObject.getData();

                    actionResponses.forEach( (actionResponse: any) => {

                        // const actionResponse = value;
                        //Check if the request is successful
                        if(actionResponse instanceof SuccessResponse){

                            //Get the Status
                            console.log("Status: " + actionResponse.getStatus().getValue());

                            //Get the Code
                            console.log("Code: " + actionResponse.getCode().getValue());

                            console.log("Details");

                            //Get the details map
                            let details = actionResponse.getDetails();

                            if(details != null){
                                createdRecordedId =details.get('id');
                                console.log("MOJO id="+createdRecordedId);

                                Array.from(details.keys()).forEach(key => {
                                    console.log(key + ": " + details.get(key));  
                                });
                            }

                            console.log("MOJO Message: " + actionResponse.getMessage().getValue());
                        }
                        //Check if the request returned an exception
                        else if(actionResponse instanceof APIException){

                            //Get the Status
                            console.log("Status: " + actionResponse.getStatus().getValue());

                            //Get the Code
                            console.log("Code: " + actionResponse.getCode().getValue());

                            console.log("Details");

                            //Get the details map
                            let details = actionResponse.getDetails();

                            if(details != null){
                                createdRecordedId =details.get('id');
                                Array.from(details.keys()).forEach(key => {
                                    console.log(key + ": " + details.get(key));  
                                });
                            }

                            //Get the Message
                            console.log("Message: " + actionResponse.getMessage().getValue());
                        } 
                    });
                }
                //Check if the request returned an exception
                else if(responseObject instanceof APIException){

                    //Get the Status
                    console.log("Status: " + responseObject.getStatus().getValue());

                    //Get the Code
                    console.log("Code: " + responseObject.getCode().getValue());

                    console.log("Details");

                    //Get the details map
                    let details = responseObject.getDetails();

                    if(details != null){
                        Array.from(details.keys()).forEach(key => {
                            console.log(key + ": " + details.get(key));  
                        });
                    }

                    //Get the Message
                    console.log("Message: " + responseObject.getMessage().getValue());
                }
            }
        }

        return createdRecordedId;

    }
} 