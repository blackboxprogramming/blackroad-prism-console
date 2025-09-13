import { Router } from 'express';
import Ajv from 'ajv';
import { predict } from '../lib/ml/serve.js';

const r = Router();
const ajv = new Ajv();
const schema = { type:'object', properties:{ features:{ type:'array', items:{type:'number'}, minItems:1 }}, required:['features'] };
const validate = ajv.compile(schema);

r.post('/', (req, res) => {
  if (!validate(req.body)) return res.status(400).json({ error:'bad_request', details: validate.errors });
  const prob = predict(req.body.features as number[]);
  res.json({ ok:true, prob });
});

export default r;
