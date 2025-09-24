import {
    and,
    asc,
    count,
    desc,
    eq,
    gt,
    gte,
    inArray,
    lt,
    type SQL,
} from "drizzle-orm";
import {drizzle} from "drizzle-orm/postgres-js";
import postgres from "postgres";
import type {ArtifactKind} from "@/components/artifact";
import type {VisibilityType} from "@/components/visibility-selector";
import {ChatSDKError} from "../errors";
import type {AppUsage} from "../usage";
import {generateUUID} from "../utils";
import {
    type Chat,
    chat,
    type DBMessage,
    document,
    message,
    type Suggestion,
    stream,
    suggestion,
    type User,
    user,
    vote,
} from "./schema";
import {generateHashedPassword} from "./utils";

/**
 * Utility function to handle database errors consistently
 * @param dbCallFn The database function to execute
 * @param errorCode The error code to use if the function throws
 * @param message The error message to log and include in the thrown ChatSDKError
 * @returns The result of the database function
 * @throws ChatSDKError with the provided errorCode and message
 */
async function catchDbError<T>(
    dbCallFn: () => Promise<T>,
    errorCode: string = "bad_request:database",
    message: string
): Promise<T> {
    try {
        return await dbCallFn();
    } catch (error) {
        console.error(`${errorCode} | ${message}`, error);
        throw new ChatSDKError(errorCode as any, message);
    }
}

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle

// biome-ignore lint: Forbidden non-null assertion.
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);

export async function getUser(email: string): Promise<User[]> {
    return catchDbError(
        async () => db.select().from(user).where(eq(user.email, email)),
        "bad_request:database",
        "Failed to get user by email"
    );
}

export async function deleteUser(email: string): Promise<User> {
    return catchDbError(
        async () => {
            const [deletedUser] = await db
                .delete(user)
                .where(eq(user.email, email))
                .returning();
            return deletedUser;
        },
        "bad_request:database",
        "Failed to delete user by email"
    );
}

export async function createUser(email: string, password: string) {
    const hashedPassword = generateHashedPassword(password);

    return catchDbError(
        async () => db.insert(user).values({email, password: hashedPassword}),
        "bad_request:database",
        "Failed to create user"
    );
}

export async function createUserWithId(email: string, password: string, id: string) {
    const hashedPassword = generateHashedPassword(password);

    return catchDbError(
        async () => db.insert(user).values({id, email, password: hashedPassword}),
        "bad_request:database",
        "Failed to create user with specific ID"
    );
}

export async function saveChat({
                                   id,
                                   userId,
                                   title,
                                   visibility,
                               }: {
    id: string;
    userId: string;
    title: string;
    visibility: VisibilityType;
}) {
    return catchDbError(
        async () => db.insert(chat).values({
            id,
            createdAt: new Date(),
            userId,
            title,
            visibility,
        }),
        "bad_request:database",
        "Failed to save chat"
    );
}

export async function deleteChatById({id}: { id: string }) {
    return catchDbError(
        async () => {
            await db.delete(vote).where(eq(vote.chatId, id));
            await db.delete(message).where(eq(message.chatId, id));
            await db.delete(stream).where(eq(stream.chatId, id));

            const [chatsDeleted] = await db
                .delete(chat)
                .where(eq(chat.id, id))
                .returning();
            return chatsDeleted;
        },
        "bad_request:database",
        "Failed to delete chat by id"
    );
}

