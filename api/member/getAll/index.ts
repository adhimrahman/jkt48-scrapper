import { VercelRequest, VercelResponse } from "@vercel/node";
import puppeteer, { Browser, Page } from "puppeteer";
import { MemberData } from "../../../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

export default async (req: VercelRequest, res: VercelResponse) => {
	let browser: Browser | null = null;

	try {
		browser = await launchBrowser();
		const page: Page = await browser.newPage();

		// await page.setDefaultNavigationTimeout(60000);
		await page.setDefaultNavigationTimeout(120000);
		// await page.goto(`${process.env.URL_SCRAP}/member/list?lang=id`);
		// await page.goto("https://example.com/members", { waitUntil: "domcontentloaded" });

		await page.goto(`${process.env.URL_SCRAP}/member/list?lang=id`, {
			waitUntil: "networkidle2",
		});		

		const memberData: MemberData[] = await page.evaluate(() => {
			const url: string = "https://jkt48.com";		
			const getID = (url: string): number => { return Number(url.slice(18).split("?")[0]) };
			const memberList: HTMLElement[] = Array.from( document.querySelectorAll(".row-all-10 .col-4 .entry-member"));
			const data: MemberData[] = memberList.map((member: HTMLElement) => ({
				id: getID(member.querySelector("a")!.getAttribute("href")!),
				image: `${url}` + member.querySelector("a img")!.getAttribute("src"),
				name: member.querySelector("a img")!.getAttribute("alt"),
				memberStatus: member.querySelector("a img")!.getAttribute("src")!.includes("v=") ? "Reguler" : "Trainee",
			}));
			return data;
		});
		res.status(200).json({ code: 200, result: memberData });
	} catch (error) {
		res.status(500).json({ error });
	} finally {
		if (browser) await browser.close();
	}
};
