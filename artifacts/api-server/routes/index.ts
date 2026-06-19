import { Router, type IRouter } from "express";
import aiRouter from "./ai";
import healthRouter from "./health";
import collectionsRouter from "./collections";
import usersRouter from "./users";
import parlorsRouter from "./parlors";
import routesRouter from "./routes";

const router: IRouter = Router();

router.use(aiRouter);
router.use(healthRouter);
router.use(collectionsRouter);
router.use(usersRouter);
router.use(parlorsRouter);
router.use(routesRouter);

export default router;
