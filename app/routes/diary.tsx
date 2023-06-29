import { LoaderFunction, redirect, V2_MetaFunction } from '@remix-run/node';

export const meta: V2_MetaFunction = () => {
  return [{ title: 'Migraine Diary' }];
};

export const loader: LoaderFunction = async ({ request }) => {
  const today = new Date();
  const month = ('' + (today.getMonth() + 1)).padStart(2, '0');
  return redirect(`/diary/${today.getFullYear()}/${month}`);
};

export default function Diary() {
  return (
    <div>
      <h1>Diary page</h1>
    </div>
  );
}
