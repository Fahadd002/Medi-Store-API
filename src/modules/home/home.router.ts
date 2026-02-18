import express, { Router } from "express";
import { HomeController } from "./home.controller";
const router = express.Router();

router.get("/", HomeController.getHomepageData);

export const homeRouter: Router = router;