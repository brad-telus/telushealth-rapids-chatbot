import {DEFAULT_EMAIL, DEFAULT_USER_ID} from "../constants";
import {createUser, createUserWithId, deleteUser, getUser} from "./queries";
import {generateDummyPassword} from "./utils";


export const initializeDefaultUser = async (): Promise<void> => {
    // delete if the default user already exists
    await deleteUser(DEFAULT_EMAIL);

    console.log("Creating default user in the database");
    const dummyPassword = generateDummyPassword();
    await createUserWithId(DEFAULT_EMAIL, dummyPassword, DEFAULT_USER_ID);
};