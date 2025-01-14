import { VercelRequest, VercelResponse } from "@vercel/node";
import puppeteer, { Browser, Page } from "puppeteer";
import { ScheduleListDetail, ScheduleList, ScheduleData } from "../../../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

export default async (req: VercelRequest, res: VercelResponse) => {
	const { idschedule } = req.query;

	if (!idschedule) {
		res.status(400).json({ error: "idschedule parameter is required" });
		return;
	}

	let browser: Browser | null = null;

	try {
		browser = await launchBrowser();
		const page: Page = await browser.newPage();
		await page.goto(`${process.env.URL_SCRAP}/theater/schedule/id/${idschedule}?lang=id`);

		const scheduleDetailData: ScheduleListDetail[] = await page.evaluate( () => {
			const dateConvert = (date: string): string => date.replace("\n", " ");
			const titleConvert = (title: string): string => title.replace(/\n/g, " ");
			const scheduleList: ScheduleListDetail[] = [];
			const getTable = document.querySelectorAll( ".table-pink__scroll table");
			const getRowTable: HTMLElement[] = Array.from( (getTable[1] as HTMLElement).querySelectorAll("tbody tr") );

			getRowTable.forEach((schedule) => {
				const listMember: string[] = [];
				const seitansai: string[] = [];
				schedule.querySelectorAll("td a").forEach((member) => {
					if (!member.getAttribute("style")) { listMember.push((member as HTMLElement).innerText) }
					else { seitansai.push((member as HTMLElement).innerText) }
				});

				scheduleList.push({
					show: dateConvert(schedule.querySelectorAll("td")[0].innerText),
					setlist: titleConvert( schedule.querySelectorAll("td")[1].innerText ),
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
