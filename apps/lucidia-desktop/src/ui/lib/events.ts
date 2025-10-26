export const CODEX_INSERT_EVENT = 'lucidia:codex:insert';

export interface CodexInsertDetail {
  docs: { id: string; content: string }[];
}

export const dispatchCodexInsert = (detail: CodexInsertDetail) => {
  window.dispatchEvent(new CustomEvent<CodexInsertDetail>(CODEX_INSERT_EVENT, { detail }));
};
