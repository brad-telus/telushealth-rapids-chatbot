import {createUser, getUser} from "./queries";
import {generateDummyPassword} from "./utils";

export const initializeDefaultUser = async (): Promise<void> => {
    const defaultEmail = "default@example.com";

    // Check if the default user already exists
    const existingUsers = await getUser(defaultEmail);

    // If the default user doesn't exist, create it
    if (existingUsers.length === 0) {
        console.log("Creating default user in the database");
        const dummyPassword = generateDummyPassword();
        await createUser(defaultEmail, dummyPassword);
    } else {
        console.log(`Default user ${defaultEmail} already exists in the database`);
    }
};