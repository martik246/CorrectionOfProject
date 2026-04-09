const STORAGE_KEY = 'foodJournalTracker.webdb.v1';
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

let cache = null;

const createInitialState = () => ({
  meta: {
    userVersion: 1,
    nextUserId: 1,
    nextJournalId: 1,
  },
  users: [],
  journals: [],
});

const clone = (value) => JSON.parse(JSON.stringify(value));

const loadState = () => {
  if (cache) {
    return cache;
  }

  try {
    const raw = globalThis.localStorage?.getItem(STORAGE_KEY);
    cache = raw ? JSON.parse(raw) : createInitialState();
  } catch (error) {
    console.error('Web database load error:', error);
    cache = createInitialState();
  }

  return cache;
};

const persistState = () => {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Web database persist error:', error);
  }
};

const initDatabase = async () => {
  const state = loadState();

  if (!state.meta) {
    state.meta = createInitialState().meta;
  }

  if (!state.users.some((user) => user.email === DEMO_USER.email)) {
    state.users.push({
      id: state.meta.nextUserId,
      email: DEMO_USER.email,
      password: DEMO_USER.password,
      createdAt: new Date().toISOString(),
    });
    state.meta.nextUserId += 1;
    persistState();
  }

  const demoUser = state.users.find((user) => user.email === DEMO_USER.email);
  const hasDemoJournals = state.journals.some((entry) => entry.userId === demoUser.id);

  if (!hasDemoJournals) {
    for (const entry of DEMO_JOURNALS) {
      state.journals.push({
        id: state.meta.nextJournalId,
        userId: demoUser.id,
        image: entry.image,
        description: entry.description,
        date: entry.date,
        mealCategory: entry.mealCategory,
        mood: entry.mood,
      });
      state.meta.nextJournalId += 1;
    }
    persistState();
  }

  return state;
};

const getDatabase = async () => initDatabase();

const getFirst = async (query, ...params) => {
  const normalizedQuery = query.trim();
  const state = await getDatabase();

  if (normalizedQuery === 'SELECT id, email FROM users WHERE email = ? AND password = ?') {
    const [email, password] = params;
    return state.users.find((user) => user.email === email && user.password === password) ?? null;
  }

  if (normalizedQuery === 'SELECT id FROM users WHERE email = ?') {
    const [email] = params;
    const user = state.users.find((item) => item.email === email);
    return user ? { id: user.id } : null;
  }

  throw new Error(`Unsupported web query in getFirst: ${normalizedQuery}`);
};

const getAll = async (query, ...params) => {
  const normalizedQuery = query.trim();
  const state = await getDatabase();

  if (
    normalizedQuery ===
    'SELECT id, userId, image, description, date, mealCategory, mood FROM journals WHERE userId = ? ORDER BY date DESC'
  ) {
    const [userId] = params;
    return clone(
      state.journals
        .filter((entry) => entry.userId === userId)
        .sort((left, right) => right.date.localeCompare(left.date))
    );
  }

  throw new Error(`Unsupported web query in getAll: ${normalizedQuery}`);
};

const run = async (query, ...params) => {
  const normalizedQuery = query.trim();
  const state = await getDatabase();

  if (normalizedQuery === 'INSERT INTO users (email, password, createdAt) VALUES (?, ?, ?)') {
    const [email, password, createdAt] = params;
    const newUser = {
      id: state.meta.nextUserId,
      email,
      password,
      createdAt,
    };
    state.meta.nextUserId += 1;
    state.users.push(newUser);
    persistState();
    return { lastInsertRowId: newUser.id, changes: 1 };
  }

  if (
    normalizedQuery ===
    'INSERT INTO journals (userId, image, description, date, mealCategory, mood) VALUES (?, ?, ?, ?, ?, ?)'
  ) {
    const [userId, image, description, date, mealCategory, mood] = params;
    const newJournal = {
      id: state.meta.nextJournalId,
      userId,
      image,
      description,
      date,
      mealCategory,
      mood,
    };
    state.meta.nextJournalId += 1;
    state.journals.push(newJournal);
    persistState();
    return { lastInsertRowId: newJournal.id, changes: 1 };
  }

  if (
    normalizedQuery ===
    'UPDATE journals SET image = ?, description = ?, mealCategory = ?, mood = ? WHERE id = ?'
  ) {
    const [image, description, mealCategory, mood, id] = params;
    const journal = state.journals.find((item) => item.id === id);

    if (!journal) {
      return { changes: 0 };
    }

    journal.image = image;
    journal.description = description;
    journal.mealCategory = mealCategory;
    journal.mood = mood;
    persistState();
    return { changes: 1 };
  }

  if (normalizedQuery === 'DELETE FROM journals WHERE id = ?') {
    const [id] = params;
    const originalLength = state.journals.length;
    state.journals = state.journals.filter((item) => item.id !== id);
    persistState();
    return { changes: originalLength - state.journals.length };
  }

  throw new Error(`Unsupported web query in run: ${normalizedQuery}`);
};

const resetDatabaseConnection = () => {
  cache = null;
};

export { getAll, getDatabase, getFirst, initDatabase, resetDatabaseConnection, run };
