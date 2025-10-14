import { Request, Response, NextFunction } from 'express';

type Rule = { pattern:string; replace:string };
const rules: Rule[] = (() => {
  try { return JSON.parse(process.env.DLP_REGEXES || '[]'); } catch { return []; }
})();

export function dlpRedact(){
  return (req: any, _res: Response, next: NextFunction) => {
    if (req.body && typeof req.body === 'object') {
      const str = JSON.stringify(req.body);
      const red = rules.reduce((acc, r) => acc.replace(new RegExp(r.pattern, 'g'), r.replace), str);
      if (red !== str) req.body = JSON.parse(red);
    }
    next();
  };
}
