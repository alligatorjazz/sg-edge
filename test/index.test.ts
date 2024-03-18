import { MailDataRequired } from "@sendgrid/mail";
import { describe } from "node:test";
import { expect, test } from "vitest";
import { addContact, checkJobStatus, deleteContacts, getContactsByEmail, loadSendgridAPI, sendEmails } from "../src";
import { sleep } from "../src/lib";
test("test api key present", () => {
	expect(typeof process.env["TEST_API_KEY"] === "string" && process.env["TEST_API_KEY"].length > 2);
});

describe("email sends", () => {
	test("send test email", async () => {
		const message: MailDataRequired = {
			to: process.env["TEST_ADDRESS"],
			from: "webmaster@falchionstudios.com", // Use the email address or domain you verified above
			asm: { groupId: 22975 },
			templateId: process.env["TEST_TEMPLATE_ID"] as string,
			dynamicTemplateData: {
				"subject": "Email Test (Vitest)",
				"preheader": "Test: Send Test Email",
				"content": "This is a test email from vitest."
			}
		};
		loadSendgridAPI(process.env["TEST_API_KEY"]);
		await sendEmails([message]);
	});
});

describe("adding contacts", () => {
	const testEmail = "webmaster@falchionstudios.com";
	test.sequential("add contact", async () => {
		loadSendgridAPI(process.env["TEST_API_KEY"]);
		const jobId = await addContact({ email: testEmail });
		expect(jobId).toBeTruthy();
	});
});

test("get contacts by email", async () => {
	const testEmail = "webmaster@falchionstudios.com";
	loadSendgridAPI(process.env["TEST_API_KEY"]);
	await addContact({email: testEmail});
	await sleep(5000);
	const result = await getContactsByEmail(testEmail);
	expect(result[testEmail].contact).toBeTruthy();
}, 1000 * 30);
