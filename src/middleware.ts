import { withAuth } from "next-auth/middleware";

// Protect dashboard routes; redirect unauthenticated users to /login
export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: ["/dashboard/:path*"],
};

