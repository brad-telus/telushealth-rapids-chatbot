import {initializeDefaultUser} from "@/lib/db/init";
import LoginClient from "./login-client";
import {isForgeRockAuthEnabled} from "@/lib/constants";

export default async function LoginPage() {
    // Initialize default user on server page load, if we are not using ForgeRock auth
    if (!isForgeRockAuthEnabled)
        await initializeDefaultUser();

    return <LoginClient/>;
}