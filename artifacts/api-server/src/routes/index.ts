import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dayflowRouter from "./dayflow";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dayflowRouter);

export default router;
