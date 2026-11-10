import { useMemo, useState } from "react";
import ConfigError from "./components/ConfigError.tsx";
import FileBrowser from "./components/FileBrowser.tsx";
import FrameBrowser from "./components/FrameBrowser.tsx";
import FramePreview from "./components/FramePreview.tsx";
import ImportPanel from "./components/ImportPanel.tsx";
import { useAppConfig, useAppContext } from "./contexts/AppContext.tsx";
import { createFigmaApi } from "./services/figmaApi.ts";
import { createKontentApi } from "./services/kontentApi.ts";
import type { FigmaFile, FigmaNode } from "./types/figma.ts";
import { parseAppConfig } from "./types/config.ts";
import "./App.css";

type Step =
  | { kind: "browse-files" }
  | { kind: "browse-frames"; fileKey: string; fileName: string }
  | { kind: "preview"; frame: FigmaNode; file: FigmaFile; fileKey: string }
  | { kind: "import"; frame: FigmaNode; file: FigmaFile; fileKey: string };

const getMissingFields = (raw: unknown): string[] => {
  if (!raw || typeof raw !== "object") {
    return ["figmaToken", "kontentApiKey"];
  }
  const obj = raw as Record<string, unknown>;
  const missing: string[] = [];
  if (!obj.figmaToken) missing.push("figmaToken");
  if (!obj.kontentApiKey) missing.push("kontentApiKey");
  return missing;
};

const App = () => {
  const context = useAppContext();
  const rawConfig = useAppConfig();
  const config = useMemo(() => parseAppConfig(rawConfig), [rawConfig]);
  const [step, setStep] = useState<Step>({ kind: "browse-files" });

  const environmentId = context.environmentId;

  const figmaApi = useMemo(
    () => (config ? createFigmaApi(config.figmaToken) : null),
    [config],
  );
  const kontentApi = useMemo(
    () => (config ? createKontentApi(config.kontentApiKey, environmentId) : null),
    [config, environmentId],
  );

  if (!config || !figmaApi || !kontentApi) {
    return (
      <div className="app-container">
        <ConfigError missing={getMissingFields(rawConfig)} />
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <h1>Figma → Kontent.ai</h1>
        <p className="app-subtitle">Browse your Figma designs and import them as content types and items.</p>
      </header>

      <main className="app-main">
        {step.kind === "browse-files" && (
          <FileBrowser
            figmaApi={figmaApi}
            teamId={config.figmaTeamId}
            onFileSelected={(fileKey, fileName) =>
              setStep({ kind: "browse-frames", fileKey, fileName })
            }
          />
        )}

        {step.kind === "browse-frames" && (
          <FrameBrowser
            figmaApi={figmaApi}
            fileKey={step.fileKey}
            fileName={step.fileName}
            onFrameSelected={(frame, file) => setStep({ kind: "preview", frame, file, fileKey: step.fileKey })}
            onBack={() => setStep({ kind: "browse-files" })}
          />
        )}

        {step.kind === "preview" && (
          <FramePreview
            frame={step.frame}
            file={step.file}
            fileKey={step.fileKey}
            figmaApi={figmaApi}
            onImport={() => setStep({ kind: "import", frame: step.frame, file: step.file, fileKey: step.fileKey })}
            onBack={() => setStep({ kind: "browse-frames", fileKey: step.fileKey, fileName: step.file.name })}
          />
        )}

        {step.kind === "import" && (
          <ImportPanel
            frame={step.frame}
            file={step.file}
            kontentApi={kontentApi}
            kontentEnvironmentId={environmentId}
            onBack={() =>
              setStep({
                kind: "browse-frames",
                fileKey: step.fileKey,
                fileName: step.file.name,
              })
            }
          />
        )}
      </main>
    </div>
  );
};

export default App;
