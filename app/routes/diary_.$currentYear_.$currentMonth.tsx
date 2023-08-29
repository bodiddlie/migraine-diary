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
import {
  addDays,
  addMonths,
  format,
  getDate,
  getDay,
  isToday,
  parse,
} from 'date-fns';
import classnames from 'classnames';
import { FaRegStickyNote } from 'react-icons/fa';
import { VscBlank } from 'react-icons/vsc';

type MonthView = {
  month: string;
  numMonth: string;
  entries: DisplayEntry[];
};

type DisplayEntry = {
  id: string;
  date: string;
  displayDate: string;
  painLevel?: number;
  hasNotes: boolean;
};

export const meta: V2_MetaFunction = () => {
  return [{ title: 'Migraine Diary' }];
};

export default function Month() {
  const data = useLoaderData();
  const start = parse(data.start, 'yyyy-MM-dd', new Date());
  const prev = addMonths(start, -1);
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
    <div className="flex h-full w-full flex-1 flex-col text-black">
      <nav className="flex w-full justify-between px-1 text-white">
        <Link to={`/diary/${prev.getFullYear()}/${prev.getMonth() + 1}`}>
          &larr;
        </Link>
        <span>{format(start, 'MMMM yyyy')}</span>
        <Link to={`/diary/${next.getFullYear()}/${next.getMonth() + 1}`}>
          &rarr;
        </Link>
      </nav>
      <section className="grid flex-1 grid-cols-7 grid-rows-[50px_repeat(6,minmax(0,1fr))] gap-1 text-center">
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
    return <div className=""></div>;
  }

  const date = parse(day.date, 'yyyy-MM-dd', new Date());

  const today = isToday(date);
  const dayClasses = classnames({
    flex: true,
    'flex-col': true,
    'justify-start': true,
    'items-center': true,
    'text-center': true,
  });

  const highlightClasses = classnames({
    'bg-green-500': day.painLevel === 0,
    'bg-yellow-500': day.painLevel === 1,
    'bg-red-500': day.painLevel === 2,
    'border-black': !today,
    'border-white': today,
    border: true,
    'rounded-full': true,
    'w-10': true,
    'h-10': true,
    'text-center': true,
    flex: true,
    'justify-center': true,
    'items-center': true,
    'self-center': true,
    'mb-1': true,
  });

  return (
    <Link
      to={`/diary/${format(date, 'yyyy')}/${format(date, 'MM')}/${format(
        date,
        'dd',
      )}`}
      className={dayClasses}
    >
      <div className={highlightClasses}>{day.displayDate}</div>
      <div className="text-2xl">
        {day.hasNotes ? <FaRegStickyNote /> : <VscBlank />}
      </div>
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
        painLevel: undefined,
        hasNotes: false,
      });
    }
    current = addDays(current, 1);
  }

  return view;
}
