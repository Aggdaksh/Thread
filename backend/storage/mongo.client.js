'use strict';

/**
 * Central MongoDB connection for the process. All stores that need MongoDB MUST use
 * this client (getDb) so a single MongoClient is reused. Index creation stays in
 * each store; this module only exposes connection lifecycle.
 *
 * Env: DB_URI (required, validated at startup), DB_NAME default 'mychat'.
 * Optional: MONGO_NETWORK_FAMILY=4|6, MONGO_SERVER_SELECTION_TIMEOUT_MS,
 * MONGO_CONNECT_TIMEOUT_MS.
 */

const { MongoClient } = require('mongodb');

let client = null;
let db = null;

function readPositiveInt(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function getMongoClientOptions() {
  const options = {
    serverSelectionTimeoutMS: readPositiveInt('MONGO_SERVER_SELECTION_TIMEOUT_MS', 30000),
    connectTimeoutMS: readPositiveInt('MONGO_CONNECT_TIMEOUT_MS', 20000),
  };
  const family = Number(process.env.MONGO_NETWORK_FAMILY || 4);
  if (family === 4 || family === 6) {
    options.family = family;
  }
  return options;
}

async function getDb() {
  if (db) return db;
  const uri = process.env.DB_URI;
  const name = process.env.DB_NAME || 'mychat';
  if (!uri || typeof uri !== 'string' || !uri.trim()) {
    throw new Error('DB_URI is required for MongoDB');
  }
  client = new MongoClient(uri.trim(), getMongoClientOptions());
  await client.connect();
  db = client.db(name);
  return db;
}

async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

module.exports = {
  getDb,
  closeDb,
};