export async function getChatsByUserId({
                                           id,
                                           limit,
                                           startingAfter,
                                           endingBefore,
                                       }: {
    id: string;
    limit: number;
    startingAfter: string | null;
    endingBefore: string | null;
}) {
    return catchDbError(
        async () => {
            const extendedLimit = limit + 1;

            const query = (whereCondition?: SQL<any>) =>
                db
                    .select()
                    .from(chat)
                    .where(
                        whereCondition
                            ? and(whereCondition, eq(chat.userId, id))
                            : eq(chat.userId, id)
                    )
                    .orderBy(desc(chat.createdAt))
                    .limit(extendedLimit);

            let filteredChats: Chat[] = [];

            if (startingAfter) {
                const [selectedChat] = await db
                    .select()
                    .from(chat)
                    .where(eq(chat.id, startingAfter))
                    .limit(1);

                if (!selectedChat) {
                    throw new ChatSDKError(
                        "not_found:database",
                        `Chat with id ${startingAfter} not found`
                    );
                }

                filteredChats = await query(gt(chat.createdAt, selectedChat.createdAt));
            } else if (endingBefore) {
                const [selectedChat] = await db
                    .select()
                    .from(chat)
                    .where(eq(chat.id, endingBefore))
                    .limit(1);

                if (!selectedChat) {
                    throw new ChatSDKError(
                        "not_found:database",
                        `Chat with id ${endingBefore} not found`
                    );
                }

                filteredChats = await query(lt(chat.createdAt, selectedChat.createdAt));
            } else {
                filteredChats = await query();
            }

            const hasMore = filteredChats.length > limit;

            return {
                chats: hasMore ? filteredChats.slice(0, limit) : filteredChats,
                hasMore,
            };
        },
        "bad_request:database",
        "Failed to get chats by user id"
    );
}

export async function getChatById({id}: { id: string }) {
    return catchDbError(
        async () => {
            const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
            if (!selectedChat) {
                return null;
            }

            return selectedChat;
        },
        "bad_request:database",
        "Failed to get chat by id"
    );
}

export async function saveMessages({messages}: { messages: DBMessage[] }) {
    return catchDbError(
        async () => db.insert(message).values(messages),
        "bad_request:database",
        "Failed to save messages"
    );
}

export async function getMessagesByChatId({id}: { id: string }) {
    return catchDbError(
        async () => db
            .select()
            .from(message)
            .where(eq(message.chatId, id))
            .orderBy(asc(message.createdAt)),
        "bad_request:database",
        "Failed to get messages by chat id"
    );
}

export async function voteMessage({
                                      chatId,
                                      messageId,
                                      type,
                                  }: {
    chatId: string;
    messageId: string;
    type: "up" | "down";
}) {
    return catchDbError(
        async () => {
            const [existingVote] = await db
                .select()
                .from(vote)
                .where(and(eq(vote.messageId, messageId)));

            if (existingVote) {
                return await db
                    .update(vote)
                    .set({isUpvoted: type === "up"})
                    .where(and(eq(vote.messageId, messageId), eq(vote.chatId, chatId)));
            }
            return await db.insert(vote).values({
                chatId,
                messageId,
                isUpvoted: type === "up",
            });
        },
        "bad_request:database",
        "Failed to vote message"
    );
}

export async function getVotesByChatId({id}: { id: string }) {
    return catchDbError(
        async () => db.select().from(vote).where(eq(vote.chatId, id)),
        "bad_request:database",
        "Failed to get votes by chat id"
    );
}

export async function saveDocument({
                                       id,
                                       title,
                                       kind,
                                       content,
                                       userId,
                                   }: {
    id: string;
    title: string;
    kind: ArtifactKind;
    content: string;
    userId: string;
}) {
    return catchDbError(
        async () => db
            .insert(document)
            .values({
                id,
                title,
                kind,
                content,
                userId,
                createdAt: new Date(),
            })
            .returning(),
        "bad_request:database",
        "Failed to save document"
    );
}

export async function getDocumentsById({id}: { id: string }) {
    return catchDbError(
        async () => {
            const documents = await db
                .select()
                .from(document)
                .where(eq(document.id, id))
                .orderBy(asc(document.createdAt));

            return documents;
        },
        "bad_request:database",
        "Failed to get documents by id"
    );
}

export async function getDocumentById({id}: { id: string }) {
    return catchDbError(
        async () => {
            const [selectedDocument] = await db
                .select()
                .from(document)
                .where(eq(document.id, id))
                .orderBy(desc(document.createdAt));

            return selectedDocument;
        },
        "bad_request:database",
        "Failed to get document by id"
    );
}

export async function deleteDocumentsByIdAfterTimestamp({
                                                            id,
                                                            timestamp,
                                                        }: {
    id: string;
    timestamp: Date;
}) {
    return catchDbError(
        async () => {
            await db
                .delete(suggestion)
                .where(
                    and(
                        eq(suggestion.documentId, id),
                        gt(suggestion.documentCreatedAt, timestamp)
                    )
                );

            return await db
                .delete(document)
                .where(and(eq(document.id, id), gt(document.createdAt, timestamp)))
                .returning();
        },
        "bad_request:database",
        "Failed to delete documents by id after timestamp"
    );
}

