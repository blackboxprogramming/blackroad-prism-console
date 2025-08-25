'use strict';

const assert = require('assert');
const fs = require('fs');
const migrate = require('../backend/migrate');
const { DB_FILE } = migrate;

// Start fresh
try {
  fs.rmSync(DB_FILE, { force: true });
} catch {}

migrate();

let data = require('../backend/data');

// Insert user
const userId = data.addUser('tester@example.com', 'hash');
let users = data.getUsers();
assert.strictEqual(users.length, 1);

// Insert project
const project = data.addProject(userId, 'Demo Project');
let projects = data.getProjects(userId);
assert.strictEqual(projects.length, 1);

// Insert task
const task = data.addTask(project.id, 'First task', 'todo');
let tasks = data.getTasks(project.id);
assert.strictEqual(tasks.length, 1);
assert.strictEqual(tasks[0].status, 'todo');

// Update task
data.updateTask(task.id, { status: 'done' });
tasks = data.getTasks(project.id);
assert.strictEqual(tasks[0].status, 'done');

// Delete task
data.deleteTask(task.id);
tasks = data.getTasks(project.id);
assert.strictEqual(tasks.length, 0);

// Verify persistence across reload
data.closeDb();
delete require.cache[require.resolve('../backend/data')];
data = require('../backend/data');
users = data.getUsers();
assert.strictEqual(users.length, 1);
projects = data.getProjects(userId);
assert.strictEqual(projects.length, 1);

console.log('test_db passed');
