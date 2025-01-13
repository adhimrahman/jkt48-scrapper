import puppeteer, { Browser, Page } from "puppeteer";
import { Request, Response, NextFunction } from "express";
import { DetailMember, MemberData } from "../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

const member = {
	getAllMember: async (req: Request, res: Response, next: NextFunction) => {
		let browser: Browser | null = null;
		try {
			browser = await launchBrowser();
			const page: Page = await browser.newPage();
			await page.goto(`${process.env.URL_SCRAP}/member/list?lang=id`);

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
		} catch (error) { next(error);
		} finally { if (browser) await browser.close() }
	},

	getDetailMember: async (req: Request, res: Response, next: NextFunction) => {
		const { idmember } = req.params;
		const browser: Browser = await puppeteer.launch({ headless: false });
		const page: Page = await browser.newPage();

		try {
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
		} catch (error) { next(error);
		}finally { if (browser) await browser.close() }
	},
};

export default member;