import { FastifyInstance } from "fastify";
import fastifyOauth2 from "@fastify/oauth2";
import { authService } from "../services/auth.service";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

interface GoogleUserinfo {
  sub: string;
  email: string;
  name: string;
}

interface FacebookUserinfo {
  id: string;
  email: string;
  name: string;
}

function redirectWithResult(
  reply: import("fastify").FastifyReply,
  result:
    | { pending: true; profile: { name: string; email: string } }
    | { pending: false; accessToken: string; refreshToken: string },
) {
  if (result.pending) {
    return reply.redirect(`${FRONTEND_URL}/oauth-callback?status=pending`);
  }
  const params = new URLSearchParams({
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
  return reply.redirect(`${FRONTEND_URL}/oauth-callback?${params.toString()}`);
}

const oauthRoutes = (app: FastifyInstance) => {
  app.register(fastifyOauth2, {
    name: "oauth2Google",
    scope: ["profile", "email"],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID!,
        secret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      auth: fastifyOauth2.GOOGLE_CONFIGURATION,
    },
    startRedirectPath: "/google",
    callbackUri: process.env.GOOGLE_CALLBACK_URL!,
  });

  app.register(fastifyOauth2, {
    name: "oauth2Facebook",
    scope: ["email", "public_profile"],
    credentials: {
      client: {
        id: process.env.FACEBOOK_CLIENT_ID!,
        secret: process.env.FACEBOOK_CLIENT_SECRET!,
      },
      auth: fastifyOauth2.FACEBOOK_CONFIGURATION,
    },
    startRedirectPath: "/facebook",
    callbackUri: process.env.FACEBOOK_CALLBACK_URL!,
  });

  app.get("/google/callback", async (request, reply) => {
    try {
      const { token } =
        await app.oauth2Google!.getAccessTokenFromAuthorizationCodeFlow(request);

      const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${token.access_token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch Google profile");
      const profile = (await res.json()) as GoogleUserinfo;

      const result = await authService.loginWithSocial(
        "google",
        profile.sub,
        profile.email,
        profile.name,
      );
      return redirectWithResult(reply, result);
    } catch (err) {
      app.log.error(err);
      return reply.redirect(`${FRONTEND_URL}/oauth-callback?status=error`);
    }
  });

  app.get("/facebook/callback", async (request, reply) => {
    try {
      const { token } =
        await app.oauth2Facebook!.getAccessTokenFromAuthorizationCodeFlow(request);

      const res = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${token.access_token}`,
      );
      if (!res.ok) throw new Error("Failed to fetch Facebook profile");
      const profile = (await res.json()) as FacebookUserinfo;

      const result = await authService.loginWithSocial(
        "facebook",
        profile.id,
        profile.email,
        profile.name,
      );
      return redirectWithResult(reply, result);
    } catch (err) {
      app.log.error(err);
      return reply.redirect(`${FRONTEND_URL}/oauth-callback?status=error`);
    }
  });
};

export default oauthRoutes;
