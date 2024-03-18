"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkIfUnsubscribed = exports.getContactsByEmail = exports.addContact = exports.sendEmails = exports.fetchAllContacts = exports.fetchJSONContactsExport = exports.createJSONContactsExport = exports.loadSendgridAPI = void 0;
const mail_1 = __importDefault(require("@sendgrid/mail"));
const client_1 = __importDefault(require("@sendgrid/client"));
const fs_1 = require("fs");
const https_1 = __importDefault(require("https"));
let loaded = false;
function loadSendgridAPI(token) {
    if (token) {
        mail_1.default.setApiKey(token);
        client_1.default.setApiKey(token);
    }
    else {
        throw new Error("Sendgrid token not found.");
    }
    loaded = true;
}
exports.loadSendgridAPI = loadSendgridAPI;
function checkLoaded() {
    if (!loaded) {
        throw new Error("Sendgrid function called before Sendgrid API was loaded.");
    }
}
function createJSONContactsExport() {
    return __awaiter(this, void 0, void 0, function* () {
        checkLoaded();
        const request = {
            url: "/v3/marketing/contacts/exports",
            method: "POST",
            body: {
                file_type: "json"
            }
        };
        const result = yield client_1.default.request(request);
        if ("id" in result[0].body)
            return result[0].body["id"];
        else {
            throw new Error("Could not fetch list id. Response: " + JSON.stringify(result, null, 4));
        }
    });
}
exports.createJSONContactsExport = createJSONContactsExport;
function fetchJSONContactsExport(id) {
    return __awaiter(this, void 0, void 0, function* () {
        checkLoaded();
        const request = {
            url: `/v3/marketing/contacts/exports/${id}`,
            method: "GET",
        };
        const result = yield client_1.default.request(request);
        if ("urls" in result[0].body) {
            console.log(result[0].body);
            return result[0].body["urls"];
        }
        else {
            throw new Error("Could not fetch client list. Response: " + JSON.stringify(result, null, 4));
        }
    });
}
exports.fetchJSONContactsExport = fetchJSONContactsExport;
function fetchAllContacts() {
    return __awaiter(this, void 0, void 0, function* () {
        checkLoaded();
        const id = yield createJSONContactsExport();
        console.log("id: ", id);
        const urls = yield fetchJSONContactsExport(id);
        console.log("urls: ", urls);
        const files = [];
        for (const url of urls) {
            const filename = `./contacts-${new Date(Date.now()).toISOString()}.json`;
            const outputFile = (0, fs_1.createWriteStream)(filename);
            https_1.default.get(url, (res) => {
                res.pipe(outputFile);
                // after download completed close filestream
                outputFile
                    .on("finish", () => {
                    outputFile.close();
                    console.log("download complete: saved in ", filename);
                })
                    .on("error", (err) => console.error(err));
            });
            files.push(outputFile);
        }
        return files;
    });
}
exports.fetchAllContacts = fetchAllContacts;
function sendEmails(messages, interval = 150) {
    return __awaiter(this, void 0, void 0, function* () {
        checkLoaded();
        // Sendgrid has a default rate limit of 600 requests per minute.
        // That works out to 100ms between requests, but some padding has been
        // added for safety. 
        return Promise.all(messages.map((msg) => __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    try {
                        mail_1.default
                            .send(msg)
                            .then((response) => resolve(response));
                    }
                    catch (error) {
                        console.error(error);
                        reject(error);
                    }
                }, interval);
            });
        })));
    });
}
exports.sendEmails = sendEmails;
function addContact(contact) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "/v3/marketing/contacts",
            method: "PUT",
            body: { contacts: [contact] }
        };
        const result = yield client_1.default.request(request);
        if ("job_id" in result[0].body) {
            const jobId = result[0].body["job_id"];
            return jobId;
        }
        else {
            throw new Error("Could not add contact. Response: " + JSON.stringify(result, null, 4));
        }
    });
}
exports.addContact = addContact;
// export async function deleteContacts(...ids: string[]) {
// 	const request: ClientRequest = {
// 		url: "/v3/marketing/contacts",
// 		method: "DELETE",
// 		qs: { ids: ids.join(", ") }
// 	};
// 	const result = await sgClient.request(request);
// 	if ("job_id" in result[0].body) {
// 		const jobId = result[0].body["job_id"] as string;
// 		return jobId;
// 	} else {
// 		throw new Error("Could not delete contacts. Response: " + JSON.stringify(result, null, 4));
// 	}
// }
function getContactsByEmail(...emails) {
    return __awaiter(this, void 0, void 0, function* () {
        const request = {
            url: "/v3/marketing/contacts/search/emails",
            method: "POST",
            body: { emails }
        };
        const result = yield client_1.default.request(request);
        if (result[0].statusCode == 200 && "result" in result[0].body) {
            return result[0].body["result"];
        }
        else {
            throw new Error("Could not get contacts by email. Response: " + JSON.stringify(result, null, 4));
        }
    });
}
exports.getContactsByEmail = getContactsByEmail;
function checkIfUnsubscribed(email) {
    return __awaiter(this, void 0, void 0, function* () {
        // TODO: add second request for global unsubscribe endpoint
        // check for global unsubscribe
        const checkGlobalUnsubscribe = () => __awaiter(this, void 0, void 0, function* () {
            const request = {
                url: `/v3/asm/suppressions/global/${email}`,
                method: "GET"
            };
            const [response] = yield client_1.default.request(request);
            // console.log(JSON.stringify(response.body, null, 4));
            if (response.statusCode !== 200) {
                console.error(`Unable to retrieve global unsubscribe info for ${email} - assuming unsubscribed`);
                return true;
            }
            if ("recipient_email" in response.body) {
                return true;
            }
            return false;
        });
        const checkGroupUnsubscribe = () => __awaiter(this, void 0, void 0, function* () {
            const request = {
                url: `/v3/asm/suppressions/${email}`,
                method: "GET"
            };
            const [response] = yield client_1.default.request(request);
            // console.log(JSON.stringify(response.body, null, 4));
            if (response.statusCode !== 200) {
                console.error(`Unable to retrieve unsubscribe info for ${email} - assuming unsubscribed`);
                return true;
            }
            if (response.body.suppressions.filter(suppression => suppression.suppressed).length > 0) {
                return true;
            }
            return false;
        });
        if ((yield checkGlobalUnsubscribe())) {
            return true;
        }
        else {
            return yield checkGroupUnsubscribe();
        }
    });
}
exports.checkIfUnsubscribed = checkIfUnsubscribed;
// export async function checkJobStatus(jobId: string) {
// 	const request: ClientRequest = {
// 		url: `/v3/marketing/contacts/imports/${jobId}`,
// 		method: "GET",
// 	};
// 	const result = await sgClient.request(request);
// 	if ("status" in result[0].body && "started_at" in result[0].body && "job_type" in result[0].body) {
// 		const { status, started_at, job_type } = result[0].body as Record<string, string>;
// 		return { status, started_at, job_type };
// 	}
// 	else {
// 		throw new Error("Could not fetch job status. Response: " + JSON.stringify(result, null, 4));
// 	}
// }
