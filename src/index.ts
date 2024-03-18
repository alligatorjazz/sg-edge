import sgMail, { MailDataRequired } from "@sendgrid/mail";
import sgClient from "@sendgrid/client";
import { ClientRequest } from "@sendgrid/client/src/request";
import { createWriteStream } from "fs";
import https from "https";
type SendgridContact = { email: string } & Partial<{
	id: string,
	city: string,
	country: string,
	first_name: string,
	last_name: string,
	postal_code: string,
	state_province_region: string,
	created_at: string,
	updated_at: string,
	custom_fields: Record<string, unknown>
}>

let loaded = false;
export function loadSendgridAPI(token?: string) {
	if (token) {
		sgMail.setApiKey(token);
		sgClient.setApiKey(token);
	}
	else { throw new Error("Sendgrid token not found."); }
	loaded = true;
}

function checkLoaded() {
	if (!loaded) {
		throw new Error("Sendgrid function called before Sendgrid API was loaded.");
	}
}

export async function createJSONContactsExport(): Promise<string> {
	checkLoaded();
	const request: ClientRequest = {
		url: "/v3/marketing/contacts/exports",
		method: "POST",
		body: {
			file_type: "json"
		}
	};

	const result = await sgClient.request(request);

	if ("id" in result[0].body)
		return result[0].body["id"] as string;
	else {
		throw new Error("Could not fetch list id. Response: " + JSON.stringify(result, null, 4));
	}
}

export async function fetchJSONContactsExport(id: string): Promise<string[]> {
	checkLoaded();
	const request: ClientRequest = {
		url: `/v3/marketing/contacts/exports/${id}`,
		method: "GET",
	};
	const result = await sgClient.request(request);

	if ("urls" in result[0].body) {
		console.log(result[0].body);
		return result[0].body["urls"] as string[];
	}
	else {
		throw new Error("Could not fetch client list. Response: " + JSON.stringify(result, null, 4));
	}
}

export async function fetchAllContacts() {
	checkLoaded();
	const id = await createJSONContactsExport();
	console.log("id: ", id);
	const urls = await fetchJSONContactsExport(id);
	console.log("urls: ", urls);
	const files = [];
	for (const url of urls) {
		const filename = `./contacts-${new Date(Date.now()).toISOString()}.json`;
		const outputFile = createWriteStream(filename);
		https.get(url, (res) => {
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
}

export async function sendEmails(messages: MailDataRequired[], interval = 150) {
	checkLoaded();
	// Sendgrid has a default rate limit of 600 requests per minute.
	// That works out to 100ms between requests, but some padding has been
	// added for safety. 
	return Promise.all(messages.map(async msg => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				try {
					sgMail
						.send(msg)
						.then((response) => resolve(response));
				} catch (error) {
					console.error(error);
					reject(error);
				}
			}, interval);
		});
	}));
}



export async function addContact(contact: SendgridContact) {
	const request: ClientRequest = {
		url: "/v3/marketing/contacts",
		method: "PUT",
		body: { contacts: [contact] }
	};

	const result = await sgClient.request(request);

	if ("job_id" in result[0].body) {
		const jobId = result[0].body["job_id"] as string;
		return jobId;
	} else {
		throw new Error("Could not add contact. Response: " + JSON.stringify(result, null, 4));
	}
}

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

export async function getContactsByEmail(...emails: string[]): Promise<{
	[email: string]: { contact: SendgridContact }
}> {

	const request: ClientRequest = {
		url: "/v3/marketing/contacts/search/emails",
		method: "POST",
		body: { emails }
	};

	const result = await sgClient.request(request);
	if (result[0].statusCode == 200 && "result" in result[0].body) {
		return result[0].body["result"] as {
			[email: string]: { contact: SendgridContact }
		};
	} else {
		throw new Error("Could not get contacts by email. Response: " + JSON.stringify(result, null, 4));
	}
}


export async function checkIfUnsubscribed(email: string) {
	// TODO: add second request for global unsubscribe endpoint
	// check for global unsubscribe
	const checkGlobalUnsubscribe = async () => {
		const request: ClientRequest = {
			url: `/v3/asm/suppressions/global/${email}`,
			method: "GET"
		};

		const [response] = await sgClient.request(request) as [{
			"statusCode": number,
			"body": { "recipient_email": string }
		}, unknown];

		// console.log(JSON.stringify(response.body, null, 4));

		if (response.statusCode !== 200) {
			console.error(`Unable to retrieve global unsubscribe info for ${email} - assuming unsubscribed`);
			return true;
		}

		if ("recipient_email" in response.body) {
			return true;
		}

		return false;
	};

	const checkGroupUnsubscribe = async () => {
		const request: ClientRequest = {
			url: `/v3/asm/suppressions/${email}`,
			method: "GET"
		};

		const [response] = await sgClient.request(request) as [{
			"statusCode": number,
			"body": { "suppressions": { "suppressed": boolean }[] }
		}, unknown];

		// console.log(JSON.stringify(response.body, null, 4));

		if (response.statusCode !== 200) {
			console.error(`Unable to retrieve unsubscribe info for ${email} - assuming unsubscribed`);
			return true;
		}

		if (response.body.suppressions.filter(suppression => suppression.suppressed).length > 0) {
			return true;
		}

		return false;
	};
	if ((await checkGlobalUnsubscribe())) {
		return true;
	} else {
		return await checkGroupUnsubscribe();
	}
}
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