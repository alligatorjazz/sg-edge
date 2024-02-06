import { MailDataRequired } from "@sendgrid/mail";
import { expect, test } from "vitest";
import { loadSendgridAPI, sendEmail } from "../src";

test("test api key present", () => {
	expect(typeof process.env["TEST_API_KEY"] === "string" && process.env["TEST_API_KEY"].length > 2);
});

// TODO: test email send
test("send test email", async () => {
	const message: MailDataRequired = {
		to: process.env["TEST_ADDRESS"],
		from: "webmaster@falchionstudios.com", // Use the email address or domain you verified above
		subject: "Email Test (Vitest)",
		asm: { groupId: 22975 },
		templateId: process.env["TEST_TEMPLATE_ID"],
		dynamicTemplateData: {
			"content": "This is a test email from vitest."
		}
	};
	loadSendgridAPI(process.env["TEST_API_KEY"]);
	await sendEmail(message);
});