import type {Request, Response} from "express";
import path from 'path'
import fs from 'fs'
import "dotenv/config";

const projectRoot = path.resolve();


export function getCA(req: Request, res: Response) {
  res.set("Content-Type", "application/pkcs10");

  const certificateDir = process.env.PATH_CA;
  const rootCertFile = process.env.CA_ROOT_CRT;

  try {
    const readStream = fs.createReadStream(`${projectRoot}${certificateDir}/${rootCertFile}`);
    res.set("Content-Disposition",`attachment; filename=${rootCertFile}`);
    readStream.pipe(res);
  } catch (_e) {
    res.sendStatus(400);
  }
}
