const ts = require('typescript');

module.exports = {
  process(sourceText, sourcePath) {
    const result = ts.transpileModule(sourceText, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2020,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true,
        moduleResolution: ts.ModuleResolutionKind.NodeNext,
        sourceMap: true
      },
      fileName: sourcePath
    });
    return { code: result.outputText, map: result.sourceMapText ?? undefined };
  }
};
