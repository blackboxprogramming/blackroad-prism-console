#!/usr/bin/env node

process.env.NODE_ENV = process.env.NODE_ENV || 'test';

const jest = require('jest');

jest.run(process.argv.slice(2));
