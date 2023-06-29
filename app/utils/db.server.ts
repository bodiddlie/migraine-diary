import { PrismaClient } from '@prisma/client';

let db: PrismaClient;

declare global {
  var __db__: PrismaClient | undefined;
}

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// In production, we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
  db = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  db = global.__db__;
  db.$connect();
}

export { db };

export async function getEntriesForUserBetweenDates(
  email: string,
  start: Date,
  end: Date,
) {
  const entries = await db.entry.findMany({
    where: {
      AND: [
        {
          date: {
            gte: start,
          },
        },
        {
          date: {
            lt: end,
          },
        },
        {
          userEmail: {
            equals: email,
          },
        },
      ],
    },
  });

  return entries;
}

export async function getEntryByDate(email: string, date: Date) {
  const entry = await db.entry.findFirst({
    where: {
      AND: [
        {
          date: {
            equals: date,
          },
        },
        {
          userEmail: {
            equals: email,
          },
        },
      ],
    },
  });

  return entry;
}

export async function upsertEntry(
  id: string | null,
  email: string,
  date: Date,
  painLevel: number,
  notes: string,
) {
  if (id) {
    return db.entry.update({
      where: {
        id,
      },
      data: {
        date,
        painLevel,
        notes,
      },
    });
  } else {
    return db.entry.create({
      data: {
        date,
        painLevel,
        notes,
        userEmail: email,
      },
    });
  }
}
