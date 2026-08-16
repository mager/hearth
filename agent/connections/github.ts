import { defineMcpClientConnection } from "eve/connections";

export default defineMcpClientConnection({
  url: "https://api.githubcopilot.com/mcp/",
  description:
    "GitHub (mager): repositories, issues, pull requests, code search, and CI/CD for mager's web properties (magerblog, beatbrain, prxps, loooom, kotsu).",
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN!}`,
  },
});
