import { NextFunction, Request, Response } from "express";
import dotenv from 'dotenv';
import { MainReponse } from "../types/main_response";

export const check = async (req: Request, res: Response<MainReponse<any>>, next: NextFunction) => {
  try {
    dotenv.config();
    const url = process.env.MAIN_URL;
    const response = await fetch(`${url}/api/check`, { method: 'GET', headers: { 'Authorization': req.headers.authorization || '' } });
    const data = await response.json();
    if (response.status !== 200) {
      res.status(response.status).json(data);
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Internal Server Error', data: null, token: undefined });
  }
};