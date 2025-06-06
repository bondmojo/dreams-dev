import { CustomLogger } from '../../../custom_logger';
import { CreateZohoRepaymentScheduleUsecase } from 'src/external/zoho/dreams/repayment_schedule/create-repayment-schedule.usecase';
import { Injectable } from '@nestjs/common';
import { Record } from '@zohocrm/typescript-sdk-2.0/core/com/zoho/crm/api/record/record';
import { Choice } from '@zohocrm/typescript-sdk-2.0/utils/util/choice';
import { RepaymentScheduleModel } from '../model/repayment-scehdule.model';
import { GlobalService } from 'src/globals/usecases/global.service';
import { ZohoInstallmentFields } from 'src/globals/zoho_fields_mapping/Installment';
import { UpdateFieldsOnZohoUsecase } from '../../../external/zoho/dreams/utility/update-fields-on-zoho.usecase';

@Injectable()
export class ZohoRepaymentScheduleHelper {
  private readonly log = new CustomLogger(ZohoRepaymentScheduleHelper.name);

  constructor(
    private readonly zohoCreateRepaymentSchedule: CreateZohoRepaymentScheduleUsecase,
    private readonly globalService: GlobalService,
    private readonly updateFieldsOnZohoUsecase: UpdateFieldsOnZohoUsecase,
  ) {}
  //

  getRepaymentScheduleObject(
    repaymentScheduleModel: RepaymentScheduleModel,
  ): any {
    const zohoRepaymentSchedulePair: any = {};
    const id = BigInt(repaymentScheduleModel.zoho_loan_id);
    const zoholoanID = new Record();
    zoholoanID.setId(id);
    zohoRepaymentSchedulePair[ZohoInstallmentFields.loan_id] = zoholoanID;

    const dreamer_id = BigInt(repaymentScheduleModel.zoho_client_id);
    const ZohoDreamerID = new Record();
    ZohoDreamerID.setId(dreamer_id);

    zohoRepaymentSchedulePair[ZohoInstallmentFields.dreamer_name] =
      ZohoDreamerID;

    zohoRepaymentSchedulePair[ZohoInstallmentFields.name] =
      repaymentScheduleModel.id;
    zohoRepaymentSchedulePair[ZohoInstallmentFields.total_paid_amount] = Number(
      repaymentScheduleModel.total_paid_amount,
    );
    zohoRepaymentSchedulePair[ZohoInstallmentFields.overdue_amount] = Number(
      repaymentScheduleModel.ins_overdue_amount,
    );
    zohoRepaymentSchedulePair[ZohoInstallmentFields.repayment_status] =
      new Choice(
        this.globalService.INSTALMENT_PAYMENT_STATUS_STR[
          repaymentScheduleModel.repayment_status
        ],
      );

    zohoRepaymentSchedulePair[ZohoInstallmentFields.principal_amount] = Number(
      repaymentScheduleModel.ins_principal_amount,
    );
    zohoRepaymentSchedulePair[ZohoInstallmentFields.repayment_date] =
      repaymentScheduleModel.due_date;
    zohoRepaymentSchedulePair[ZohoInstallmentFields.installment_status] =
      new Choice(
        this.globalService.INSTALMENT_SCHEDULING_STATUS_STR[
          repaymentScheduleModel.scheduling_status
        ],
      );
    zohoRepaymentSchedulePair[ZohoInstallmentFields.installment_fees] = Number(
      repaymentScheduleModel.ins_membership_fee,
    );
    zohoRepaymentSchedulePair[ZohoInstallmentFields.last_paid_date] =
      repaymentScheduleModel.previous_repayment_dates;

    //todo add other fields
    return zohoRepaymentSchedulePair;
  }

  async createZohoRepaymentSchedule(recordPairArray: any): Promise<any> {
    return await this.zohoCreateRepaymentSchedule.create(recordPairArray);
  }

  async updateZohoFields(
    module_id: string,
    zohoKeyValuePairs: object,
    module_name: string,
  ): Promise<any> {
    try {
      await this.updateFieldsOnZohoUsecase.update(
        module_id,
        zohoKeyValuePairs,
        module_name,
      );
      return true;
    } catch (error) {
      this.log.error(
        'Error in Zoho Repayment Scheduler Helper(Update Zoho Fields) ' +
          JSON.stringify(error),
      );
    }
  }
}

/*"repayment_schedules":
{"Name":{"required":true,"type":"String","name":"Name"},
"Owner":{"type":"core/com/zoho/crm/api/users/user","lookup":true,"skip-mandatory":true,"structure_name":"core/com/zoho/crm/api/users/user",
"name":"Owner"},
"Loan_Id":{"type":"core/com/zoho/crm/api/record/record","lookup":true,"structure_name":"core/com/zoho/crm/api/record/record","module":"Loans","name":"Loan_Id"},
"Total_Paid_Amount":{"type":"Double","name":"Total_Paid_Amount"},
"Overdue_Amount":{"type":"Double","name":"Overdue_Amount"},
"Additional_Amount":{"type":"Double","name":"Additional_Amount"},
"Repayment_Status":{"type":"utils/util/choice","picklist":true,"values":["-None-","Not Paid","Fully Paid","Partial Paid"],"name":"Repayment_Status"},
"Due_Principal_Amount":{"type":"Double","name":"Due_Principal_Amount"},
"Repayment_Date":{"type":"Date","name":"Repayment_Date"},
"Last_Activity_Time":{"type":"DateTime","name":"Last_Activity_Time"},
"Scheduling_Status":{"type":"utils/util/choice","picklist":true,"values":["-None-","Scheduled","Not Scheduled"],"name":"Scheduling_Status"},
"Due_Fees":{"type":"Double","name":"Due_Fees"},"Unsubscribed_Mode":{"type":"utils/util/choice","picklist":true,"values":["Consent form","Manual","Unsubscribe link","Zoho campaigns"],"name":"Unsubscribed_Mode"},
"Last_Paid_Date":{"type":"Date","name":"Last_Paid_Date"},"Unsubscribed_Time":{"type":"DateTime","name":"Unsubscribed_Time"},
"Record_Image":{"type":"String","name":"Record_Image"}}}

*/
