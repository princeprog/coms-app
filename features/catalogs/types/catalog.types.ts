export type CatalogRecord = {
  id: string;
  is_active: boolean;
  [key: string]: unknown;
};

export type CatalogPage<T extends CatalogRecord = CatalogRecord> = {
  items: T[];
  total: number;
  page: number;
  page_size: number;
};

export type CatalogFieldDefinition = {
  key: string;
  label: string;
  type?: "text" | "email" | "textarea" | "choices" | "select" | "checkbox";
  description?: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
  maxLength?: number;
};

export type CatalogDisplayColumn = {
  format?: "currency";
  valueLabels?: Record<string, string>;
  key: string;
  label: string;
};

export type CatalogMutationResult = { ok: true } | { ok: false; error: string };

export type CatalogCreateAction = (
  input: unknown,
) => Promise<CatalogMutationResult>;
export type CatalogUpdateAction = (
  id: string,
  input: unknown,
) => Promise<CatalogMutationResult>;
export type CatalogDeactivateAction = (
  id: string,
) => Promise<CatalogMutationResult>;

export type CatalogManagementProps = {
  setupEnabled?: boolean;
  title: string;
  resourceName: string;
  description: string;
  routePath: string;
  displayColumns: CatalogDisplayColumn[];
  fields: CatalogFieldDefinition[];
  page: CatalogPage;
  search: string;
  activeFilter: "all" | "true" | "false";
  canCreate: boolean;
  canUpdate: boolean;
  canDeactivate: boolean;
  createAction: CatalogCreateAction;
  updateAction: CatalogUpdateAction;
  deactivateAction: CatalogDeactivateAction;
  directoryLayout?: boolean;
  directoryTitle?: string;
  directoryDescription?: string;
  secondaryActions?: React.ReactNode;
  detailsPath?: string;
};
