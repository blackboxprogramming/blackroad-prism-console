export interface Contradiction {
  node: string;
  code: string;
  detail?: string;
}

export class ContradictionLog {
  private list: Contradiction[] = [];
  log(c: Contradiction) {
    this.list.push(c);
  }
  all() {
    return [...this.list];
  }
  clear() {
    this.list.length = 0;
  }
}
