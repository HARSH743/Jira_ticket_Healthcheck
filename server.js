const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const JIRA_DOMAIN = process.env.JIRA_DOMAIN || "https://zenoti.atlassian.net";
const JIRA_EMAIL = process.env.JIRA_EMAIL || "";
const JIRA_TOKEN = process.env.JIRA_TOKEN || "";

function getAuth() {
  return "Basic " + Buffer.from(`${JIRA_EMAIL}:${JIRA_TOKEN}`).toString("base64");
}

// Proxy: search tasks
app.post("/api/tasks", async (req, res) => {
  try {
    const response = await fetch(`${JIRA_DOMAIN}/rest/api/3/search/jql`, {
      method: "POST",
      headers: {
        "Authorization": getAuth(),
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body)
    });
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Proxy: get comments for a task
app.get("/api/comments/:key", async (req, res) => {
  try {
    const response = await fetch(
      `${JIRA_DOMAIN}/rest/api/3/issue/${req.params.key}/comment?maxResults=20&orderBy=created`,
      {
        headers: {
          "Authorization": getAuth(),
          "Accept": "application/json"
        }
      }
    );
    const data = await response.json();
    if (!response.ok) return res.status(response.status).json(data);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    jira_domain: JIRA_DOMAIN,
    auth_configured: !!(JIRA_EMAIL && JIRA_TOKEN)
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Jira dashboard running on port ${PORT}`));
