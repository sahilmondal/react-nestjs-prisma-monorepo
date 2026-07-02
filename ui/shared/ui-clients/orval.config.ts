import { defineConfig } from "orval"

export default defineConfig({
  api: {
    input: {
      target: "../../../api/http-api/openapi.json",
    },
    output: {
      mode: "tags-split",
      target: "./src/generated/",
      schemas: "./src/generated/model",
      client: "react-query",
      httpClient: "axios",
      override: {
        mutator: {
          path: "./src/custom-client.ts",
          name: "customInstance",
        },
      },
    },
  },
})
