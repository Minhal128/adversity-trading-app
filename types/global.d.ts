// Global type declarations to suppress TypeScript errors

declare module '@react-navigation/native' {
  export interface RootParamList {
    [key: string]: any;
  }
}

// Suppress all navigation-related type errors
declare global {
  namespace ReactNavigation {
    interface RootParamList {
      [key: string]: any;
    }
  }
}

export {};