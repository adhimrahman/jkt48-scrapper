import { VercelRequest, VercelResponse } from "@vercel/node";
import puppeteer, { Browser, Page } from "puppeteer";
import fs from "fs";
import path from "path";
import { MemberData } from "../../../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

const DATA_MEMBER = path.join(process.cwd(), "datas", "getAll.json");

export default async (req: VercelRequest, res: VercelResponse) => {
	let browser: Browser | null = null;

	try {
		if (fs.existsSync(DATA_MEMBER)) {
			const existingData = JSON.parse(fs.readFileSync(DATA_MEMBER, "utf-8"));
			res.status(200).json({ code: 200, result: existingData });
		}

		browser = await launchBrowser();
		const page: Page = await browser.newPage();

		await page.setDefaultNavigationTimeout(120000);
		// await page.goto(`${process.env.URL_SCRAP}/member/list?lang=id`);
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

		const dataToSave = {
			lastUpdated: new Date().toISOString(),
			data: memberData,
		};

		if (!fs.existsSync(path.dirname(DATA_MEMBER))) {
			fs.mkdirSync(path.dirname(DATA_MEMBER), { recursive: true });
		}

		fs.writeFileSync(DATA_MEMBER, JSON.stringify(dataToSave, null, 2), "utf-8");

		// res.status(200).json({ code: 200, result: memberData });
		res.status(200).json({ code: 200, result: dataToSave });
	} catch (error) {
		res.status(500).json({ error });
		console.log("error plsss")
	} finally {
		if (browser) await browser.close();
	}
};
