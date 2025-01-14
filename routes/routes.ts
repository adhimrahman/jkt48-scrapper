import express, { Router } from "express";
import { serverlessToExpress } from "../utils/adapter";

import getAllMembers from "../api/member/getAll/index";
import getMemberDetail from "../api/member/getDetail/index";
import getSchedule from "../api/schedule/getSchedule/index";
import getDetailSchedule from "../api/schedule/getDetail/index";
import getTheaterSchedule from "../api/schedule/getTheater/index";
import getAllNews from "../api/news/index";
import listBirthDay from "../api/birthday/index";

const router: Router = express.Router();

router.get("/schedule", serverlessToExpress(getSchedule));
router.get("/schedule/detail/:idschedule", serverlessToExpress(getDetailSchedule));
router.get("/schedule/theater", serverlessToExpress(getTheaterSchedule));
router.get("/member", serverlessToExpress(getAllMembers));
router.get("/member/detail/:idmember", serverlessToExpress(getMemberDetail));
router.get("/news", serverlessToExpress(getAllNews));
router.get("/birthday", serverlessToExpress(listBirthDay));

export default router;