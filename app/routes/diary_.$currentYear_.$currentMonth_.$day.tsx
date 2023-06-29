import type {
  ActionFunction,
  LoaderArgs,
  LoaderFunction,
} from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { authenticator } from '~/services/auth.server';
import { useLoaderData, Form } from '@remix-run/react';
import type { Params } from '@remix-run/react';
import { upsertEntry, getEntryByDate } from '~/utils/db.server';
import type { Prisma } from '@prisma/client';

type FoundEntry = Prisma.PromiseReturnType<typeof getEntryByDate>;

type UserAndDate = {
  email: string;
  date: Date;
};

async function getUserAndDate(
  request: Request,
  params: Params,
): Promise<UserAndDate> {
  let user = await authenticator.isAuthenticated(request);
  if (!user) {
    throw redirect('/');
  }

  if (!params.currentYear || !params.currentMonth || !params.day) {
    throw redirect('/diary');
  }

  const year = parseInt(params.currentYear);
  const month = parseInt(params.currentMonth);
  const day = parseInt(params.day);
  const date = new Date(year, month - 1, day);

  return { email: user.email, date };
}

export const loader: LoaderFunction = async ({
  params,
  request,
}: LoaderArgs) => {
  const { email, date } = await getUserAndDate(request, params);

  const entry: FoundEntry = await getEntryByDate(email, date);

  return {
    id: entry ? entry.id : null,
    day: params.day,
    painLevel: entry ? entry.painLevel : 0,
    notes: entry ? entry.notes : '',
  };
};

export default function Entry() {
  const data = useLoaderData();

  return (
    <div>
      <Form method="post" className="text-black">
        <div>
          <label htmlFor="painLevel">Pain Level</label>
          <input type="number" name="painLevel" defaultValue={data.painLevel} />
        </div>
        <div>
          <label htmlFor="notes">Notes</label>
          <textarea name="notes" defaultValue={data.notes} />
        </div>
        <input type="hidden" defaultValue={data.id} name="id" />
        <div>
          <input type="submit" value="Submit" />
        </div>
      </Form>
    </div>
  );
}

export const action: ActionFunction = async ({ request, params }) => {
  const { email, date } = await getUserAndDate(request, params);

  const formData = await request.formData();
  const id = formData.get('id') as string;
  const painLevel = parseInt(formData.get('painLevel') as string);
  const notes = formData.get('notes') as string;

  await upsertEntry(id, email, date, painLevel, notes);
  return redirect('/diary');
};
