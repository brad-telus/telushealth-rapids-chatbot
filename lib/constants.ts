export const isProductionEnvironment = process.env.NODE_ENV === "production";
export const isDevelopmentEnvironment = process.env.NODE_ENV === "development";
export const isTestEnvironment = Boolean(
    process.env.PLAYWRIGHT_TEST_BASE_URL ||
    process.env.PLAYWRIGHT ||
    process.env.CI_PLAYWRIGHT
);

// Feature flag for ForgeRock authentication
export const isForgeRockAuthEnabled = process.env.ENABLE_FORGEROCK_AUTH && process.env.ENABLE_FORGEROCK_AUTH === "true";

export const FULLY_QUALIFIED_DOMAIN = process.env.FULLY_QUALIFIED_DOMAIN;