"use client";

import type {UseChatHelpers} from "@ai-sdk/react";
import {motion} from "framer-motion";
import {memo} from "react";
import type {ChatMessage} from "@/lib/types";
import {updateUrl} from "@/lib/utils";
import {Suggestion} from "./elements/suggestion";
import type {VisibilityType} from "./visibility-selector";

type SuggestedActionsProps = {
    chatId: string;
    sendMessage: UseChatHelpers<ChatMessage>["sendMessage"];
    selectedVisibilityType: VisibilityType;
};

function PureSuggestedActions({chatId, sendMessage}: SuggestedActionsProps) {
    const suggestedActions = [
        "what are the best meds for MDD?",
        "my MDD patient is concerned about weight gain, and is currently on citalopram 40mg daily. what are some alternatives?",
    ];

    return (
        <div
            className="grid w-full gap-2 sm:grid-cols-1"
            data-testid="suggested-actions"
        >
            {suggestedActions.map((suggestedAction, index) => (
                <motion.div
                    animate={{opacity: 1, y: 0}}
                    exit={{opacity: 0, y: 20}}
                    initial={{opacity: 0, y: 20}}
                    key={suggestedAction}
                    transition={{delay: 0.05 * index}}
                >
                    <Suggestion
                        className="h-auto w-full whitespace-normal p-3 text-left"
                        onClick={(suggestion) => {
                            updateUrl(`/chat/${chatId}`);
                            sendMessage({
                                role: "user",
                                parts: [{type: "text", text: suggestion}],
                            });
                        }}
                        suggestion={suggestedAction}
                    >
                        {suggestedAction}
                    </Suggestion>
                </motion.div>
            ))}
        </div>
    );
}

export const SuggestedActions = memo(
    PureSuggestedActions,
    (prevProps, nextProps) => {
        if (prevProps.chatId !== nextProps.chatId) {
            return false;
        }
        if (prevProps.selectedVisibilityType !== nextProps.selectedVisibilityType) {
            return false;
        }

        return true;
    }
);
