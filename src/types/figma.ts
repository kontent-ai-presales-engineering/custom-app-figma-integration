export interface FigmaUser {
  readonly id: string;
  readonly email: string;
  readonly handle: string;
  readonly img_url: string;
}

export interface FigmaProject {
  readonly id: string;
  readonly name: string;
}

export interface FigmaProjectFile {
  readonly key: string;
  readonly name: string;
  readonly thumbnail_url?: string;
  readonly last_modified?: string;
}

export type FigmaNodeType =
  | "DOCUMENT"
  | "CANVAS"
  | "FRAME"
  | "GROUP"
  | "COMPONENT"
  | "COMPONENT_SET"
  | "INSTANCE"
  | "TEXT"
  | "RECTANGLE"
  | "ELLIPSE"
  | "VECTOR"
  | "LINE"
  | "BOOLEAN_OPERATION"
  | "SECTION"
  | "STAR"
  | "REGULAR_POLYGON";

export interface FigmaFill {
  readonly type: "IMAGE" | "SOLID" | "GRADIENT_LINEAR" | "GRADIENT_RADIAL" | "GRADIENT_ANGULAR" | "GRADIENT_DIAMOND" | "EMOJI" | "VIDEO";
  readonly imageRef?: string;
  readonly opacity?: number;
  readonly visible?: boolean;
}

export interface FigmaNode {
  readonly id: string;
  readonly name: string;
  readonly type: FigmaNodeType;
  readonly characters?: string;
  readonly fills?: readonly FigmaFill[];
  readonly children?: readonly FigmaNode[];
  readonly visible?: boolean;
}

export interface FigmaPage {
  readonly id: string;
  readonly name: string;
  readonly type: "CANVAS";
  readonly children: readonly FigmaNode[];
}

export interface FigmaFile {
  readonly name: string;
  readonly document: {
    readonly id: string;
    readonly name: string;
    readonly type: "DOCUMENT";
    readonly children: readonly FigmaPage[];
  };
  readonly lastModified: string;
  readonly thumbnailUrl: string;
}
