import puppeteer, { Browser, Page } from "puppeteer";
import { Request, Response, NextFunction } from "express";
import { NewsDataList } from "../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

const news = {
    getAllNews: async (req: Request, res: Response, next: NextFunction) => {
        let browser: Browser | null = null;
        try {
            browser = await launchBrowser();
            const page: Page = await browser.newPage();
            await page.goto(`${process.env.URL_SCRAP}/news/list?lang=id`);

            const newsDataList: NewsDataList[] = await page.evaluate(() => {
                const categoryFilter = (category: string): string => {
                    switch (category.slice(8).split(".")[1]) {
                        case "cat1":
                            return "Theater";
                        case "cat2":
                            return "Event";
                        case "cat4":
                            return "Release";
                        case "cat5":
                            return "Birthday";
                        case "cat8":
                            return "Other";
                        default:
                            return "Unknown";
                    }
                };

                const getID = (url: string): number => { return Number(url.slice(16).split("?")[0]) };
                const getNews: HTMLElement[] = Array.from( document.querySelectorAll(".entry-news .entry-news__list") );
                const data: NewsDataList[] = getNews.map((news: HTMLElement) => ({
                    id: getID(news.querySelector("h3 a")?.getAttribute("href")!),
                    title: (news.querySelector("h3 a") as HTMLHeadElement).innerText,
                    date: (news.querySelector("time") as HTMLHeadElement).innerText,
                    category: categoryFilter(news.querySelector(".entry-news__list--label img")?.getAttribute("src")!),
                }));

                return data;
            });

            res.status(200).json({ code: 200, result: newsDataList });
        } catch (error) { next(error);
        } finally { if (browser) await browser.close() }
    },
};

export default news;