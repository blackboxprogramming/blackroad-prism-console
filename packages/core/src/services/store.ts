import { nanoid } from "nanoid";
import type {
  AccountApp,
  Business,
  Client,
  Document,
  Gate,
  Person,
  Screening,
  Wallet,
} from "@blackroad/db";

export class InMemoryStore {
  clients = new Map<string, Client>();
  persons = new Map<string, Person>();
  businesses = new Map<string, Business>();
  accountApps = new Map<string, AccountApp>();
  documents = new Map<string, Document>();
  screenings = new Map<string, Screening>();
  wallets = new Map<string, Wallet>();
  gates = new Map<string, Gate>();

  createClient(data: Omit<Client, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Client {
    const id = data.id ?? nanoid();
    const createdAt = data.createdAt ?? new Date();
    const client: Client = { ...data, id, createdAt };
    this.clients.set(id, client);
    return client;
  }

  updateClient(id: string, update: Partial<Client>): Client {
    const client = this.requireClient(id);
    const next = { ...client, ...update } as Client;
    this.clients.set(id, next);
    return next;
  }

  createPerson(data: Omit<Person, "id"> & { id?: string }): Person {
    const id = data.id ?? nanoid();
    const person: Person = { ...data, id };
    this.persons.set(id, person);
    return person;
  }

  updatePerson(id: string, update: Partial<Person>): Person {
    const person = this.requirePerson(id);
    const next = { ...person, ...update } as Person;
    this.persons.set(id, next);
    return next;
  }

  createBusiness(data: Omit<Business, "id"> & { id?: string }): Business {
    const id = data.id ?? nanoid();
    const business: Business = { ...data, id };
    this.businesses.set(id, business);
    return business;
  }

  createAccountApp(data: Omit<AccountApp, "id"> & { id?: string }): AccountApp {
    const id = data.id ?? nanoid();
    const accountApp: AccountApp = { ...data, id };
    this.accountApps.set(id, accountApp);
    return accountApp;
  }

  updateAccountApp(id: string, update: Partial<AccountApp>): AccountApp {
    const current = this.requireAccountApp(id);
    const next = { ...current, ...update } as AccountApp;
    this.accountApps.set(id, next);
    return next;
  }

  createDocument(data: Omit<Document, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Document {
    const id = data.id ?? nanoid();
    const createdAt = data.createdAt ?? new Date();
    const document: Document = { ...data, id, createdAt };
    this.documents.set(id, document);
    return document;
  }

  createScreening(data: Omit<Screening, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Screening {
    const id = data.id ?? nanoid();
    const createdAt = data.createdAt ?? new Date();
    const screening: Screening = { ...data, id, createdAt };
    this.screenings.set(id, screening);
    return screening;
  }

  updateScreening(id: string, update: Partial<Screening>): Screening {
    const current = this.requireScreening(id);
    const next = { ...current, ...update } as Screening;
    this.screenings.set(id, next);
    return next;
  }

  createWallet(data: Omit<Wallet, "id"> & { id?: string }): Wallet {
    const id = data.id ?? nanoid();
    const wallet: Wallet = { ...data, id };
    this.wallets.set(id, wallet);
    return wallet;
  }

  updateWallet(id: string, update: Partial<Wallet>): Wallet {
    const current = this.requireWallet(id);
    const next = { ...current, ...update } as Wallet;
    this.wallets.set(id, next);
    return next;
  }

  createGate(data: Omit<Gate, "id" | "createdAt"> & { id?: string; createdAt?: Date }): Gate {
    const id = data.id ?? nanoid();
    const createdAt = data.createdAt ?? new Date();
    const gate: Gate = { ...data, id, createdAt };
    this.gates.set(`${gate.clientId}:${gate.action}`, gate);
    return gate;
  }

  requireClient(id: string): Client {
    const client = this.clients.get(id);
    if (!client) throw new Error(`Client ${id} not found`);
    return client;
  }

  requirePerson(id: string): Person {
    const person = this.persons.get(id);
    if (!person) throw new Error(`Person ${id} not found`);
    return person;
  }

  requireAccountApp(id: string): AccountApp {
    const accountApp = this.accountApps.get(id);
    if (!accountApp) throw new Error(`AccountApp ${id} not found`);
    return accountApp;
  }

  requireWallet(id: string): Wallet {
    const wallet = this.wallets.get(id);
    if (!wallet) throw new Error(`Wallet ${id} not found`);
    return wallet;
  }

  requireScreening(id: string): Screening {
    const screening = this.screenings.get(id);
    if (!screening) throw new Error(`Screening ${id} not found`);
    return screening;
  }

  listClientPersons(clientId: string): Person[] {
    return [...this.persons.values()].filter((person) => person.clientId === clientId);
  }

  listClientWallets(clientId: string): Wallet[] {
    return [...this.wallets.values()].filter((wallet) => wallet.clientId === clientId);
  }

  listClientDocuments(clientId: string): Document[] {
    return [...this.documents.values()].filter((document) => document.clientId === clientId);
  }

  listAccountAppDocuments(accountAppId: string): Document[] {
    return [...this.documents.values()].filter((document) => document.accountAppId === accountAppId);
  }

  listClientScreenings(clientId: string): Screening[] {
    return [...this.screenings.values()].filter((screening) => screening.clientId === clientId);
  }

  getGate(clientId: string, action: string): Gate | undefined {
    return this.gates.get(`${clientId}:${action}`);
  }
}
