import { useEffect, useState } from "react";
import type { KontentApi } from "../services/kontentApi.ts";
import type { FigmaFile, FigmaNode } from "../types/figma.ts";
import type { KontentLanguage } from "../types/kontent.ts";
import { buildVariantElements, mapFrameToElements, toCodename } from "../utils/mapping.ts";
import type { MappedElement } from "../utils/mapping.ts";

type ImportStatus = "idle" | "importing" | "success" | "error";

interface EditableElement {
  readonly name: string;
  readonly codename: string;
  readonly type: MappedElement["type"];
  readonly textValue?: string;
  readonly editedName: string;
  readonly editedCodename: string;
  readonly codenameLockedFromName: boolean;
}

interface ImportPanelProps {
  readonly frame: FigmaNode;
  readonly file: FigmaFile;
  readonly kontentApi: KontentApi;
  readonly kontentEnvironmentId: string;
  readonly onBack: () => void;
}

const isValidCodename = (value: string) => /^[a-z][a-z0-9_]*$/.test(value) && value.length <= 60;

const ImportPanel = ({ frame, file, kontentApi, kontentEnvironmentId, onBack }: ImportPanelProps) => {
  const [defaultLanguage, setDefaultLanguage] = useState<KontentLanguage | null>(null);
  const [status, setStatus] = useState<ImportStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ typeCodename: string; itemId: string; itemName: string } | null>(null);

  // Content type name / codename
  const [typeName, setTypeName] = useState(frame.name);
  const [typeCodename, setTypeCodename] = useState(toCodename(frame.name));
  const [typeCodenameLockedFromName, setTypeCodenameLockedFromName] = useState(true);

  // Per-element editable rows
  const [elements, setElements] = useState<readonly EditableElement[]>(() =>
    mapFrameToElements(frame).map((el) => ({
      ...el,
      editedName: el.name,
      editedCodename: el.codename,
      codenameLockedFromName: true,
    })),
  );

  useEffect(() => {
    kontentApi
      .listLanguages()
      .then(({ languages }) => {
        const def = languages.find((l) => l.is_default) ?? languages[0] ?? null;
        setDefaultLanguage(def);
      })
      .catch(() => undefined);
  }, [kontentApi]);

  // ── Content type name / codename handlers ──────────────────
  const handleTypeNameChange = (value: string) => {
    setTypeName(value);
    if (typeCodenameLockedFromName) {
      setTypeCodename(toCodename(value));
    }
  };

  const handleTypeCodenameChange = (value: string) => {
    setTypeCodename(value);
    setTypeCodenameLockedFromName(false);
  };

  const handleTypeCodenameBlur = () => {
    if (typeCodename === "") {
      setTypeCodename(toCodename(typeName));
      setTypeCodenameLockedFromName(true);
    }
  };

  // ── Per-element handlers ────────────────────────────────────
  const updateElement = (index: number, patch: Partial<EditableElement>) => {
    setElements((prev) =>
      prev.map((el, i) => (i === index ? { ...el, ...patch } : el)),
    );
  };

  const handleElementNameChange = (index: number, value: string) => {
    const el = elements[index];
    if (!el) return;
    if (el.codenameLockedFromName) {
      updateElement(index, { editedName: value, editedCodename: toCodename(value) });
    } else {
      updateElement(index, { editedName: value });
    }
  };

  const handleElementCodenameChange = (index: number, value: string) => {
    updateElement(index, { editedCodename: value, codenameLockedFromName: false });
  };

  const handleElementCodenameBlur = (index: number) => {
    const el = elements[index];
    if (!el) return;
    if (el.editedCodename === "") {
      updateElement(index, {
        editedCodename: toCodename(el.editedName),
        codenameLockedFromName: true,
      });
    }
  };

  // ── Validation ──────────────────────────────────────────────
  const typeNameError = typeName.trim() === "" ? "Name is required" : null;
  const typeCodenameError = !isValidCodename(typeCodename)
    ? "Must start with a letter, only a–z, 0–9, _ allowed (max 60)"
    : null;

  const elementErrors = elements.map((el) => ({
    name: el.editedName.trim() === "" ? "Required" : null,
    codename: !isValidCodename(el.editedCodename) ? "Invalid" : null,
  }));

  const hasErrors =
    typeNameError !== null ||
    typeCodenameError !== null ||
    elementErrors.some((e) => e.name !== null || e.codename !== null);

  // ── Import ──────────────────────────────────────────────────
  const handleImport = async () => {
    setStatus("importing");
    setErrorMessage(null);

    try {
      await kontentApi.createContentType({
        name: typeName.trim(),
        codename: typeCodename,
        elements: elements.map((el) => ({
          name: el.editedName.trim(),
          codename: el.editedCodename,
          type: el.type,
        })),
      });

      const item = await kontentApi.createContentItem({
        name: `${file.name} – ${typeName.trim()}`,
        type: { codename: typeCodename },
      });

      const languageCodename = defaultLanguage?.codename ?? "default";
      await kontentApi.upsertVariant(item.id, languageCodename, {
        elements: buildVariantElements(
          elements.map((el) => ({ ...el, codename: el.editedCodename })),
        ),
      });

      setImportResult({ typeCodename, itemId: item.id, itemName: item.name });
      setStatus("success");
    } catch (err: unknown) {
      setErrorMessage(String(err));
      setStatus("error");
    }
  };

  const kontentAppUrl = `https://app.kontent.ai/${kontentEnvironmentId}`;

  if (status === "success" && importResult) {
    return (
      <div className="import-panel">
        <div className="browser-header">
          <button type="button" className="back-button" onClick={onBack}>← Back</button>
          <h2>Import: {frame.name}</h2>
        </div>
        <div className="success-box">
          <h3>Import successful!</h3>
          <p>
            Content type <code>{importResult.typeCodename}</code> and item{" "}
            <strong>{importResult.itemName}</strong> were created.
          </p>
          <div className="result-links">
            <a href={`${kontentAppUrl}/content-types`} target="_blank" rel="noreferrer" className="button button-secondary">
              View Content Types
            </a>
            <a href={`${kontentAppUrl}/content`} target="_blank" rel="noreferrer" className="button">
              View Content Items
            </a>
          </div>
          <button type="button" className="button button-ghost" onClick={onBack} style={{ marginTop: "1rem" }}>
            Import another frame
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="import-panel">
      <div className="browser-header">
        <button type="button" className="back-button" onClick={onBack}>← Back</button>
        <h2>Import: {frame.name}</h2>
      </div>

      {/* ── Content type name / codename ── */}
      <div className="mapping-section">
        <h3>Content Type</h3>
        <div className="type-name-row">
          <div className="field-group">
            <label className="field-label">Name</label>
            <input
              type="text"
              className={`text-input${typeNameError ? " input-error" : ""}`}
              value={typeName}
              onChange={(e) => handleTypeNameChange(e.target.value)}
              disabled={status === "importing"}
            />
            {typeNameError && <span className="field-error">{typeNameError}</span>}
          </div>
          <div className="field-group">
            <label className="field-label">Codename</label>
            <input
              type="text"
              className={`text-input codename-input${typeCodenameError ? " input-error" : ""}`}
              value={typeCodename}
              onChange={(e) => handleTypeCodenameChange(e.target.value)}
              onBlur={handleTypeCodenameBlur}
              disabled={status === "importing"}
            />
            {typeCodenameError && <span className="field-error">{typeCodenameError}</span>}
          </div>
        </div>
      </div>

      {/* ── Elements table ── */}
      <div className="mapping-section">
        <h3>Elements</h3>
        {elements.length === 0 ? (
          <p className="empty-state">No mappable elements found in this frame.</p>
        ) : (
          <table className="mapping-table">
            <thead>
              <tr>
                <th>Figma Layer</th>
                <th>Element Name</th>
                <th>Codename</th>
                <th>Type</th>
                <th>Preview Value</th>
              </tr>
            </thead>
            <tbody>
              {elements.map((el, i) => (
                <tr key={el.codename}>
                  <td className="layer-name">{el.name}</td>
                  <td>
                    <input
                      type="text"
                      className={`text-input table-input${elementErrors[i]?.name ? " input-error" : ""}`}
                      value={el.editedName}
                      onChange={(e) => handleElementNameChange(i, e.target.value)}
                      disabled={status === "importing"}
                    />
                    {elementErrors[i]?.name && (
                      <span className="field-error">{elementErrors[i].name}</span>
                    )}
                  </td>
                  <td>
                    <input
                      type="text"
                      className={`text-input table-input codename-input${elementErrors[i]?.codename ? " input-error" : ""}`}
                      value={el.editedCodename}
                      onChange={(e) => handleElementCodenameChange(i, e.target.value)}
                      onBlur={() => handleElementCodenameBlur(i)}
                      disabled={status === "importing"}
                    />
                    {elementErrors[i]?.codename && (
                      <span className="field-error">{elementErrors[i].codename}</span>
                    )}
                  </td>
                  <td>
                    <span className={`type-badge type-${el.type}`}>{el.type}</span>
                  </td>
                  <td className="preview-value">
                    {el.type === "text" ? (
                      <span>{el.textValue?.slice(0, 60)}{(el.textValue?.length ?? 0) > 60 ? "…" : ""}</span>
                    ) : (
                      <span className="muted">— (upload manually)</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ── */}
      <div className="import-footer">
        {defaultLanguage && (
          <p className="section-label">
            Variant will be created in language: <strong>{defaultLanguage.name}</strong> ({defaultLanguage.codename})
          </p>
        )}
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button
          type="button"
          className="button button-import"
          disabled={status === "importing" || elements.length === 0 || hasErrors}
          onClick={() => void handleImport()}
        >
          {status === "importing" ? "Importing…" : "Import to Kontent.ai"}
        </button>
      </div>
    </div>
  );
};

export default ImportPanel;
