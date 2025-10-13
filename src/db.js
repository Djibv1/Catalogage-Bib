// src/db.js
import { openDB } from "idb";

const DB_NAME = "biblioDB";
const STORE_NAME = "books";
const VERSION = 1;

// Ouvre (ou crée) la base de données
async function getDB() {
  return openDB(DB_NAME, VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "ean" });
      }
    },
  });
}

export async function addBook(book) {
  const db = await getDB();
  await db.put(STORE_NAME, book);
}

export async function getBooks() {
  const db = await getDB();
  return await db.getAll(STORE_NAME);
}

export async function updateBook(ean, data) {
  const db = await getDB();
  const existing = await db.get(STORE_NAME, ean);
  if (!existing) return;
  const updated = { ...existing, ...data };
  await db.put(STORE_NAME, updated);
}

export async function deleteBook(ean) {
  const db = await getDB();
  await db.delete(STORE_NAME, ean);
}
