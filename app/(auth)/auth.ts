import NextAuth, {type DefaultSession} from "next-auth";
import type {DefaultJWT} from "next-auth/jwt";
import type {OIDCConfig} from "next-auth/providers";
import {authConfig} from "./auth.config";

export type UserType = "regular";

declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            type: UserType;
        } & DefaultSession["user"];
    }

    // biome-ignore lint/nursery/useConsistentTypeDefinitions: "Required"
    interface User {
        id?: string;
        email?: string | null;
        type: UserType;
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        id: string;
        type: UserType;
    }
}

// Validate required ForgeRock environment variables
const missingEnvVars = [];
if (!process.env.FORGEROCK_ISSUER)
    missingEnvVars.push('FORGEROCK_ISSUER');

if (!process.env.FORGEROCK_CLIENT_ID)
    missingEnvVars.push('FORGEROCK_CLIENT_ID');

if (!process.env.FORGEROCK_CLIENT_SECRET)
    missingEnvVars.push('FORGEROCK_CLIENT_SECRET');

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required ForgeRock environment variables: ${missingEnvVars.join(', ')}`);
}

const providers = [
    {
        id: "forgerock",
        name: "ForgeRock",
        type: "oidc",
        issuer: process.env.FORGEROCK_ISSUER,
        clientId: process.env.FORGEROCK_CLIENT_ID,
        clientSecret: process.env.FORGEROCK_CLIENT_SECRET,
        authorization: {
            params: {
                scope: "openid profile email",
                response_type: "code",
            },
        },
        token: {
            params: {
                grant_type: "authorization_code",
            },
        },
        userinfo: {
            async request({tokens, provider}: { tokens: any; provider: any }) {
                const response = await fetch(provider.userinfo?.url as string, {
                    headers: {
                        Authorization: `Bearer ${tokens.access_token}`,
                    },
                });
                return response.json();
            },
        },
        profile(profile: any) {
            return {
                id: profile.sub,
                email: profile.email,
                name: profile.name || profile.preferred_username,
                type: "regular",
            };
        },
    } as OIDCConfig<any>,
];

export const {
    handlers: {GET, POST},
    auth,
    signIn,
    signOut,
} = NextAuth({
    ...authConfig,
    providers,
    callbacks: {
        jwt({token, user}) {
            if (user) {
                token.id = user.id as string;
                token.type = user.type;
            }

            return token;
        },
        session({session, token}) {
            if (session.user) {
                session.user.id = token.id;
                session.user.type = token.type;
            }

            return session;
        },
    },
});
