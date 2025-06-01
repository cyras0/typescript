import { client } from "@/sanity/lib/client";
import { writeClient } from "@/sanity/lib/write-client";
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { AUTHOR_BY_GITHUB_ID_QUERY } from "@/sanity/lib/queries";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    GitHub({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
    }),
  ],
  callbacks: {
    async signIn({ 
      user: {name, email, image},
      profile,
    }) {
      const githubProfile = profile as { id: string; login: string; bio?: string };
      const existingUser = await client.withConfig({ useCdn: false }).fetch(AUTHOR_BY_GITHUB_ID_QUERY, {
        id: githubProfile.id,
      });
      if (!existingUser) {
        await writeClient.create({
          _type: "author",
          id: githubProfile.id,
          name,
          username: githubProfile.login,
          image,
          email,
          bio: githubProfile.bio || "",
        });
      }
      return true;
    },

    async jwt({ token, account, profile }) {
      if (account && profile) {
        const user = await client.withConfig({ useCdn: false }).fetch(AUTHOR_BY_GITHUB_ID_QUERY, { id: profile?.id });
        token.id = user?._id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) {
        Object.assign(session.user, {
          id: token.id,
        });
      }
      return session;
    }
  },
  
  session: {
    strategy: "jwt",
  },
  
  secret: process.env.NEXTAUTH_SECRET,
  
  debug: process.env.NODE_ENV === "development",
});