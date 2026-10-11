import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [...nextVitals, ...nextTypescript];

config.push(
  { ignores: ["test-results/**"] },
  {
    files: [
      "components/chart-area-interactive.tsx",
      "components/ui/carousel.tsx",
      "hooks/use-mobile.ts",
    ],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    files: ["test/**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
);

export default config;
