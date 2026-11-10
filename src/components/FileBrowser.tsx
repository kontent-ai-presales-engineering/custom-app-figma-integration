import { useEffect, useState } from "react";
import type { FigmaApi } from "../services/figmaApi.ts";
import { extractFileKey } from "../services/figmaApi.ts";
import type { FigmaProject, FigmaProjectFile } from "../types/figma.ts";

const RECENT_FILES_KEY = "figma-kontent-recent-files";
const MAX_RECENT = 20;

interface RecentFile {
  readonly key: string;
  readonly name: string;
  readonly openedAt: number;
}

const loadRecentFiles = (): RecentFile[] => {
  try {
    return JSON.parse(localStorage.getItem(RECENT_FILES_KEY) ?? "[]") as RecentFile[];
  } catch {
    return [];
  }
};

const saveRecentFile = (key: string, name: string) => {
  const existing = loadRecentFiles().filter((f) => f.key !== key);
  const updated: RecentFile[] = [{ key, name, openedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
};

const removeRecentFile = (key: string) => {
  const updated = loadRecentFiles().filter((f) => f.key !== key);
  localStorage.setItem(RECENT_FILES_KEY, JSON.stringify(updated));
};

interface FileBrowserProps {
  readonly figmaApi: FigmaApi;
  readonly teamId: string | undefined;
  readonly onFileSelected: (fileKey: string, fileName: string) => void;
}

const FileBrowser = ({ figmaApi, teamId, onFileSelected }: FileBrowserProps) => {
  const [projects, setProjects] = useState<readonly FigmaProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<FigmaProject | null>(null);
  const [files, setFiles] = useState<readonly FigmaProjectFile[]>([]);
  const [subfolders, setSubfolders] = useState<readonly FigmaProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualUrl, setManualUrl] = useState("");
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(loadRecentFiles);

  useEffect(() => {
    if (!teamId) return;
    setLoadingProjects(true);
    setError(null);
    figmaApi
      .getTeamFolders(teamId)
      .then(setProjects)
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoadingProjects(false));
  }, [figmaApi, teamId]);

  const handleSelectProject = (project: FigmaProject) => {
    setSelectedProject(project);
    setFiles([]);
    setSubfolders([]);
    setLoadingFiles(true);
    setError(null);
    Promise.all([figmaApi.getSubfolders(project.id), figmaApi.getFolderFiles(project.id)])
      .then(([sub, f]) => {
        setSubfolders(sub);
        setFiles(f);
      })
      .catch((err: unknown) => setError(String(err)))
      .finally(() => setLoadingFiles(false));
  };

  const openFile = (key: string, name: string) => {
    saveRecentFile(key, name);
    setRecentFiles(loadRecentFiles());
    onFileSelected(key, name);
  };

  const handleManualSubmit = () => {
    const key = extractFileKey(manualUrl);
    if (!key) {
      setError("Could not extract a file key. Paste a Figma URL like https://www.figma.com/design/XXXX/...");
      return;
    }
    setError(null);
    openFile(key, manualUrl.trim());
    setManualUrl("");
  };

  const handleRemoveRecent = (e: React.MouseEvent, key: string) => {
    e.stopPropagation();
    removeRecentFile(key);
    setRecentFiles(loadRecentFiles());
  };

  return (
    <div className="file-browser">
      <h2>Select a Figma File</h2>

      {/* Manual URL input */}
      <div className="manual-input-section">
        <p className="section-label">Open a file by URL or key:</p>
        <div className="input-row">
          <input
            type="text"
            className="text-input"
            placeholder="https://www.figma.com/design/..."
            value={manualUrl}
            onChange={(e) => setManualUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
          />
          <button type="button" className="button" onClick={handleManualSubmit}>
            Open
          </button>
        </div>
        <p className="input-hint">
          Open a file in Figma, copy the URL from your browser and paste it here.
        </p>
      </div>

      {/* Recent files */}
      {recentFiles.length > 0 && (
        <>
          <div className="divider">recently opened</div>
          <div className="file-list">
            {recentFiles.map((file) => (
              <div key={file.key} className="file-item-row">
                <button
                  type="button"
                  className="file-item"
                  onClick={() => openFile(file.key, file.name)}
                >
                  <div className="file-icon">F</div>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-date">
                      Opened {new Date(file.openedAt).toLocaleDateString()}
                    </span>
                  </div>
                </button>
                <button
                  type="button"
                  className="remove-button"
                  title="Remove from recent"
                  onClick={(e) => handleRemoveRecent(e, file.key)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Team file browser */}
      {teamId ? (
        <>
          <div className="divider">browse team files</div>
          {loadingProjects && <p className="loading">Loading projects…</p>}
          {projects.length > 0 && (
            <div className="project-list">
              {projects.map((project) => (
                <button
                  key={project.id}
                  type="button"
                  className={`project-item ${selectedProject?.id === project.id ? "selected" : ""}`}
                  onClick={() => handleSelectProject(project)}
                >
                  <span className="project-icon">📁</span>
                  {project.name}
                </button>
              ))}
            </div>
          )}
          {selectedProject && (
            <div className="file-list">
              <h3>{selectedProject.name}</h3>
              {loadingFiles && <p className="loading">Loading files…</p>}
              {subfolders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  className="project-item"
                  onClick={() => handleSelectProject(folder)}
                >
                  <span className="project-icon">📁</span>
                  {folder.name}
                </button>
              ))}
              {files.map((file) => (
                <div key={file.key} className="file-item-row">
                  <button
                    type="button"
                    className="file-item"
                    onClick={() => openFile(file.key, file.name)}
                  >
                    {file.thumbnail_url ? (
                      <img src={file.thumbnail_url} alt="" className="file-thumb" />
                    ) : (
                      <div className="file-icon">F</div>
                    )}
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      {file.last_modified && (
                        <span className="file-date">
                          Last modified: {new Date(file.last_modified).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        recentFiles.length === 0 && (
          <div className="team-hint">
            <strong>Want to browse all your Figma files?</strong>
            <p>
              Add <code>figmaTeamId</code> to the custom app parameters to browse your team's projects and files.
              You can find your Team ID in the Figma URL when viewing your team:{" "}
              <code>figma.com/files/team/<strong>TEAM_ID</strong>/...</code>
            </p>
          </div>
        )
      )}

      {error && <p className="error-message">{error}</p>}
    </div>
  );
};

export default FileBrowser;
