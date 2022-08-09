import { Module } from '@nestjs/common';
import { RecordController } from './record.controller';
import { RecordService } from './record.service';
import { ConfigModule , ConfigService } from '@nestjs/config';
import { CustomLogger } from '../custom_logger';


const UserSignature = require("zcrmsdk/routes/user_signature").UserSignature;
const INDataCenter = require("zcrmsdk/routes/dc/in_data_center").INDataCenter;
const {OAuthToken, TokenType} = require( "zcrmsdk/models/authenticator/oauth_token");
const record_operations = require("zcrmsdk/core/com/zoho/crm/api/record/record_operations.js");
const FileStore = require( "zcrmsdk/models/authenticator/store/file_store").FileStore;

const SDKConfigBuilder = require("zcrmsdk/routes/sdk_config_builder").MasterModel;
const Initializer = require( "zcrmsdk/routes/initializer").Initializer;
const {Logger, Levels}= require( "zcrmsdk/routes/logger/logger");
//import { Logger, Injectable } from '@nestjs/common';



const ZOHO ={
  CLIENT_ID : "1000.2MD0ZWQ43T23HPTFJGCCNNJS728OND",
  SECRET : "f782b50389e59236c2c5ddef560af6d28dd46fa0c2",
  USER : "mohit.joshi@gojo.co",
  ID : "60015610290",
  GRANT_TOKEN : "1000.49ca64ae0583e9471a70436d763f2faa.7987ed52a159201fba8b7f4da5a3899b"
}

@Module({
  imports: [ConfigModule.forRoot()],
  controllers: [RecordController],
  providers: [RecordService],
})



export class ZohoModule {

  zohoLoggerFilePath?: String;
  zohoResPath?: String;
  zohoFilePath?: String;
  private readonly customLogger = new CustomLogger();


  constructor(private configService: ConfigService){
     this.zohoLoggerFilePath = this.configService.get<string>('ZOHO_LOGGER_FILE_PATH');
     this.zohoResPath = this.configService.get<string>('ZOHO_RESOURCE_PATH');
     this.zohoFilePath = this.configService.get<string>('ZOHO_FILE_PATH');
     this.customLogger.log("*********res path =" +this.zohoLoggerFilePath );


    this.init();
  }


  async init(){
        //Create an UserSignature instance that takes user Email as parameter
          var user = new UserSignature("mohit.joshi@gojo.co");
        /*
         * Configure the environment
         * which is of the pattern Domain.Environment
         * Available Domains: USDataCenter, EUDataCenter, INDataCenter, CNDataCenter, AUDataCenter
         * Available Environments: PRODUCTION(), DEVELOPER(), SANDBOX()
        */
        let environment = INDataCenter.PRODUCTION();
        //environment._D
        let sdkConfig = new SDKConfigBuilder().setPickListValidation(false).setAutoRefreshFields(true).build();
        let zoho_logger = Logger.getInstance(Levels.INFO, this.zohoLoggerFilePath);

        //FILE PERSISTENCE STORE
        let tokenstore = new FileStore(this.zohoFilePath);
        
      
        let  token;
      //get all tokens available in FileStore
        var oauthToken = await tokenstore.getTokens();

        this.customLogger.log("auth.js oAuthToken =" + JSON.stringify(oauthToken));
        this.customLogger.log("auth.js oAuthToken =" + oauthToken.length);

    //do first time initialization with Grant Token.

  try{
    if(oauthToken.length ==0){
        try{
        oauthToken = new OAuthToken(ZOHO.CLIENT_ID, ZOHO.SECRET, ZOHO.GRANT_TOKEN, TokenType.GRANT);

        this.customLogger.log("MOJO now Initializing SDK" );

        await Initializer.initialize(user, environment, oauthToken, tokenstore, sdkConfig, this.zohoResPath, zoho_logger);    
       
        this.customLogger.log("MOJO now generating access Token -------" + JSON.stringify(oauthToken));
        oauthToken = await oauthToken.generateAccessToken(user, tokenstore);
        this.customLogger.log("generated access Token -------" + JSON.stringify(oauthToken));
        
        oauthToken.grantToken=null;
        oauthToken = await oauthToken.refreshAccessToken(user, tokenstore);  
        this.customLogger.log("Refreshed access Token -------" + JSON.stringify(oauthToken));
        }
        catch(e){
          this.customLogger.log("GRANT TOKEN or GENERATE TOKEN ISSUE" + JSON.stringify(e));
          throw e;
        }
    }
    else {
        oauthToken =oauthToken[0];
        let refreshToken= oauthToken.refreshToken;
        oauthToken = new OAuthToken(ZOHO.CLIENT_ID, ZOHO.SECRET, refreshToken, TokenType.REFRESH);
        await Initializer.initialize(user, environment, oauthToken, tokenstore, sdkConfig, this.zohoResPath, zoho_logger);  
        this.customLogger.log("MOJO.auth generating Refresh Token -------" + JSON.stringify(oauthToken));

        await oauthToken.refreshAccessToken(user, tokenstore);  
      }
      this.customLogger.log("Initializer initialized ___MOJO@");    

    }
  catch (error){
        this.customLogger.log("ERROR INTIALIZING ZOHO SDK" + error);
        throw error;
    }
  }

resetFS(){
  let tokenstore = new FileStore(this.zohoFilePath);
  tokenstore.deleteTokens();
  this.customLogger.log("MOJO ALL LOGS DELETED");
}

}