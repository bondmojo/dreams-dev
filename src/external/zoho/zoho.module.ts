import {Module} from '@nestjs/common';
import {ZohoService} from './zoho.service';
import {ConfigModule, ConfigService} from '@nestjs/config';
import {CustomLogger} from '../../custom_logger';
import {UserSignature} from "@zohocrm/typescript-sdk-2.0/routes/user_signature"
import {Levels, Logger} from "@zohocrm/typescript-sdk-2.0/routes/logger/logger"
import {INDataCenter} from "@zohocrm/typescript-sdk-2.0/routes/dc/in_data_center"
import {OAuthToken} from "@zohocrm/typescript-sdk-2.0/models/authenticator/oauth_token"
import {OAuthBuilder} from "@zohocrm/typescript-sdk-2.0/models/authenticator/oauth_builder"
import {DBStore} from "@zohocrm/typescript-sdk-2.0/models/authenticator/store/db_store"
import {DBBuilder} from "@zohocrm/typescript-sdk-2.0/models/authenticator/store/db_builder";
import {SDKConfigBuilder} from "@zohocrm/typescript-sdk-2.0/routes/sdk_config_builder";
import {InitializeBuilder} from "@zohocrm/typescript-sdk-2.0/routes/initialize_builder"
import * as fs from "fs";

const ZOHO = {
    CLIENT_ID: "1000.2MD0ZWQ43T23HPTFJGCCNNJS728OND",
    SECRET: "f782b50389e59236c2c5ddef560af6d28dd46fa0c2",
    USER: "mohit.joshi@gojo.co",
    ID: "60015610290",
    GRANT_TOKEN: "1000.314781188b4353eb95e93c066a7d8f66.376d04186504cc3cc88d07dc8a06acf1"
}

@Module({
    imports: [ConfigModule.forRoot()],
    providers: [ZohoService],
    exports: [ZohoService]
})
export class ZohoModule {

    private readonly zohoLoggerFilePath?: string;
    private readonly zohoResPath?: string;
    private readonly zohoFilePath?: string;
    private readonly customLogger = new CustomLogger(ZohoModule.name);


    constructor(private configService: ConfigService) {
        this.zohoLoggerFilePath = this.configService.get<string>('ZOHO_LOGGER_FILE_PATH');
        this.zohoResPath = this.configService.get<string>('ZOHO_RESOURCE_PATH');
        if(!fs.existsSync(this.zohoResPath!)) fs.mkdirSync(this.zohoResPath!);
        this.zohoFilePath = this.configService.get<string>('ZOHO_FILE_PATH');
        this.customLogger.log("*********res path =" + this.zohoLoggerFilePath);
        this.init();
    }


    async init() {
        var user = new UserSignature("mohit.joshi@gojo.co");
        let environment = INDataCenter.PRODUCTION();
        let sdkConfig = new SDKConfigBuilder().pickListValidation(false).autoRefreshFields(true).build();
        let zoho_logger = Logger.getInstance(Levels.INFO, this.zohoLoggerFilePath!);

        //FILE PERSISTENCE STORE
        let tokenstore: DBStore = new DBBuilder()
            .host('localhost')
            .databaseName('zohooauth')
            .userName('root')
            .password('mysql')
            .portNumber(3306)
            .build();

        try {
            let token: OAuthToken = new OAuthBuilder()
                .clientId(ZOHO.CLIENT_ID)
                .clientSecret(ZOHO.SECRET)
                .grantToken(ZOHO.GRANT_TOKEN)
                .redirectURL("https://www.gojo.co")
                .build();

            this.customLogger.log("Initializing SDK");

            await new InitializeBuilder()
                .user(user)
                .environment(environment)
                .token(token)
                .store(tokenstore)
                .SDKConfig(sdkConfig)
                .resourcePath(this.zohoResPath!)
                .logger(zoho_logger)
                .initialize();

            this.customLogger.log("Initialized the project");

        } catch (error) {
            this.customLogger.error("ERROR INTIALIZING ZOHO SDK", error);
            throw error;
        }
    }

}
