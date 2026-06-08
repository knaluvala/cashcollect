import { Router, type IRouter } from "express";
import healthRouter from "./health";
import collectionsRouter from "./collections";
import usersRouter from "./users";

const router: IRouter = Router();

router.use(healthRouter);
router.use(collectionsRouter);
router.use(usersRouter);

export default router;
