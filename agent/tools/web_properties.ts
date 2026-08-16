import { defineTool } from "eve/tools";
import { z } from "zod";

const PROPERTIES = [
  { id: "magerblog", name: "magerblog", domain: "mager.co", repo: "mager/magerblog" },
  { id: "beatbrain", name: "beatbrain", domain: "beatbrain.xyz", repo: "mager/beatbrain" },
  { id: "prxps", name: "prxps", domain: "prxps.xyz", repo: "mager/prxps" },
  { id: "loooom", name: "loooom", domain: "loooom.xyz", repo: "mager/loooom" },
  { id: "kotsu", name: "kotsu", domain: "kotsu.org", repo: "mager/kotsu" },
] as const;

export default defineTool({
  description:
    "Look up Mager's web properties: their id, name, public domain, and GitHub repo. Use this to resolve a property name to its repo or domain before working on it.",
  inputSchema: z.object({
    property: z
      .enum(["magerblog", "beatbrain", "prxps", "loooom", "kotsu"])
      .optional()
      .describe("The property id to look up. Omit to list all properties."),
  }),
  execute({ property }) {
    if (property) {
      const match = PROPERTIES.find((p) => p.id === property);
      return match ?? { error: `Unknown property: ${property}` };
    }
    return { properties: PROPERTIES };
  },
});
