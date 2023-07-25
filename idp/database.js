const { MongoClient } = require('mongodb');

const database = {
  db: null,
  connect: async () => {
    const url = process.env.MONGO_URL;
    const dbName = process.env.MONGO_DATABASE;
    const client = new MongoClient(url);
    await client.connect();
    database.db = client.db(dbName);
    return database.db;
  },
  collection: async (name) => {
    const db = database.db || await database.connect();
    return db && db.collection(name);
  }
};

module.exports = database;
