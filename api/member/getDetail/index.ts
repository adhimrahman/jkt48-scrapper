import { VercelRequest, VercelResponse } from "@vercel/node";
import puppeteer, { Browser, Page } from "puppeteer";
import { DetailMember } from "../../../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

export default async (req: VercelRequest, res: VercelResponse) => {
	const { idmember } = req.query;

	if (!idmember) {
		res.status(400).json({ error: "idmember parameter is required" });
		return;
	}

	let browser: Browser | null = null;

	try {
		browser = await launchBrowser();
		const page: Page = await browser.newPage();
		await page.goto(`${process.env.URL_SCRAP}/member/detail/id/${idmember}?lang=id`);
		
		const detailMember: DetailMember = await page.evaluate(() => {
			const url: string = "https://jkt48.com";
			const listDetail: NodeList = document.querySelectorAll(".row .col-12 .entry-mypage__item .d-flex .entry-mypage__item--content");
			const data: DetailMember = {
				image: `${url}` + document.querySelector(".entry-mypage__profile img")!.getAttribute("src")!,
				fullName: (listDetail[0] as HTMLHeadElement).innerText,
				birthday: (listDetail[1] as HTMLHeadElement).innerText,
				bloodType: (listDetail[2] as HTMLHeadElement).innerText,
				zodiac: (listDetail[3] as HTMLHeadElement).innerText,
				height: (listDetail[4] as HTMLHeadElement).innerText,
				nickname: (listDetail[5] as HTMLHeadElement).innerText,
			};
			return data;
		});

		await browser.close();
		res.status(200).json({ code: 200, result: detailMember });
	} catch (error) {
		res.status(500).json({ error });
	} finally {
		if (browser) await browser.close();
	}
};