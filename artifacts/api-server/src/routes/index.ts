import { Router, type IRouter } from "express";
import aiRouter from "./ai";
import devAgentRouter from "./devAgent";
import healthRouter from "./health";
import collectionsRouter from "./collections";
import usersRouter from "./users";
import parlorsRouter from "./parlors";
import routesRouter from "./routes";
import authRouter from "./auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(aiRouter);
router.use(devAgentRouter);
router.use(collectionsRouter);
router.use(usersRouter);
router.use(parlorsRouter);
router.use(routesRouter);

export default router;
