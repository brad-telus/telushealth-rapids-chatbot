import type {
    Message,
    MessageSendParams,
    Part,
    SendMessageResponse,
    SendMessageSuccessResponse,
    Task,
    TaskArtifactUpdateEvent,
    TaskStatusUpdateEvent,
    TextPart,
} from "@a2a-js/sdk";
import {A2AClient} from "@a2a-js/sdk/client";

import {
    type LanguageModelV2,
    type LanguageModelV2CallOptions,
    type LanguageModelV2CallWarning,
    type LanguageModelV2Content,
    type LanguageModelV2FinishReason,
    type LanguageModelV2Prompt,
    type LanguageModelV2StreamPart,
    type LanguageModelV2TextPart,
    UnsupportedFunctionalityError,
} from "@ai-sdk/provider";
import {
    convertAsyncIteratorToReadableStream,
    generateId,
    type IdGenerator,
} from "@ai-sdk/provider-utils";

type A2AStreamEventData =
    | Task
    | Message
    | TaskStatusUpdateEvent
    | TaskArtifactUpdateEvent;

export type A2aChatSettings = object;

export type A2aChatConfig = {
    readonly provider: string;
    readonly generateId?: IdGenerator;
    readonly fetchImpl?: typeof fetch;
};

export function mapFinishReason(
    event: TaskStatusUpdateEvent
): LanguageModelV2FinishReason {
    if (event.status.state === "completed") {
        return "stop";
    }

    if (event.status.state === "input-required") {
        return "stop";
    }

    if (event.status.state === "auth-required") {
        return "error";
    }

    if (event.status.state === "failed") {
        return "error";
    }

    if (event.status.state === "canceled") {
        return "other";
    }

    if (event.status.state === "rejected") {
        return "error";
    }

    if (event.status.state === "submitted") {
        return "stop";
    }

    if (event.status.state === "unknown") {
        return "unknown";
    }

    if (event.status.state === "working") {
        return "unknown";
    }

    return "unknown";
}

export function getResponseMetadata(event: A2AStreamEventData) {
    if (event.kind === "task") {
        return {
            id: event.id,
            modelId: undefined,
            timestamp: event.status.timestamp
                ? new Date(event.status.timestamp)
                : undefined,
        };
    }
    if (event.kind === "message") {
        return {
            id: event.messageId,
            modelId: undefined,
            timestamp: undefined,
        };
    }

    if (event.kind === "status-update") {
        return {
            id: event.taskId,
            modelId: undefined,
            timestamp: event.status.timestamp
                ? new Date(event.status.timestamp)
                : undefined,
        };
    }

    if (event.kind === "artifact-update") {
        return {
            id: event.taskId,
            modelId: undefined,
            timestamp: undefined,
        };
    }

    console.log("Unknown event kind to get getResponseMetadata", event);

    return {};
}

function isErrorResponse(response: SendMessageResponse): boolean {
    return "error" in response;
}

class A2aChatLanguageModel implements LanguageModelV2 {
    readonly specificationVersion = "v2";
    readonly provider: string;
    readonly modelId: string;
    private readonly config: A2aChatConfig;

    constructor(
        modelId: string,
        settings: A2aChatSettings,
        config: A2aChatConfig
    ) {
        this.provider = config.provider;
        this.modelId = modelId;
        this.config = config;
        // Initialize with settings and config
    }

    // Convert AI SDK prompt to provider format
    private getArgs(options: LanguageModelV2CallOptions) {
        const warnings: LanguageModelV2CallWarning[] = [];

        // Map messages to provider format
        const messages = this.convertToProviderMessages(options.prompt);

        if (options.tools) {
            throw new UnsupportedFunctionalityError({
                functionality: "tools",
                message: "We don't support tools, yet.",
            });
        }

        const tools = undefined;

        const body = {
            model: this.modelId,
            messages,
            temperature: options.temperature,
            max_tokens: options.maxOutputTokens,
            stop: options.stopSequences,
            tools,
        };

        return {args: body, warnings};
    }

