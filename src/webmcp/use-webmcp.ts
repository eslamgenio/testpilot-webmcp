"use client";

import { useEffect, useState } from "react";
import { toolCatalog, type JsonSchema } from "./tool-catalog";

type RuntimeModelContext = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: JsonSchema;
      execute: (input: Record<string, unknown>) => Promise<unknown>;
    },
    options?: { signal?: AbortSignal },
  ) => Promise<void>;
};

type WebMcpStatus = {
  supported: boolean | null;
  registered: number;
  error: string | null;
};

export function useWebMcp(): WebMcpStatus {
  const [status, setStatus] = useState<WebMcpStatus>({ supported: null, registered: 0, error: null });

  useEffect(() => {
    const controller = new AbortController();
    const modelContext = (document as Document & { modelContext?: RuntimeModelContext }).modelContext;

    if (!modelContext || typeof modelContext.registerTool !== "function") {
      const statusUpdate = window.setTimeout(
        () => setStatus({ supported: false, registered: 0, error: null }),
        0,
      );
      return () => {
        window.clearTimeout(statusUpdate);
        controller.abort();
      };
    }

    let active = true;
    Promise.all(
      toolCatalog.map((definition) =>
        modelContext.registerTool(
          {
            name: definition.name,
            description: definition.description,
            inputSchema: definition.inputSchema,
            async execute(input) {
              try {
                const response = await fetch(`/api/tools/${definition.name}`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(input ?? {}),
                  signal: controller.signal,
                });
                const result = (await response.json()) as unknown;
                if (definition.mutatesState) {
                  window.dispatchEvent(new CustomEvent("testpilot:state-changed", { detail: { tool: definition.name } }));
                }
                return result;
              } catch (error) {
                if (error instanceof DOMException && error.name === "AbortError") throw error;
                return {
                  success: false,
                  error: {
                    code: "NETWORK_ERROR",
                    message: error instanceof Error ? error.message : "The TestPilot API could not be reached.",
                  },
                };
              }
            },
          },
          { signal: controller.signal },
        ),
      ),
    )
      .then(() => {
        if (active) setStatus({ supported: true, registered: toolCatalog.length, error: null });
      })
      .catch((error: unknown) => {
        if (active) {
          setStatus({
            supported: true,
            registered: 0,
            error: error instanceof Error ? error.message : "WebMCP registration failed.",
          });
        }
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return status;
}
