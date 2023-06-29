import { Authenticator } from "remix-auth";
import { sessionStorage } from "~/services/session.server";
import { GoogleStrategy } from "remix-auth-google";
import { db } from "~/utils/db.server";

// Create an instance of the authenticator, pass a generic with what
// strategies will return and will store in the session
export let authenticator = new Authenticator<User>(sessionStorage);

let googleStrategy = new GoogleStrategy(
  {
    clientID: process.env.GOOGLE_ID,
    clientSecret: process.env.GOOGLE_SECRET,
    callbackURL: "http://localhost:3000/auth/google/callback",
  },
  async ({accessToken, refreshToken, extraParams, profile}) => {
    // Get the user data from your DB or API using the tokens and profile
    // return User.findOrCreate({ email: profile.emails[0].value });
    let user = await db.user.upsert({
      where: { email: profile.emails[0].value },
      create: {
        email: profile.emails[0].value,
        displayName: profile.displayName,
      },
      update: {}
    });
    return user;
  }
);

authenticator.use(googleStrategy);