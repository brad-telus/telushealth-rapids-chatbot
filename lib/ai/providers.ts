import {
    customProvider,
    extractReasoningMiddleware,
    wrapLanguageModel,
} from "ai";
import axios from "axios";
import {createA2a} from "../a2a-provider";
import {FULLY_QUALIFIED_DOMAIN, isTestEnvironment} from "../constants";

// Function to create provider with request context
export function createProvider(cookieHeader?: string) {
    if (isTestEnvironment) {
        const {
            artifactModel,
            chatModel,
            reasoningModel,
            titleModel,
        } = require("./models.mock");
        return customProvider({
            languageModels: {
                "chat-model": chatModel,
                "chat-model-reasoning": reasoningModel,
                "title-model": titleModel,
                "artifact-model": artifactModel,
            },
        });
    }

    // Create custom axios implementation that includes cookies
    const axiosWithCookies = cookieHeader
        ? async (url: RequestInfo | URL, init?: RequestInit) => {
            const requestUrl = url.toString();
            const headers = {
                ...Object.fromEntries(new Headers(init?.headers).entries()),
                cookie: cookieHeader,
            };
            const method = init?.method;

            console.log("Using custom axios with cookies:", {headers, method, url, init});

            const response = await axios({
                url: requestUrl,
                method,
                headers,
                data: init?.body,
                beforeRedirect: (opts: any) => {
                    opts.headers = opts.headers || {};
                    console.log(`Redirecting to ${opts.href}, opts:`, opts);
                    if (!("Cookie" in opts.headers)) {
                        console.log("Adding Cookie header to redirect request");
                        opts.headers["Cookie"] = cookieHeader;
                    } else {
                        console.log("Cookie header already present in redirect request");
                    }
                },
            });

            // Convert axios response to fetch-like Response object
            return new Response(
                typeof response.data === 'string' ? response.data : JSON.stringify(response.data),
                {
                    status: response.status,
                    statusText: response.statusText,
                    headers: new Headers(response.headers as any),
                }
            );
        }
        : undefined;

    // Create A2A provider with custom axios implementation
    const a2aProvider = createA2a({
        ...(axiosWithCookies && {fetchImpl: axiosWithCookies}),
    });

    // TODO: use environment variable for base URL
    const baseUrl = FULLY_QUALIFIED_DOMAIN
        ? `https://rpds-1234.rapidspoc.com/transformation/a2a`
        : "http://localhost:8089/transformation/a2a";

    return customProvider({
        languageModels: {
            "chat-model": a2aProvider(baseUrl),
            "chat-model-reasoning": wrapLanguageModel({
                model: a2aProvider(baseUrl),
                middleware: extractReasoningMiddleware({tagName: "think"}),
            }),
            "title-model": a2aProvider(baseUrl),
            "artifact-model": a2aProvider(baseUrl),
        },
    });
}

// Default provider for backward compatibility
export const myProvider = createProvider();
