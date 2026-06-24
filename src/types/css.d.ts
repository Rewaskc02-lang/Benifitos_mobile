// Allow CSS module imports in TypeScript
declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Allow side-effect CSS imports (e.g., import './global.css')
declare module '*.css' {
  export {};
}
