import { login_credential } from "@/constants/credentialId";
import { envConfig } from "@/helpers/config/envConfig";
import { jwtHelpers } from "@/helpers/jwthelpers/jwthelpers";
import { CallbacksOptions, NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { Provider } from "next-auth/providers/index";

const dummyCredentials = {
  name: "dummyUser",
  email: "email@email.com",
  password: "password",
};

const providers: Provider[] = [
  CredentialsProvider({
    id: login_credential,
    name: "Credentials",
    type: "credentials",
    credentials: {},
    authorize: async (credentials: any) => {
      try {
        const { email, password } = credentials;
        

        if (!email || !password) {
          throw new Error("please enter email or password");
        }

        // check email and password with dummyCreadential
        if (email !== dummyCredentials.email || password !== dummyCredentials.password) {
          throw new Error("email or password is incorrect");
        }

        const accessToken = jwtHelpers.createToken({ userId: 1, email: email }, envConfig.jwt.secret, "1d");

        // If no error and we have user data, return it
        if (accessToken) {
          return {
            id: 1,
            accessToken,
            user: {
              userId: 1,
              name: dummyCredentials.name,
              email: email,
            },
          } as any;
        }

        throw new Error("Something went wrong");
      } catch (error: any) {
        throw new Error(error?.message || "Something went wrong");
      }
    },
  }),
];

const callbacks: Partial<CallbacksOptions> = {
  jwt: async ({ token, user }: any) => {
    if (user) {
      token.user = user?.user;
      token.accessToken = user?.accessToken;
    }
    return Promise.resolve(token);
  },
  redirect: async ({ url }) => {
    let baseUrl = envConfig.siteUrl;
    // Allows relative callback URLs
    if (url.startsWith("/")) return `${baseUrl}${url}`;
    // Allows callback URLs on the same origin
    else if (new URL(url).origin === baseUrl) return url;
    return baseUrl;
  },
  session: async ({ session, token }: any) => {
    // Here we pass accessToken to the client to be used in authentication according to the API
    session.accessToken = token?.accessToken;
    session.user = token?.user;
    session.error = token?.error;

    return Promise.resolve(session);
  },
};

export const auth_options: NextAuthOptions = {
  providers,
  callbacks,
  pages: { signIn: "/login", signOut: "*", error: "/" },
  secret: envConfig.jwt.secret,
  jwt: { maxAge: 60 * 60 * 24 * 1 }, //default
};
