import type { FigmaFile, FigmaProject, FigmaProjectFile, FigmaUser } from "../types/figma.ts";

const BASE_URL = "https://api.figma.com/v1";
// Folder endpoints (scope folders:read) only exist on v2. They replace the deprecated
// v1 /teams/:id/projects and /projects/:id/files endpoints (scope projects:read).
const BASE_URL_V2 = "https://api.figma.com/v2";

type FolderListResponse = { readonly folders?: readonly FigmaProject[]; readonly projects?: readonly FigmaProject[] };

class FigmaApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FigmaApiError";
  }
}

export const createFigmaApi = (token: string) => {
  const get = async <T>(path: string, baseUrl: string = BASE_URL): Promise<T> => {
    const response = await fetch(`${baseUrl}${path}`, {
      headers: { "X-Figma-Token": token },
    });
    if (!response.ok) {
      const text = await response.text();
      if (response.status === 403 && text.includes("Invalid scope")) {
        const required = text.match(/requires the (.+?) scope/)?.[1] ?? "a missing";
        throw new FigmaApiError(
          403,
          `Your Figma token is missing a required scope (${required}). Create a new personal access token in Figma (Settings > Security > Personal access tokens) with that scope enabled, then update it in the app configuration.`,
        );
      }
      throw new FigmaApiError(response.status, `Figma API ${response.status}: ${text}`);
    }
    return response.json() as Promise<T>;
  };

  return {
    getMe: () => get<FigmaUser>("/me"),

    /** Top-level folders (formerly "projects") of a team. */
    getTeamFolders: async (teamId: string): Promise<readonly FigmaProject[]> => {
      const res = await get<FolderListResponse>(`/teams/${teamId}/folders`, BASE_URL_V2);
      return res.folders ?? res.projects ?? [];
    },

    /** Subfolders directly inside a folder. */
    getSubfolders: async (folderId: string): Promise<readonly FigmaProject[]> => {
      const res = await get<FolderListResponse>(`/folders/${folderId}/folders`, BASE_URL_V2);
      return res.folders ?? res.projects ?? [];
    },

    /** Files directly inside a folder. */
    getFolderFiles: async (folderId: string): Promise<readonly FigmaProjectFile[]> => {
      const res = await get<{ files?: readonly FigmaProjectFile[] }>(`/folders/${folderId}/files`, BASE_URL_V2);
      return res.files ?? [];
    },

    getFile: (fileKey: string) => get<FigmaFile>(`/files/${fileKey}`),

    getImageUrls: (fileKey: string, nodeIds: readonly string[]) =>
      get<{ images: Record<string, string | null> }>(
        `/images/${fileKey}?ids=${nodeIds.map(encodeURIComponent).join(",")}&format=png&scale=2`,
      ),
  };
};

export type FigmaApi = ReturnType<typeof createFigmaApi>;

/** Extracts a Figma file key from a Figma URL or returns the string as-is if it looks like a key already. */
export const extractFileKey = (urlOrKey: string): string | null => {
  const trimmed = urlOrKey.trim();
  // Figma URLs: https://www.figma.com/file/{key}/... or https://www.figma.com/design/{key}/...
  const match = trimmed.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  if (match) return match[1] ?? null;
  // If it looks like a raw key (alphanumeric, no slashes)
  if (/^[a-zA-Z0-9]{10,}$/.test(trimmed)) return trimmed;
  return null;
};
