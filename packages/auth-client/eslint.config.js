import { config as reactInternal } from "@workspace/eslint-config/react-internal"

export default [
  ...reactInternal,
  {
    ignores: ["node_modules/**"],
  },
]
