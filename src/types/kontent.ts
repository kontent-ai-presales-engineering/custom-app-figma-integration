export type KontentElementType = "text" | "asset" | "rich_text" | "number" | "date_time" | "url_slug";

export interface KontentElementDefinition {
  readonly name: string;
  readonly codename: string;
  readonly type: KontentElementType;
}

export interface CreateContentTypeRequest {
  readonly name: string;
  readonly codename: string;
  readonly elements: readonly KontentElementDefinition[];
}

export interface ContentTypeReference {
  readonly id: string;
  readonly codename: string;
}

export interface CreateContentItemRequest {
  readonly name: string;
  readonly type: { readonly codename: string };
}

export interface CreatedContentItem {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly type: ContentTypeReference;
}

export interface VariantElementValue {
  readonly element: { readonly codename: string };
  readonly value: string | readonly unknown[];
}

export interface UpsertVariantRequest {
  readonly elements: readonly VariantElementValue[];
}

export interface KontentLanguage {
  readonly id: string;
  readonly name: string;
  readonly codename: string;
  readonly is_default: boolean;
}
