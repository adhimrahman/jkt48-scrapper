import puppeteer, { Browser, Page } from "puppeteer";
import { Request, Response, NextFunction } from "express";
import { BirthdayDataList } from "../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

const birthday = {
    listBirthDay: async (req: Request, res: Response, next: NextFunction) => {
        let browser: Browser | null = null;
        try {
            browser = await launchBrowser();
            const page: Page = await browser.newPage();
            await page.goto(`${process.env.URL_SCRAP}`);

            const birthDayList: BirthdayDataList[] = await page.evaluate(() => {
                const factoryData = ( data: string, payload: string ): string | undefined => {
                    switch (payload) {
                        case "GET_NAME":
                            return data.split("\n")[1];
                        case "GET_DATE":
                            return data.split("\n")[2];
                        case "GET_STATUS":
                            return data.split("\n")[0].replaceAll("[", "").replaceAll("]", "");
                    }
                };

                const getListBirthDay: HTMLElement[] = Array.from(
                    document.querySelectorAll( ".entry-home__schedule--birthday .entry-home__schedule--birthday__item" )
                );

                const data: BirthdayDataList[] = getListBirthDay.map(
                    (listBirthDay: HTMLElement) => ({
                        date: factoryData( (listBirthDay.querySelector("p") as HTMLHeadElement).innerText, "GET_DATE" ),
                        name: factoryData( (listBirthDay.querySelector("p") as HTMLHeadElement).innerText, "GET_NAME" ),
                        statusMember: factoryData( (listBirthDay.querySelector("p") as HTMLHeadElement).innerText, "GET_STATUS" ),
                    })
                );

                return data;
            });

            res.status(200).json({ code: 200, result: birthDayList });
        } catch (error) { next(error);
        } finally { if (browser) await browser.close() }
    },
};

export default birthday;