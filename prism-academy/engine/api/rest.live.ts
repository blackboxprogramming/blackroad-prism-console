import { Router } from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import Ajv, { DefinedError } from 'ajv';
import addFormats from 'ajv-formats';
import clubSchema from '../../labs/schemas/club.schema.json';
import labSessionSchema from '../../labs/schemas/lab_session.schema.json';
import projectSchema from '../../labs/schemas/project.schema.json';
import { PrismClubDefinition, LabSessionDefinition, PrismProject } from '../types';
import { EventStore } from '../runtime/events';

const clubsDir = path.resolve('prism-academy', 'clubs');
const sessionsDir = path.resolve('prism-academy', 'labs', 'sessions');
const projectsDir = path.resolve('prism-academy', 'labs', 'projects');

const router = Router();
const eventStore = new EventStore();

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const validateClub = ajv.compile<PrismClubDefinition>(clubSchema as any);
const validateSession = ajv.compile<LabSessionDefinition>(labSessionSchema as any);
const validateProject = ajv.compile<PrismProject>(projectSchema as any);

async function readJsonDir<T>(dir: string): Promise<T[]> {
  try {
    const files = await fs.readdir(dir);
    const entries: T[] = [];
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(dir, file), 'utf8');
      entries.push(JSON.parse(raw) as T);
    }
    return entries;
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

async function writeJson(filePath: string, data: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function formatErrors(errors: DefinedError[] | null | undefined) {
  return (errors ?? []).map((err) => `${err.instancePath || '/'} ${err.message}`);
}

router.get('/clubs', async (_req, res, next) => {
  try {
    const clubs = await readJsonDir<PrismClubDefinition>(clubsDir);
    res.json(clubs);
  } catch (error) {
    next(error);
  }
});

router.get('/clubs/:id', async (req, res, next) => {
  try {
    const file = path.join(clubsDir, `${req.params.id}.json`);
    const raw = await fs.readFile(file, 'utf8');
    res.json(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Club not found' });
      return;
    }
    next(error);
  }
});

router.post('/clubs', async (req, res) => {
  const club = req.body;
  if (!validateClub(club)) {
    res.status(400).json({ errors: formatErrors(validateClub.errors) });
    return;
  }
  await writeJson(path.join(clubsDir, `${club.id}.json`), club);
  res.status(201).json(club);
});

router.put('/clubs/:id', async (req, res) => {
  const club = req.body;
  if (!validateClub(club)) {
    res.status(400).json({ errors: formatErrors(validateClub.errors) });
    return;
  }
  if (club.id !== req.params.id) {
    res.status(400).json({ error: 'ID mismatch' });
    return;
  }
  await writeJson(path.join(clubsDir, `${club.id}.json`), club);
  res.json(club);
});

router.delete('/clubs/:id', async (req, res, next) => {
  try {
    await fs.unlink(path.join(clubsDir, `${req.params.id}.json`));
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Club not found' });
      return;
    }
    next(error);
  }
});

router.get('/sessions', async (_req, res, next) => {
  try {
    const sessions = await readJsonDir<LabSessionDefinition>(sessionsDir);
    res.json(sessions);
  } catch (error) {
    next(error);
  }
});

router.get('/sessions/:id', async (req, res, next) => {
  try {
    const raw = await fs.readFile(path.join(sessionsDir, `${req.params.id}.json`), 'utf8');
    res.json(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    next(error);
  }
});

router.post('/sessions', async (req, res) => {
  const session = req.body;
  if (!validateSession(session)) {
    res.status(400).json({ errors: formatErrors(validateSession.errors) });
    return;
  }
  await writeJson(path.join(sessionsDir, `${session.id}.json`), session);
  res.status(201).json(session);
});

router.put('/sessions/:id', async (req, res) => {
  const session = req.body;
  if (!validateSession(session)) {
    res.status(400).json({ errors: formatErrors(validateSession.errors) });
    return;
  }
  if (session.id !== req.params.id) {
    res.status(400).json({ error: 'ID mismatch' });
    return;
  }
  await writeJson(path.join(sessionsDir, `${session.id}.json`), session);
  res.json(session);
});

router.delete('/sessions/:id', async (req, res, next) => {
  try {
    await fs.unlink(path.join(sessionsDir, `${req.params.id}.json`));
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Session not found' });
      return;
    }
    next(error);
  }
});

router.get('/sessions/:id/events', async (req, res, next) => {
  try {
    const events = await eventStore.load(req.params.id);
    res.json(events);
  } catch (error) {
    next(error);
  }
});

router.get('/projects', async (_req, res, next) => {
  try {
    const projects = await readJsonDir<PrismProject>(projectsDir);
    res.json(projects);
  } catch (error) {
    next(error);
  }
});

router.get('/projects/:id', async (req, res, next) => {
  try {
    const raw = await fs.readFile(path.join(projectsDir, `${req.params.id}.json`), 'utf8');
    res.json(JSON.parse(raw));
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    next(error);
  }
});

router.post('/projects', async (req, res) => {
  const project = req.body;
  if (!validateProject(project)) {
    res.status(400).json({ errors: formatErrors(validateProject.errors) });
    return;
  }
  await writeJson(path.join(projectsDir, `${project.id}.json`), project);
  res.status(201).json(project);
});

router.put('/projects/:id', async (req, res) => {
  const project = req.body;
  if (!validateProject(project)) {
    res.status(400).json({ errors: formatErrors(validateProject.errors) });
    return;
  }
  if (project.id !== req.params.id) {
    res.status(400).json({ error: 'ID mismatch' });
    return;
  }
  await writeJson(path.join(projectsDir, `${project.id}.json`), project);
  res.json(project);
});

router.delete('/projects/:id', async (req, res, next) => {
  try {
    await fs.unlink(path.join(projectsDir, `${req.params.id}.json`));
    res.status(204).send();
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    next(error);
  }
});

export default router;
