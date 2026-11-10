import { useEffect, useState } from "react";
import type { FigmaApi } from "../services/figmaApi.ts";
import type { FigmaFile, FigmaNode } from "../types/figma.ts";

interface FramePreviewProps {
  readonly frame: FigmaNode;
  readonly file: FigmaFile;
  readonly fileKey: string;
  readonly figmaApi: FigmaApi;
  readonly onImport: () => void;
  readonly onBack: () => void;
}

const FramePreview = ({ frame, file, fileKey, figmaApi, onImport, onBack }: FramePreviewProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageUrl(null);
    setImageError(false);
    figmaApi
      .getImageUrls(fileKey, [frame.id])
      .then(({ images }) => {
        const url = images[frame.id] ?? null;
        setImageUrl(url);
      })
      .catch(() => setImageError(true));
  }, [figmaApi, fileKey, frame.id]);

  return (
    <div className="frame-preview-panel">
      <div className="browser-header">
        <button type="button" className="back-button" onClick={onBack}>← Back</button>
        <h2>{frame.name}</h2>
      </div>

      <div className="preview-image-wrap">
        {imageError ? (
          <div className="preview-placeholder">
            <span className="frame-icon" style={{ fontSize: "4rem", opacity: 0.3 }}>▭</span>
            <p className="muted">Preview unavailable</p>
          </div>
        ) : imageUrl === null ? (
          <div className="preview-placeholder">
            <p className="loading">Loading preview…</p>
          </div>
        ) : (
          <img src={imageUrl} alt={frame.name} className="preview-image" />
        )}
      </div>

      <div className="preview-meta">
        <span className="preview-file-name">{file.name}</span>
        <span className={`type-badge type-${frame.type.toLowerCase()}`}>{frame.type}</span>
      </div>

      <div className="preview-actions">
        <button type="button" className="button button-secondary" onClick={onBack}>
          Cancel
        </button>
        <button type="button" className="button button-import" onClick={onImport}>
          Import to Kontent.ai →
        </button>
      </div>
    </div>
  );
};

export default FramePreview;
