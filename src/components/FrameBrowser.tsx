import { useEffect, useState } from "react";
import type { FigmaApi } from "../services/figmaApi.ts";
import type { FigmaFile, FigmaNode, FigmaPage } from "../types/figma.ts";

const IMPORTABLE_TYPES: readonly string[] = ["FRAME", "COMPONENT", "COMPONENT_SET", "SECTION"];

interface FrameBrowserProps {
  readonly figmaApi: FigmaApi;
  readonly fileKey: string;
  readonly fileName: string;
  readonly onFrameSelected: (frame: FigmaNode, file: FigmaFile) => void;
  readonly onBack: () => void;
}

const FrameBrowser = ({ figmaApi, fileKey, fileName, onFrameSelected, onBack }: FrameBrowserProps) => {
  const [file, setFile] = useState<FigmaFile | null>(null);
  const [selectedPage, setSelectedPage] = useState<FigmaPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    figmaApi
      .getFile(fileKey)
      .then((f) => {
        setFile(f);
        if (f.document.children.length > 0) {
          setSelectedPage(f.document.children[0] ?? null);
        }
      })
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoading(false));
  }, [figmaApi, fileKey]);

  if (loading) return <p className="loading">Loading file "{fileName}"…</p>;
  if (error) return <p className="error-message">{error}</p>;
  if (!file) return null;

  const topLevelFrames = selectedPage?.children.filter((n) =>
    IMPORTABLE_TYPES.includes(n.type),
  ) ?? [];

  return (
    <div className="frame-browser">
      <div className="browser-header">
        <button type="button" className="back-button" onClick={onBack}>
          ← Back
        </button>
        <h2>{file.name}</h2>
      </div>

      {/* Page selector */}
      <div className="page-tabs">
        {file.document.children.map((page) => (
          <button
            key={page.id}
            type="button"
            className={`page-tab ${selectedPage?.id === page.id ? "active" : ""}`}
            onClick={() => setSelectedPage(page)}
          >
            {page.name}
          </button>
        ))}
      </div>

      {/* Frames grid */}
      {topLevelFrames.length === 0 ? (
        <p className="empty-state">No importable frames found on this page.</p>
      ) : (
        <div className="frame-grid">
          {topLevelFrames.map((frame) => (
            <button
              key={frame.id}
              type="button"
              className="frame-card"
              onClick={() => onFrameSelected(frame, file)}
            >
              <div className="frame-preview">
                <span className="frame-icon">{frame.type === "COMPONENT" ? "⚛" : "▭"}</span>
              </div>
              <div className="frame-card-info">
                <span className="frame-card-name">{frame.name}</span>
                <span className="frame-card-type">{frame.type}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default FrameBrowser;
