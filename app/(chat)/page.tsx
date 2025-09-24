import {cookies} from "next/headers";
import {redirect} from "next/navigation";
import {Chat} from "@/components/chat";
import {DataStreamHandler} from "@/components/data-stream-handler";
import {DEFAULT_CHAT_MODEL} from "@/lib/ai/models";
import {apiKey, generateUUID} from "@/lib/utils";
import {getSession} from "../auth/session";

export default async function Page() {
    const session = await getSession();

    if (!session) {
        redirect(apiKey("/api/auth/guest"));
    }

    const id = generateUUID();

    const cookieStore = await cookies();
    const modelIdFromCookie = cookieStore.get("chat-model");

    if (!modelIdFromCookie) {
        return (
            <>
                <Chat
                    autoResume={false}
                    id={id}
                    initialChatModel={DEFAULT_CHAT_MODEL}
                    initialMessages={[]}
                    initialVisibilityType="private"
                    isReadonly={false}
                    key={id}
                />
                <DataStreamHandler/>
            </>
        );
    }

    return (
        <>
            <Chat
                autoResume={false}
                id={id}
                initialChatModel={modelIdFromCookie.value}
                initialMessages={[]}
                initialVisibilityType="private"
                isReadonly={false}
                key={id}
            />
            <DataStreamHandler/>
        </>
    );
}