    async doGenerate(
        options: Parameters<LanguageModelV2["doGenerate"]>[0]
    ): Promise<Awaited<ReturnType<LanguageModelV2["doGenerate"]>>> {
        const {args, warnings} = this.getArgs(options);

        const client = new A2AClient(this.modelId, {
            fetchImpl: this.config.fetchImpl,
        });
        const card = await client.getAgentCard();
        console.log("card", card);
        console.log("args", args);

        if (args.messages.length < 1) {
            throw new Error("Cannot handle zero messages!");
        }

        const message = args.messages[args.messages.length - 1];

        const sendParams: MessageSendParams = {
            message,
            configuration: {
                blocking: true,
                acceptedOutputModes: ["text/plain"],
            },
        };

        if (options.providerOptions?.a2a?.contextId) {
            sendParams.message.contextId = options.providerOptions?.a2a?.contextId as string;
        }

        console.log("sendParams", sendParams.message.parts);

        const sendResponse: SendMessageResponse =
            await client.sendMessage(sendParams);

        if (isErrorResponse(sendResponse)) {
            throw new Error(
                "Error sending message:" +
                (sendResponse as { error: { message: string } }).error.message
            );
        }

        // On success, the result can be a Task or a Message. Check which one it is.
        const response = (sendResponse as SendMessageSuccessResponse).result;

        // Convert provider response to AI SDK format
        const content: LanguageModelV2Content[] =
            this.convertProviderResponseToContent(response);

        return {
            content,
            finishReason: "stop", // this.mapFinishReason(response.choices[0].finish_reason),
            usage: {
                inputTokens: undefined, // response.usage?.prompt_tokens,
                outputTokens: undefined, // response.usage?.completion_tokens,
                totalTokens: undefined, // response.usage?.total_tokens,
            },
            request: {body: args},
            response: {body: response},
            warnings,
        };
    }

    async doStream(
        options: Parameters<LanguageModelV2["doStream"]>[0]
    ): Promise<Awaited<ReturnType<LanguageModelV2["doStream"]>>> {
        const {args, warnings} = this.getArgs(options);

        const client = new A2AClient(this.modelId, {
            fetchImpl: this.config.fetchImpl,
        });
        const card = await client.getAgentCard();
        console.log("card", card);

        if (args.messages.length < 1) {
            throw new Error("Cannot handle less then one message!");
        }

        const message = args.messages[args.messages.length - 1];

        if (options.providerOptions?.a2a?.contextId) {
            message.contextId = options.providerOptions?.a2a?.contextId as string;
        }

        try {
            console.log(
                `\n--- Starting streaming task for message ${message.messageId} ---`
            );

            // Construct the `MessageSendParams` object.
            const streamParams: MessageSendParams = {
                message,
            };

            console.log("sendMessageStream");
            const clientCard = await client.getAgentCard();

            let simulatedStream = null;

            if (!clientCard.capabilities.streaming) {
                const nonStreamingResponse = await client.sendMessage(streamParams);

                if ("result" in nonStreamingResponse) {
                    // task or message
                    simulatedStream = new ReadableStream<A2AStreamEventData>({
                        start(controller) {
                            controller.enqueue(nonStreamingResponse.result);
                            controller.close();
                        },
                    });
                }

                if ("error" in nonStreamingResponse) {
                    // FIXME: error
                }
            }

            // Use the `sendMessageStream` method.
            const response = client.sendMessageStream(streamParams);
            let currentTaskId: string | undefined;
            let isFirstChunk = true;
            const activeTextIds = new Set<string>();
            let finishReason: LanguageModelV2FinishReason = "unknown";

            const enqueueNonTextParts = (
                controller: TransformStreamDefaultController<LanguageModelV2StreamPart>,
                parts: Part[]
            ) => {
                // File upload/download support has been removed
                // Only text parts are now supported
            };

            const enqueueTextParts = (
                controller: TransformStreamDefaultController<LanguageModelV2StreamPart>,
                parts: Part[],
                id: string,
                lastChunk: boolean
            ) => {
                const textContentParts = parts.filter((part) => part.kind === "text");

                if (textContentParts.length > 0) {
                    if (!activeTextIds.has(id)) {
                        controller.enqueue({type: "text-start", id});
                        activeTextIds.add(id);
                    }

                    const textContent = parts
                        .filter((part) => part.kind === "text")
                        .map((part) => {
                            return part.text;
                        })
                        .join(" ");

                    controller.enqueue({
                        type: "text-delta",
                        id,
                        delta: textContent,
                    });

                    if (lastChunk) {
                        controller.enqueue({
                            type: "text-end",
                            id,
                        });
                        activeTextIds.delete(id);
                    }
                }
            };

            const enqueueParts = (
                controller: TransformStreamDefaultController<LanguageModelV2StreamPart>,
                parts: Part[],
                id: string,
                lastChunk: boolean
            ) => {
                enqueueNonTextParts(controller, parts);
                enqueueTextParts(controller, parts, id, lastChunk);
            };

            return {
                stream: (
                    simulatedStream || convertAsyncIteratorToReadableStream(response)
                ).pipeThrough(
                    new TransformStream<A2AStreamEventData, LanguageModelV2StreamPart>({
                        start(controller) {
                            controller.enqueue({type: "stream-start", warnings});
                        },

                        transform(event, controller) {
                            console.log("found event", event);
                            // Emit raw chunk if requested (before anything else)
                            if (options.includeRawChunks) {
                                controller.enqueue({type: "raw", rawValue: event});
                            }

                            //if (!event.success) {
                            //  controller.enqueue({ type: 'error', error: event.error });
                            //  return;
                            //}

                            if (isFirstChunk) {
                                isFirstChunk = false;

                                controller.enqueue({
                                    type: "response-metadata",
                                    ...getResponseMetadata(event),
                                });
                            }

                            // Differentiate subsequent stream events.
                            if (event.kind === "status-update") {
                                console.log(
                                    `[${event.taskId}] Status Update: ${event.status.state}
                  }`
                                );
                                if (event.final) {
                                    console.log(`[${event.taskId}] Stream marked as final.`);
                                    finishReason = mapFinishReason(event);
                                }
                            } else if (event.kind === "artifact-update") {
                                // Use artifact.name or artifact.artifactId for identification
                                console.log(
                                    `[${event.taskId}] Artifact Update: ${
                                        event.artifact.name ?? event.artifact.artifactId
                                    } - Part Count: ${event.artifact.parts.length}`
                                );

                                event.artifact.parts.forEach((part) => {
                                    console.log("  o " + JSON.stringify(part));
                                });

                                enqueueParts(
                                    controller,
                                    event.artifact.parts,
                                    event.artifact.artifactId,
                                    event.lastChunk as boolean
                                );
                            } else {
                                if (event.kind === "task") {
                                    console.log(
                                        `[${currentTaskId}] Task created. Status: ${event.status.state}`
                                    );
                                }

                                console.log("event", event);
                                // This could be a direct Message response if the agent doesn't create a task.
                                if (isFirstChunk) {
                                    isFirstChunk = false;
                                    controller.enqueue({
                                        type: "response-metadata",
                                        ...getResponseMetadata(event),
                                    });
                                }

                                if (event.kind === "task" && event.status.message) {
                                    enqueueParts(
                                        controller,
                                        event.status.message.parts,
                                        event.status.message.messageId,
                                        true
                                    );
                                }
                                if (
                                    event.kind === "task" &&
                                    event.artifacts &&
                                    event.artifacts
                                ) {
                                    for (const artifact of event.artifacts) {
                                        enqueueParts(
                                            controller,
                                            artifact.parts,
                                            artifact.artifactId,
                                            true
                                        );
                                    }
                                }

                                if (event.kind === "message") {
                                    enqueueParts(controller, event.parts, event.messageId, true);
                                }

                                finishReason = "stop";
                            }
                        },

                        flush(controller) {
                            activeTextIds.forEach((activeTextId) => {
                                controller.enqueue({type: "text-end", id: activeTextId});
                            });

                            controller.enqueue({
                                type: "finish",
                                finishReason,
                                usage: {
                                    inputTokens: undefined,
                                    outputTokens: undefined,
                                    totalTokens: undefined,
                                },
                            });
                        },
                    })
                ),
            };
        } catch (error) {
            throw new Error(
                `Error during streaming for message ${message.messageId}:` + error
            );
        }
    }

