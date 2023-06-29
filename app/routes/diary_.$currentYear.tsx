import { LoaderArgs, redirect, V2_MetaFunction } from '@remix-run/node';
import { useLoaderData, Link } from '@remix-run/react';
import { Entry } from '.prisma/client';
import { authenticator } from '~/services/auth.server';
import { db, getEntriesForUserBetweenDates } from '~/utils/db.server';
import { addDays, format, getDate, getDay, parse } from 'date-fns';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'Migraine Diary' }];
};

type DisplayEntry = {
  id: string;
  date: string;
  displayDate: string;
  painLevel: number;
  hasNotes: boolean;
};

type MonthView = {
  month: string;
  numMonth: string;
  entries: DisplayEntry[];
};

export default function YearView() {
  const data = useLoaderData();
  return (
    <div className="flex h-full w-full flex-1 flex-col p-2 text-black">
      <h1 className="text-center">{data.year}</h1>
      <section className="grid flex-1 grid-cols-3 grid-rows-4 gap-2">
        {data.entries.map((month) => (
          <Link to={`/diary/${data.year}/${month.numMonth}`} key={month.month}>
            <MonthDisplay month={month} />
          </Link>
        ))}
      </section>
    </div>
  );
}

function MonthDisplay({ month }: { MonthView }) {
  const start = getDate(parse(month.entries[0].date, 'yyyy-MM-dd', new Date()));
  console.log(start);
  let day =
    start - getDay(parse(month.entries[0].date, 'yyyy-MM-dd', new Date()));
  while (day <= 0) {
    month.entries.unshift({
      id: day,
      date: null,
      displayDate: '',
      painLevel: 0,
      hasNotes: false,
    });
    day++;
  }

  return (
    <div className="flex h-full flex-col">
      <h2 className="text-center">{month.month}</h2>
      <section className="grid flex-1 grid-cols-7 grid-rows-[repeat(6,minmax(0,1fr))] gap-0.5">
        {month.entries.map((e) => (
          <div key={e.id} className="text-center text-xs">
            {e.displayDate}
          </div>
        ))}
      </section>
    </div>
  );
}

export async function loader({ params, request }: LoaderArgs) {
  let user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect('/');
  }

  const year = params.currentYear
    ? parseInt(params.currentYear)
    : new Date().getFullYear();
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const foundEntries = await getEntriesForUserBetweenDates(
    user.email,
    start,
    end,
  );
  const entries = buildCalendar(foundEntries, start, end);

  return { year, entries };
}

function buildCalendar(entries: Entry[], start: Date, end: Date): MonthView[] {
  let current = new Date(start);
  const months: MonthView[] = [];
  while (current < end) {
    const entry = entries.find(
      (e) => format(e.date, 'yyyy-MM-dd') === format(current, 'yyyy-MM-dd'),
    );
    const month = current.getMonth();
    if (!months[month]) {
      months[month] = {
        month: format(current, 'MMMM'),
        numMonth: format(current, 'MM'),
        entries: [],
      };
    }
    if (entry) {
      months[month].entries.push({
        id: entry.id,
        date: format(current, 'yyyy-MM-dd'),
        displayDate: format(current, 'd'),
        painLevel: entry.painLevel,
        hasNotes: !!entry.notes,
      });
    } else {
      months[month].entries.push({
        id: format(current, 'yyyy-MM-dd'),
        date: format(current, 'yyyy-MM-dd'),
        displayDate: format(current, 'd'),
        painLevel: 0,
        hasNotes: false,
      });
    }
    current = addDays(current, 1);
  }

  return months;
}
