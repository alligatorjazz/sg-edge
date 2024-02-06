import sgMail, { MailDataRequired } from "@sendgrid/mail";
import sgClient from "@sendgrid/client";
import { testEmails } from "./config";
import { ClientRequest } from "@sendgrid/client/src/request";
import { createWriteStream } from "fs";
import https from "https";

export function loadSendgridAPI(token?: string) {
	if (token) {
		return [
			sgMail.setApiKey(token),
			sgClient.setApiKey(token)
		];
	}
	else { throw new Error("Sendgrid token not found.") }
}

export async function createJSONContactsExport(): Promise<string> {
	const request: ClientRequest = {
		url: `/v3/marketing/contacts/exports`,
		method: 'POST',
		body: {
			file_type: "json"
		}
	}

	const result = await sgClient.request(request)

	if ("id" in result[0].body)
		return result[0].body["id"] as string;
	else {
		throw new Error("Could not fetch list id. Response: " + JSON.stringify(result, null, 4))
	}
}

export async function fetchJSONContactsExport(id: string): Promise<string[]> {
	const request: ClientRequest = {
		url: `/v3/marketing/contacts/exports/${id}`,
		method: 'GET',
	}
	const result = await sgClient.request(request)

	if ("urls" in result[0].body) {
		console.log(result[0].body);
		return result[0].body["urls"] as string[];
	}
	else {
		throw new Error("Could not fetch client list. Response: " + JSON.stringify(result, null, 4))
	}
}

export async function fetchAllContacts() {
	const id = await createJSONContactsExport();
	console.log("id: ", id);
	const urls = await fetchJSONContactsExport(id);
	console.log("urls: ", urls)
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
		files.push(outputFile)
	}

	return files;
}

export async function sendEmail(messages: MailDataRequired[]) {
	// Sendgrid has a default rate limit of 600 requests per minute.
	// That works out to 100ms between requests, but some padding has been
	// added for safety. 
	const interval = 150;
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
		})
	}))
}