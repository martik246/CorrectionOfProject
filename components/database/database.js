import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'FoodJournal.db';
const DATABASE_VERSION = 1;
const DEMO_USER = {
  email: 'demo@example.com',
  password: 'demo123',
};
const DEMO_JOURNALS = [
  {
    image: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=1200&q=80',
    description: 'Greek yogurt bowl with berries, banana, and chia seeds before work.',
    date: '2026-04-07T08:15:00.000Z',
    mealCategory: 'Breakfast',
    mood: 'Focused',
  },
  {
    image: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=80',
    description: 'Chicken salad with avocado and quinoa. Light lunch and good energy.',
    date: '2026-04-07T13:05:00.000Z',
    mealCategory: 'Lunch',
    mood: 'Happy',
  },
  {
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
    description: 'Salmon, rice, and steamed vegetables after training.',
    date: '2026-04-08T18:40:00.000Z',
    mealCategory: 'Dinner',
    mood: 'Cheerful',
  },
  {
    image: 'https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80',
    description: 'Apple slices with peanut butter as an afternoon snack.',
    date: '2026-04-09T15:20:00.000Z',
    mealCategory: 'Snack',
    mood: 'Neutral',
  },
];

let dbPromise;

const applyMigrations = async (database) => {
  const versionRow = await database.getFirstAsync('PRAGMA user_version;');
  const currentVersion = Number(versionRow?.user_version ?? 0);

  if (currentVersion >= DATABASE_VERSION) {
    return database;
  }

  await database.withExclusiveTransactionAsync(async (tx) => {
    if (currentVersion < 1) {
      await tx.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL,
          createdAt TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS journals (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          image TEXT NOT NULL,
          description TEXT NOT NULL,
          date TEXT NOT NULL,
          mealCategory TEXT NOT NULL,
          mood TEXT,
          FOREIGN KEY(userId) REFERENCES users(id) ON DELETE CASCADE
        );
      `);
    }

    await tx.execAsync(`PRAGMA user_version = ${DATABASE_VERSION};`);
  });

  return database;
};

const ensureDemoUser = async (database) => {
  const existingUser = await database.getFirstAsync('SELECT id FROM users WHERE email = ?', DEMO_USER.email);

  if (!existingUser) {
    const result = await database.runAsync(
      'INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)',
      DEMO_USER.email,
      DEMO_USER.password,
      new Date().toISOString()
    );
    return result.lastInsertRowId;
  }

  return existingUser.id;
};

const ensureDemoJournals = async (database, userId) => {
  const existingJournal = await database.getFirstAsync(
    'SELECT id FROM journals WHERE userId = ? LIMIT 1',
    userId
  );

  if (existingJournal) {
    return;
  }

  for (const entry of DEMO_JOURNALS) {
    await database.runAsync(
      'INSERT INTO journals (userId, image, description, date, mealCategory, mood) VALUES (?, ?, ?, ?, ?, ?)',
      userId,
      entry.image,
      entry.description,
      entry.date,
      entry.mealCategory,
      entry.mood
    );
  }
};

const initDatabase = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const database = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await database.execAsync('PRAGMA journal_mode = WAL;');
      await database.execAsync('PRAGMA foreign_keys = ON;');
      await applyMigrations(database);
      const demoUserId = await ensureDemoUser(database);
      await ensureDemoJournals(database, demoUserId);
      return database;
    })().catch((error) => {
      dbPromise = null;
      throw error;
    });
  }

  return dbPromise;
};

const getDatabase = async () => initDatabase();

const run = async (query, ...params) => {
  const database = await getDatabase();
  return database.runAsync(query, ...params);
};

const getFirst = async (query, ...params) => {
  const database = await getDatabase();
  return database.getFirstAsync(query, ...params);
};

const getAll = async (query, ...params) => {
  const database = await getDatabase();
  return database.getAllAsync(query, ...params);
};

const resetDatabaseConnection = () => {
  dbPromise = null;
};

export { getAll, getDatabase, getFirst, initDatabase, resetDatabaseConnection, run };
