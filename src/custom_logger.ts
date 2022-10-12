import { LoggerService, Logger } from '@nestjs/common';

export class CustomLogger implements LoggerService {


  private readonly logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  /**
   * Write a 'log' level log.
   */
  log(message: any, ...optionalParams: any[]) {
    this.logger.log("INFO:" + message);
  }

  /**
   * Write an 'error' level log.
   */
  error(message: any, ...optionalParams: any[]) {
    this.logger.error("ERROR:" + message);
  }

  /**
   * Write a 'warn' level log.
   */
  warn(message: any, ...optionalParams: any[]) {
    this.logger.warn("WARN:" + message);
  }

  /**
   * Write a 'debug' level log.
   */
  debug?(message: any, ...optionalParams: any[]) {
    this.logger.debug("DEBUG:" + message);

  }

  /**
   * Write a 'verbose' level log.
   */
  verbose?(message: any, ...optionalParams: any[]) {
    this.logger.verbose("VERBOSE:" + message);
  }
}
