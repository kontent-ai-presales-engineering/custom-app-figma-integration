interface ConfigErrorProps {
  readonly missing: readonly string[];
}

const ConfigError = ({ missing }: ConfigErrorProps) => (
  <div className="config-error">
    <h2>Custom App Configuration Required</h2>
    <p>
      This app requires the following parameters in the{" "}
      <strong>Custom App JSON configuration</strong> field in Kontent.ai:
    </p>
    <pre className="config-example">{JSON.stringify(
      {
        figmaToken: "figd_your_figma_personal_access_token",
        figmaTeamId: "optional_team_id_for_file_browsing",
        kontentApiKey: "your_kontent_management_api_key",
      },
      null,
      2,
    )}</pre>
    <p style={{ fontSize: "0.8rem", color: "#92400e", marginTop: "0.5rem" }}>
      Note: The Kontent.ai environment ID is read automatically from the app context — no need to configure it here.
    </p>
    {missing.length > 0 && (
      <div className="missing-fields">
        <p>Missing required fields:</p>
        <ul>
          {missing.map((field) => (
            <li key={field}>
              <code>{field}</code>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

export default ConfigError;
