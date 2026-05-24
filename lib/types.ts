export type Arc = 'imaging' | 'eranshahr' | 'films' | 'writing' | 'system';

export type ArtifactKind = 'page' | 'app' | 'markdown' | 'image' | 'session' | 'study';

export type CascadeStage = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type Artifact = {
  id: string;
  title: string;
  arc: Arc;
  kind: ArtifactKind;
  stage: CascadeStage;

  preview_url?: string;
  preview_image?: string;
  source_path?: string;

  repo_path?: string;
  folder_path?: string;
  source_url?: string;

  last_touched?: string;
  last_session_summary?: string;
  next_action?: string;
  re_entry_summary?: string;

  notes?: string;

  __sidecar_path?: string;
};

export type SessionKind = 'resume' | 'audit' | 'exit' | 'save';

export type ActionRequest =
  | { kind: 'open-folder'; artifact_id: string }
  | { kind: 'open-preview'; artifact_id: string }
  | { kind: SessionKind; artifact_id: string; body?: string };

export type ActionResult = {
  ok: boolean;
  message: string;
  file_path?: string;
  command?: string;
  artifact?: Artifact;
};