export async function saveSuggestions({
                                          suggestions,
                                      }: {
    suggestions: Suggestion[];
}) {
    return catchDbError(
        async () => db.insert(suggestion).values(suggestions),
        "bad_request:database",
        "Failed to save suggestions"
    );
}

export async function getSuggestionsByDocumentId({
                                                     documentId,
                                                 }: {
    documentId: string;
}) {
    return catchDbError(
        async () => db
            .select()
            .from(suggestion)
            .where(and(eq(suggestion.documentId, documentId))),
        "bad_request:database",
        "Failed to get suggestions by document id"
    );
}

export async function getMessageById({id}: { id: string }) {
    return catchDbError(
        async () => db.select().from(message).where(eq(message.id, id)),
        "bad_request:database",
        "Failed to get message by id"
    );
}

export async function deleteMessagesByChatIdAfterTimestamp({
                                                               chatId,
                                                               timestamp,
                                                           }: {
    chatId: string;
    timestamp: Date;
}) {
    return catchDbError(
        async () => {
            const messagesToDelete = await db
                .select({id: message.id})
                .from(message)
                .where(
                    and(eq(message.chatId, chatId), gte(message.createdAt, timestamp))
                );

            const messageIds = messagesToDelete.map(
                (currentMessage) => currentMessage.id
            );

            if (messageIds.length > 0) {
                await db
                    .delete(vote)
                    .where(
                        and(eq(vote.chatId, chatId), inArray(vote.messageId, messageIds))
                    );

                return await db
                    .delete(message)
                    .where(
                        and(eq(message.chatId, chatId), inArray(message.id, messageIds))
                    );
            }
        },
        "bad_request:database",
        "Failed to delete messages by chat id after timestamp"
    );
}

export async function updateChatVisiblityById({
                                                  chatId,
                                                  visibility,
                                              }: {
    chatId: string;
    visibility: "private" | "public";
}) {
    return catchDbError(
        async () => db.update(chat).set({visibility}).where(eq(chat.id, chatId)),
        "bad_request:database",
        "Failed to update chat visibility by id"
    );
}

export async function updateChatLastContextById({
                                                    chatId,
                                                    context,
                                                }: {
    chatId: string;
    // Store merged server-enriched usage object
    context: AppUsage;
}) {
    try {
        return await db
            .update(chat)
            .set({lastContext: context})
            .where(eq(chat.id, chatId));
    } catch (error) {
        console.warn("Failed to update lastContext for chat", chatId, error);
        return;
    }
}

export async function getMessageCountByUserId({
                                                  id,
                                                  differenceInHours,
                                              }: {
    id: string;
    differenceInHours: number;
}) {
    return catchDbError(
        async () => {
            const twentyFourHoursAgo = new Date(
                Date.now() - differenceInHours * 60 * 60 * 1000
            );

            const [stats] = await db
                .select({count: count(message.id)})
                .from(message)
                .innerJoin(chat, eq(message.chatId, chat.id))
                .where(
                    and(
                        eq(chat.userId, id),
                        gte(message.createdAt, twentyFourHoursAgo),
                        eq(message.role, "user")
                    )
                )
                .execute();

            return stats?.count ?? 0;
        },
        "bad_request:database",
        "Failed to get message count by user id"
    );
}

export async function createStreamId({
                                         streamId,
                                         chatId,
                                     }: {
    streamId: string;
    chatId: string;
}) {
    return catchDbError(
        async () => db
            .insert(stream)
            .values({id: streamId, chatId, createdAt: new Date()}),
        "bad_request:database",
        "Failed to create stream id"
    );
}

export async function getStreamIdsByChatId({chatId}: { chatId: string }) {
    return catchDbError(
        async () => {
            const streamIds = await db
                .select({id: stream.id})
                .from(stream)
                .where(eq(stream.chatId, chatId))
                .orderBy(asc(stream.createdAt))
                .execute();

            return streamIds.map(({id}) => id);
        },
        "bad_request:database",
        "Failed to get stream ids by chat id"
    );
}
