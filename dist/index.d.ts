/// <reference types="node" />
import { MailDataRequired } from "@sendgrid/mail";
type SendgridContact = {
    email: string;
} & Partial<{
    id: string;
    city: string;
    country: string;
    first_name: string;
    last_name: string;
    postal_code: string;
    state_province_region: string;
    created_at: string;
    updated_at: string;
    custom_fields: Record<string, unknown>;
}>;
export declare function loadSendgridAPI(token?: string): void;
export declare function createJSONContactsExport(): Promise<string>;
export declare function fetchJSONContactsExport(id: string): Promise<string[]>;
export declare function fetchAllContacts(): Promise<import("fs").WriteStream[]>;
export declare function sendEmails(messages: MailDataRequired[], interval?: number): Promise<unknown[]>;
export declare function addContact(contact: SendgridContact): Promise<string>;
export declare function deleteContacts(...ids: string[]): Promise<string>;
export declare function getContactsByEmail(...emails: string[]): Promise<{
    email: string;
} & Partial<{
    id: string;
    city: string;
    country: string;
    first_name: string;
    last_name: string;
    postal_code: string;
    state_province_region: string;
    created_at: string;
    updated_at: string;
    custom_fields: Record<string, unknown>;
}> & {
    id: string;
}>;
export declare function checkJobStatus(jobId: string): Promise<{
    status: string;
    started_at: string;
    job_type: string;
}>;
export {};
