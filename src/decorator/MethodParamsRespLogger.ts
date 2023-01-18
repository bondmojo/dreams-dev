import { CustomLogger } from "../custom_logger";

export const MethodParamsRespLogger = (logger: CustomLogger) => {
    return (target: any, key: string | symbol, descriptor: PropertyDescriptor) => {
        const originalMethod = descriptor.value;

        descriptor.value = async function (...args: any[]) {
            logger.log(`---------  BEGIN METHOD = ${key.toString()},  ARGUMENTS= ${JSON.stringify(args)} ---------`);
            const result = await originalMethod.apply(this, args);
            logger.log(`--------- END METHOD = ${key.toString()},  RESPONSE= ${JSON.stringify(result)} ---------`);
            return result;
        };
        return descriptor;
    }
};




