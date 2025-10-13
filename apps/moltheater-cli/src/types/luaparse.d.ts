declare module "luaparse" {
  export interface ParseOptions {
    comments?: boolean;
    locations?: boolean;
    luaVersion?: string;
  }

  export interface LuaNode {
    [key: string]: unknown;
  }

  const luaparse: {
    parse(source: string, options?: ParseOptions): LuaNode;
  };

  export default luaparse;
}
