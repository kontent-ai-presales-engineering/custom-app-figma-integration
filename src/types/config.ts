export interface AppConfig {
  readonly figmaToken: string;
  readonly figmaTeamId?: string;
  readonly kontentApiKey: string;
}

export const parseAppConfig = (raw: unknown): AppConfig | null => {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.figmaToken !== "string" || !obj.figmaToken) return null;
  if (typeof obj.kontentApiKey !== "string" || !obj.kontentApiKey) return null;
  return {
    figmaToken: obj.figmaToken,
    figmaTeamId: typeof obj.figmaTeamId === "string" ? obj.figmaTeamId : undefined,
    kontentApiKey: obj.kontentApiKey,
  };
};
