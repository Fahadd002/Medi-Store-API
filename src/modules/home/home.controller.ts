import { NextFunction, Request, Response } from "express";
import { homeService } from "./home.service";

const getHomepageData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await homeService.getHomepageData();
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (e) {
    next(e);
  }
};

export const HomeController = {
  getHomepageData
};