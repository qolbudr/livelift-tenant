import { NextFunction, Request, Response } from "express";
import dotenv from 'dotenv';
import { MainReponse } from "../types/main_response";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const check = async (req: Request, res: Response<MainReponse<any>>, next: NextFunction) => {
  try {
    dotenv.config();
    const url = process.env.MAIN_URL;
    const response = await fetch(`${url}/api/check`, { method: 'GET', headers: { 'Authorization': req.headers.authorization || '' } });
    const result = await response.json();
    if (response.status !== 200) {
      res.status(response.status).json(result);
      return;
    }

    if(req.path === "/api/live" && req.method === "POST") {
      const count = await prisma.live.count();
      if(count >= result.data.max_stream) {
        res.status(400).json({ code: 400, message: 'Max stream limit reached', data: null, token: undefined });
        return;
      }
    }

    next();
  } catch (error) {
    res.status(500).json({ code: 500, message: 'Internal Server Error', data: null, token: undefined });
  }
};