    private convertToProviderMessages(prompt: LanguageModelV2Prompt): Message[] {
        return prompt
            .filter(
                (message) => message.role === "assistant" || message.role === "user"
            )
            .map((message) => {
                return {
                    role: message.role === "assistant" ? "agent" : "user",
                    kind: "message",
                    messageId: generateId(),
                    parts: message.content.map((part) => {
                        if (part.type === "text") {
                            return {kind: "text", text: part.text} as TextPart;
                        }
                        if (part.type === "file") {
                            throw new UnsupportedFunctionalityError({
                                functionality: "file upload/download",
                                message:
                                    "File upload and download functionality has been removed.",
                            });
                        }
                        throw new Error(`Unsupported part type: ${part.type}`);
                    }),
                };
            });
    }

    private convertProviderPartToContent(part: Part): LanguageModelV2Content[] {
        const content: LanguageModelV2Content[] = [];

        if (part.kind === "text") {
            content.push({
                type: "text",
                text: part.text,
            } as LanguageModelV2TextPart);
        }

        // File upload/download support has been removed
        // Only text parts are now supported

        return content;
    }

    private convertProviderResponseToContent(
        response: Task | Message
    ): LanguageModelV2Content[] {
        let content: LanguageModelV2Content[] = [];

        if (response.kind === "message") {
            response.parts.forEach((part) => {
                content = content.concat(
                    ...this.convertProviderPartToContent(part).flat()
                );
            });
        }

        if (response.kind === "task") {
            if (response.status.message) {
                response.status.message.parts.forEach((part) => {
                    content = content.concat(
                        ...this.convertProviderPartToContent(part).flat()
                    );
                });
            }
            response.artifacts?.forEach((artifact) => {
                artifact.parts.forEach((part) => {
                    content = content.concat(
                        ...this.convertProviderPartToContent(part).flat()
                    );
                });
            });
        }

        return content;
    }

    readonly supportedUrls: Record<string, RegExp[]> = {
        // File upload/download support has been removed
        // No URLs are supported for file operations
    };
}

export {A2aChatLanguageModel};
