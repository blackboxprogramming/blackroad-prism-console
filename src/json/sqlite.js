'use strict';

const db = require('../db');

function list(resource, params) {
  const limit = Number(params.limit) || 20;
  const offset = Number(params.offset) || 0;
  const sort = params.sort;
  const fields = params.fields;
  const filters = params.filters || {};

  let sql = `SELECT * FROM ${resource}`;
  const where = [];
  const values = [];
  for (const [field, value] of Object.entries(filters)) {
    where.push(`${field} = ?`);
    values.push(value);
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ');
  if (sort) {
    const dir = sort.startsWith('-') ? 'DESC' : 'ASC';
    const col = sort.startsWith('-') ? sort.slice(1) : sort;
    sql += ` ORDER BY ${col} ${dir}`;
  }
  sql += ' LIMIT ? OFFSET ?';
  values.push(limit, offset);

  const rows = db.prepare(sql).all(...values);
  const count = db.prepare(`SELECT COUNT(*) as c FROM ${resource}`).get().c;

  let result = rows;
  if (Array.isArray(fields) && fields.length) {
    result = rows.map(row => {
      const obj = {};
      for (const f of fields) if (Object.prototype.hasOwnProperty.call(row, f)) obj[f] = row[f];
      return obj;
    });
  }

  return { rows: result, count };
}

function get(resource, id) {
  return db.prepare(`SELECT * FROM ${resource} WHERE id = ?`).get(id) || null;
}

module.exports = {
  name: 'sqlite',
  list,
  get,
};
