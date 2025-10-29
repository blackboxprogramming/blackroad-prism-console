'use strict';

const fs = require('fs');
const path = require('path');

class MemoryPersister {
  constructor({ store, webdavClient = null, flatFilePath, logger = console }) {
    this.store = store;
    this.webdavClient = webdavClient;
    this.flatFilePath = flatFilePath || path.resolve(process.cwd(), 'logs/memory.txt');
    this.logger = logger;
  }

  async indexMemory(payload) {
    const timestamp = payload.created_at ? new Date(payload.created_at) : new Date();
    const entryPayload = {
      ...payload,
      text: payload.text.trim(),
      created_at: timestamp.toISOString(),
    };

    let webdavFilename = null;
    if (this.webdavClient) {
      try {
        webdavFilename = await this.webdavClient.storeEntry(entryPayload);
      } catch (error) {
        this.logger.warn('[memory] WebDAV write failed, falling back to local cache', { error: error.message });
      }
    }

    let storedEntry = null;
    if (this.store) {
      try {
        storedEntry = this.store.insertMemory(entryPayload);
      } catch (error) {
        this.logger.error('[memory] SQLite insert failed, writing to flat file fallback', { error: error.message });
      }
    }

    if (!storedEntry) {
      await this.appendToFlatFile(entryPayload);
      storedEntry = {
        id: null,
        text: entryPayload.text,
        source: entryPayload.source || 'unknown',
        tags: Array.isArray(entryPayload.tags) ? entryPayload.tags : [],
        created_at: entryPayload.created_at,
        score: null,
      };
    }

    return {
      entry: storedEntry,
      webdav: Boolean(webdavFilename),
      stored: Boolean(storedEntry && storedEntry.id !== undefined),
      fallback: storedEntry && storedEntry.id === null ? 'flat-file' : null,
      webdavFilename,
    };
  }

  async appendToFlatFile(entry) {
    const dir = path.dirname(this.flatFilePath);
    await fs.promises.mkdir(dir, { recursive: true });
    const line = `${JSON.stringify(entry)}\n`;
    await fs.promises.appendFile(this.flatFilePath, line, 'utf8');
  }

  search(query, limit = 10) {
    if (!this.store) {
      return [];
    }
    return this.store.searchMemories(query, limit);
  }

  getStats() {
    return {
      store: this.store ? this.store.getStats() : null,
      webdav: this.webdavClient ? this.webdavClient.getStatus() : null,
      flatFilePath: this.flatFilePath,
    };
  }
}

module.exports = {
  MemoryPersister,
};
