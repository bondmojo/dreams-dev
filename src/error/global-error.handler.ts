import { CustomLogger } from "../custom_logger";

const log = new CustomLogger('Global');
process.on('unhandledRejection', (reason, promise) => {
    log.error(`UNHANDLED REJECTION AT: ${JSON.stringify(promise)} -> ${promise}, reason: ${JSON.stringify(reason)} -> ${reason}`);
});

process.on('uncaughtException', (error) => {
    log.error(`UNCAUGHT REJECTION AT:  reason: ${JSON.stringify(error)} -> ${error}`);
});
