import type {
  CreateContentItemRequest,
  CreateContentTypeRequest,
  CreatedContentItem,
  KontentLanguage,
  UpsertVariantRequest,
} from "../types/kontent.ts";

const BASE_URL = "https://manage.kontent.ai/v2/projects";

class KontentApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "KontentApiError";
  }
}

export const createKontentApi = (apiKey: string, environmentId: string) => {
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };

  const request = async <T>(method: string, path: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${BASE_URL}/${environmentId}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new KontentApiError(response.status, `Kontent.ai API ${response.status}: ${text}`);
    }
    return response.json() as Promise<T>;
  };

  return {
    listLanguages: () =>
      request<{ languages: readonly KontentLanguage[] }>("GET", "/languages"),

    createContentType: (data: CreateContentTypeRequest) =>
      request<{ id: string; codename: string; name: string }>("POST", "/types", data),

    createContentItem: (data: CreateContentItemRequest) =>
      request<CreatedContentItem>("POST", "/items", data),

    upsertVariant: (itemId: string, languageCodename: string, data: UpsertVariantRequest) =>
      request<unknown>("PUT", `/items/${itemId}/variants/codename/${languageCodename}`, data),
  };
};

export type KontentApi = ReturnType<typeof createKontentApi>;
