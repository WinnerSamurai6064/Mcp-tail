// MCP endpoint (stateless JSON-RPC over HTTP). Connector URL: https://YOUR-APP.vercel.app/api/mcp
const MIME = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
};

const TOOLS = [
  {
    name: "list_images",
    description: "List all image filenames in the image repository.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "view_image",
    description:
      "View an image by filename. If no name is given, returns the most recent image (last alphabetically).",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string", description: "Image filename" } },
    },
  },
];

async function getManifest(origin) {
  const r = await fetch(`${origin}/manifest.json`);
  if (!r.ok) throw new Error("Could not load manifest");
  return r.json();
}

async function callTool(name, args, origin) {
  const files = await getManifest(origin);

  if (name === "list_images") {
    return {
      content: [{ type: "text", text: files.length ? files.join("\n") : "No images yet." }],
    };
  }

  if (name === "view_image") {
    const file = args?.name || files[files.length - 1];
    if (!file || !files.includes(file)) {
      return {
        isError: true,
        content: [{ type: "text", text: `Image not found: ${file || "(none)"}` }],
      };
    }
    const r = await fetch(`${origin}/images/${encodeURIComponent(file)}`);
    if (!r.ok) throw new Error("Could not load image");
    const buf = Buffer.from(await r.arrayBuffer());
    const ext = file.split(".").pop().toLowerCase();
    return {
      content: [
        { type: "text", text: file },
        { type: "image", data: buf.toString("base64"), mimeType: MIME[ext] || "image/png" },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Accept, Authorization, Mcp-Session-Id, Mcp-Protocol-Version"
  );

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });

  const msg = req.body || {};
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const origin = `https://${host}`;

  // Notifications have no id and need no reply
  if (msg.id === undefined) return res.status(202).end();

  const reply = (result) => res.status(200).json({ jsonrpc: "2.0", id: msg.id, result });
  const fail = (code, message) =>
    res.status(200).json({ jsonrpc: "2.0", id: msg.id, error: { code, message } });

  try {
    switch (msg.method) {
      case "initialize":
        return reply({
          protocolVersion: msg.params?.protocolVersion || "2025-03-26",
          capabilities: { tools: {} },
          serverInfo: { name: "image-repository", version: "1.0.0" },
        });
      case "ping":
        return reply({});
      case "tools/list":
        return reply({ tools: TOOLS });
      case "tools/call":
        return reply(await callTool(msg.params?.name, msg.params?.arguments, origin));
      default:
        return fail(-32601, `Method not found: ${msg.method}`);
    }
  } catch (e) {
    return fail(-32000, e.message);
  }
};
