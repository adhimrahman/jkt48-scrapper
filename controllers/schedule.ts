import puppeteer, { Browser, Page } from "puppeteer";
import { Request, Response, NextFunction } from "express";
import { ScheduleListDetail, ScheduleList, ScheduleData } from "../utils/types";

const launchBrowser = async (): Promise<Browser> => { return puppeteer.launch({ headless: true, args: ["--no-sandbox"] }) };

const schedule = {
    getSchedule: async (req: Request, res: Response, next: NextFunction) => {
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
                const scheduleList: ScheduleList[] = Array.from( document.querySelectorAll(".entry-schedule__calendar .table tbody tr") ).map((schedule) => ({
                    date: dateConvert( (schedule.querySelector("td h3") as HTMLElement).innerText ),
                    event: Array.from(schedule.querySelectorAll("td .contents")).map( (event) => ({
                        id: generateID(event.querySelector("p a")!.getAttribute("href")!),
                        title: (event.querySelector("p a") as HTMLElement)?.innerText,
                        category: categoryFilter( event.querySelector("span img")!.getAttribute("src")! ),
                    })),
                }));

                return {
                    period: ( document.querySelector( ".entry-schedule__header .entry-schedule__header--center") as HTMLElement ).innerText,
                    listSchedule: scheduleList,
                };
            });
            res.status(200).json({ code: 200, result: scheduleData });
        } catch (error) { next(error);
        } finally { if (browser) await browser.close() }
    },

    getDetailSchedule: async (req: Request, res: Response, next: NextFunction) => {
        const { idschedule } = req.params;
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
        } catch (error) { next(error);
        } finally { if (browser) await browser.close() }
    },

    getTheaterSchedule: async (req: Request, res: Response, next: NextFunction) => {
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
        } catch (error) { next(error);
        } finally { if (browser) await browser.close() }
    },
};

export default schedule;