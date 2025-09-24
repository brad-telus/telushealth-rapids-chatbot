import type { UserType } from "@/app/auth/types";
import type { ChatModel } from "./models";

type Entitlements = {
  maxMessagesPerDay: number;
  availableChatModelIds: ChatModel["id"][];
};

export const entitlementsByUserType: Record<UserType, Entitlements> = {
  /*
   * For users with an account (authenticated via ForgeRock)
   */
  regular: {
    maxMessagesPerDay: 100_000, // Very high limit for authenticated users, TODO: figure out a better pricing model
    availableChatModelIds: ["chat-model", "chat-model-reasoning"],
  },
  /*
   * TODO: For users with an account and a paid membership
   */
};
