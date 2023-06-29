import type {LinksFunction, LoaderFunction} from "@remix-run/node";
import {
  Form,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration, useLoaderData,
} from "@remix-run/react";

import styles from './tailwind.css';
import {authenticator} from "~/services/auth.server";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
];

export const loader: LoaderFunction = async ({request}) => {
  let user = await authenticator.isAuthenticated(request);
  return {user};
}
export default function App() {
  const data = useLoaderData();
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-screen bg-gradient-to-b from-blue-900 to-indigo-500 text-gray-50">
      <div className="flex flex-col min-h-screen">
      {data.user ? (
        <Form method="POST" action="/logout" className="flex flex-row justify-between p-2">
          <div>Hi {data.user.displayName}</div>
          <button>Sign out</button>
        </Form>
      ): null}
        <Outlet />
      </div>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
