export class ZohoTaskRequest {
    dreamer_id: string; // Zoho ID
    sendpulse_id: string;
    dreamservice_customer_id: string; // Client ID
    subject: string;
    assign_to: string;
    due_date: Date;
    status: string;
    retool_url_required: string;
    sendpulse_url_required: string;
    type: string;
}