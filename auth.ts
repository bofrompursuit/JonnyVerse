import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Free, zero-database sign-in: Google OAuth + JWT sessions (no adapter,
// no new hosted service beyond the free Google Cloud OAuth client).
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
});
