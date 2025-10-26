import { defineDocumentType, makeSource } from "contentlayer/source-files";

export const DocPage = defineDocumentType(() => ({
  name: "DocPage",
  filePathPattern: "**/*.mdx",
  contentType: "mdx",
  fields: {
    title: { type: "string", required: true },
    description: { type: "string", required: false },
    order: { type: "number", required: false }
  },
  computedFields: {
    slug: {
      type: "string",
      resolve: (doc) => doc._raw.flattenedPath
    },
    url: {
      type: "string",
      resolve: (doc) => `/docs/${doc._raw.flattenedPath}`
    }
  }
}));

export default makeSource({
  contentDirPath: "content/docs",
  documentTypes: [DocPage]
});
