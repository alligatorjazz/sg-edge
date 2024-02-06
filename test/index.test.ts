import { expect, test } from "vitest";

test("test api key present", () => {
	expect(typeof process.env["TEST_API_KEY"] === "string" && process.env["TEST_API_KEY"].length > 2);
});
