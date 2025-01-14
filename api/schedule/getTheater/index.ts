import { VercelRequest, VercelResponse } from "@vercel/node";
import puppeteer, { Browser, Page } from "puppeteer";
import { ScheduleListDetail, ScheduleList, ScheduleData } from "../../../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

export default async (req: VercelRequest, res: VercelResponse) => {
	let browser: Browser | null = null;

	try {
		browser = await launchBrowser();
		const page: Page = await browser.newPage();
		await page.goto(`${process.env.URL_SCRAP}/theater/schedule?lang=id`);

		const scheduleDetailData: ScheduleListDetail[] = await page.evaluate(() => {
			const dateConvert = (date: string): string => date.replace("\n", " ");
			const titleConvert = (title: string): string => title.replace(/\n/g, " ");
			const scheduleList: ScheduleListDetail[] = [];
			const tables = document.querySelectorAll(".table-pink__scroll table"); 
			if (!tables || tables.length < 2) { throw new Error("Table not found on the page") }
			const rows = Array.from( (tables[1] as HTMLElement).querySelectorAll("tbody tr") );
	
			rows.forEach((schedule) => {
				const listMember: string[] = [];
				const seitansai: string[] = [];
				const memberElements = Array.from(schedule.querySelectorAll("td a")) as HTMLElement[];
				memberElements.forEach((member) => {
					if (!member.getAttribute("style")) { listMember.push(member.innerText) }
					else { seitansai.push(member.innerText) }
				});
				scheduleList.push({
					show: dateConvert(schedule.querySelectorAll("td")[0]?.innerText || ""),
					setlist: titleConvert(schedule.querySelectorAll("td")[1]?.innerText || ""),
					member: listMember,
					seitansai,
				});
			});
			return scheduleList;
		});
	
		res.status(200).json({ code: 200, result: scheduleDetailData });
	} catch (error) {
		res.status(500).json({ error });
	} finally {
		if (browser) await browser.close();
	}
};
