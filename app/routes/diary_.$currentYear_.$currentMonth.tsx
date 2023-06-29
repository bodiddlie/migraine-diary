import {
  LoaderArgs,
  LoaderFunction,
  redirect,
  V2_MetaFunction,
} from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { authenticator } from '~/services/auth.server';
import { getEntriesForUserBetweenDates } from '~/utils/db.server';
import { Entry } from '.prisma/client';
import { addDays, addMonths, format, getDate, getDay, parse } from 'date-fns';

type MonthView = {
  month: string;
  numMonth: string;
  entries: DisplayEntry[];
};

type DisplayEntry = {
  id: string;
  date: string;
  displayDate: string;
  painLevel: number;
  hasNotes: boolean;
};

export const meta: V2_MetaFunction = () => {
  return [{ title: 'Migraine Diary' }];
};

export default function Month() {
  const data = useLoaderData();
  const start = parse(data.start, 'yyyy-MM-dd', new Date());
  const prev = addMonths(start, -1);
  console.log(data.start);
  const next = addMonths(start, 1);
  const startDay = getDate(start);
  let day = startDay - getDay(start);
  const entries = [...data.entries];
  while (day <= 0) {
    entries.unshift({
      id: day,
      date: null,
      displayDate: '',
      painLevel: 0,
      hasNotes: false,
    });
    day++;
  }

  return (
    <div className="flex h-full w-full flex-1 flex-col bg-pink-600">
      <nav>
        <Link to={`/diary/${prev.getFullYear()}/${prev.getMonth() + 1}`}>
          Previous
        </Link>
        {format(start, 'MMMM yyyy')}
        <Link to={`/diary/${next.getFullYear()}/${next.getMonth() + 1}`}>
          Next
        </Link>
      </nav>
      <section className="grid flex-1 grid-cols-7 grid-rows-[50px_repeat(6,minmax(0,1fr))] gap-1">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
        {entries.map((e) => (
          <Day key={e.id} day={e} />
        ))}
      </section>
    </div>
  );
}

function Day({ day }: { day: DisplayEntry }) {
  if (!day.date) {
    return <div className="bg-amber-300"></div>;
  }

  const date = parse(day.date, 'yyyy-MM-dd', new Date());

  return (
    <Link
      to={`/diary/${format(date, 'yyyy')}/${format(date, 'MM')}/${format(
        date,
        'dd',
      )}`}
      className="bg-amber-300"
    >
      <div>{day.displayDate}</div>
      <div>{day.hasNotes ? 'Has Notes' : 'No Notes'}</div>
    </Link>
  );
}

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderArgs) => {
  let user = await authenticator.isAuthenticated(request);
  if (!user) {
    return redirect('/');
  }

  if (!params.currentYear || !params.currentMonth) {
    return redirect('/diary');
  }

  const year = parseInt(params.currentYear);
  const month = parseInt(params.currentMonth);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const foundEntries = await getEntriesForUserBetweenDates(
    user.email,
    start,
    end,
  );

  const entries = buildMonth(foundEntries, start, end);
  return { start: format(start, 'yyyy-MM-dd'), entries: entries.entries };
};

function buildMonth(entries: Entry[], start: Date, end: Date): MonthView {
  let current = new Date(start);
  const view: MonthView = {
    month: format(start, 'MMMM'),
    numMonth: format(start, 'MM'),
    entries: [],
  };

  while (current < end) {
    const entry = entries.find(
      (e) => format(e.date, 'yyyy-MM-dd') === format(current, 'yyyy-MM-dd'),
    );
    const month = current.getMonth();
    if (entry) {
      view.entries.push({
        id: entry.id,
        date: format(current, 'yyyy-MM-dd'),
        displayDate: format(current, 'd'),
        painLevel: entry.painLevel,
        hasNotes: !!entry.notes,
      });
    } else {
      view.entries.push({
        id: format(current, 'yyyy-MM-dd'),
        date: format(current, 'yyyy-MM-dd'),
        displayDate: format(current, 'd'),
        painLevel: 0,
        hasNotes: false,
      });
    }
    current = addDays(current, 1);
  }

  return view;
}
