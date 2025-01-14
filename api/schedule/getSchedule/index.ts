import { VercelRequest, VercelResponse } from "@vercel/node";
import {  ScheduleList, ScheduleData } from "../../../utils/types";
import puppeteer, { Browser, Page } from "puppeteer";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

export default async (req: VercelRequest, res: VercelResponse) => {
	let browser: Browser | null = null;

	try {
		browser = await launchBrowser();
		const page: Page = await browser.newPage();
		await page.goto(`${process.env.URL_SCRAP}/calendar/list?lang=id`);

		const scheduleData: ScheduleData = await page.evaluate(() => {
			const dateConvert = (date: string): string => date.replace("\n", " ");
			const categoryFilter = (category: string): string => {
				const map: Record<string, string> = { cat2: "Event", cat17: "Show Theater", cat19: "Show Trainee", };
				const key = category.slice(8).split(".")[1];
				return map[key] || "Unknown";
			};
			const generateID = (url: string): number => {
				return url.includes("theater") ? Number(url.slice(22).split("?")[0])
				: Number( url.slice(17, 30).split("/")[0] + url.slice(17, 30).split("/")[2] + url.slice(17, 30).split("/")[4] );
			};
			const scheduleList: ScheduleList[] = Array.from(
				document.querySelectorAll(".entry-schedule__calendar .table tbody tr") ).map((schedule) => ({
					date: dateConvert( (schedule.querySelector("td h3") as HTMLElement).innerText ),
					event: Array.from(schedule.querySelectorAll("td .contents")).map( (event) => ({
						id: generateID(event.querySelector("p a")!.getAttribute("href")!),
						title: (event.querySelector("p a") as HTMLElement)?.innerText,
						category: categoryFilter( event.querySelector("span img")!.getAttribute("src")! ),
					})),
			}));

			return {
				period: ( document.querySelector( ".entry-schedule__header .entry-schedule__header--center") as HTMLElement ).innerText, listSchedule: scheduleList,
			};
		});
		res.status(200).json({ code: 200, result: scheduleData });
	} catch (error) {
		res.status(500).json({ error });
	} finally {
		if (browser) await browser.close();
	}
};
