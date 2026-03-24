declare module '@react-pdf/renderer' {
  import type {
    ComponentType,
    ReactElement,
    ReactNode,
  } from 'react';

  export interface BaseElementProps {
    style?: unknown;
    children?: ReactNode;
  }

  export interface DocumentProps extends BaseElementProps {
    title?: string;
  }

  export interface PageProps extends BaseElementProps {
    size?: 'A4' | 'LETTER' | string;
  }

  export interface TextProps extends BaseElementProps {}

  export interface ViewProps extends BaseElementProps {}

  export const Document: ComponentType<DocumentProps>;
  export const Page: ComponentType<PageProps>;
  export const Text: ComponentType<TextProps>;
  export const View: ComponentType<ViewProps>;

  export const StyleSheet: {
    create<T extends Record<string, Record<string, unknown>>>(styles: T): T;
  };

  export function renderToBuffer(document: ReactElement): Promise<Uint8Array>;
}
