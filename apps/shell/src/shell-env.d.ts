declare module "*.css";

interface ImportMeta {
  readonly env: {
    readonly DEV: boolean;
  };
}

declare const __UVCP_DEV_FAILURE__: string;
