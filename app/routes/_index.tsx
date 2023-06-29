import type {LoaderFunction, V2_MetaFunction} from "@remix-run/node";
import {Form} from "@remix-run/react";
import {authenticator} from "~/services/auth.server";
import {redirect} from "@remix-run/node";

export const meta: V2_MetaFunction = () => {
  return [{ title: "Migraine Diary" }];
};

export const loader: LoaderFunction = async ({request}) => {
  let user = await authenticator.isAuthenticated(request);
  if (user) {
    return redirect('/diary');
  }
  return {};
}

export default function Index() {
  return (
      <Form method="POST" action="/auth/google" className="flex flex-col justify-center w-full flex-1">
        <div className="px-4 text-center">
          <h1 className="text-5xl font-bold mt-5 text-center text-sky-400 mb-3">
            Migraine Diary
          </h1>
          <button
            className="rounded-full bg-indigo-300 p-2 hover:bg-indigo-400 transition-colors duration-500 text-neutral-800"
          >
            Sign In / Register
          </button>
        </div>
        <section className="px-4 py-8 text-sky-200">
          <h2 className="text-3xl font-bold">Tracking Helps Treatment</h2>
          <p className="mt-3">
            Welcome to Migraine Diary, the ultimate app for tracking your
            migraines. With Migraine Diary, you can easily track your migraines
            day-to-day, log your pain levels, as well as any other symptoms you
            experience, such as nausea or sensitivity to light. This information
            can then be shared with your doctor, helping them to understand your
            condition better, and make more informed treatment decisions.
          </p>
          <p className="mt-3">
            With Migraine Diary, you'll be able to see at a glance how your
            migraines are affecting your life. You can view your pain levels
            over time, and track your progress as you try different treatments
            and lifestyle changes. And when it comes time to see your doctor,
            you'll have all the information you need to have an informed
            conversation about your condition.
          </p>
          <p className="mt-3">
            Don't let migraines control your life.{' '}
            <button
              className="underline hover:cursor-pointer"
            >
              Sign up
            </button>{' '}
            for Migraine Diary today, and start taking control of your pain.
          </p>
        </section>
      </Form>
  );
}
