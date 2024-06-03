import http from "http";
import fs from "fs";
import { URL } from "url";

const LLAMA_API_URL =
  process.env.LLAMA_API_URL || "http://127.0.0.1:11434/api/generate";

async function llama(question) {
  const method = "POST";
  const headers = {
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({
    model: "orca-mini",
    prompt: question,
    options: {
      num_predict: 200,
      temperature: 0.8,
      top_k: 20,
      top_p: 0.95,
    },
    stream: false,
  });
  const option = { method, headers, body };

  try {
    const res = await fetch(LLAMA_API_URL, option);
    const { response } = await res.json();
    return response.trim();
  } catch (error) {
    console.error("Error fetching from LLAMA API:", error);
    throw error;
  }
}

async function handler(req, res) {
  const { url } = req;

  if (url === "/health") {
    res.writeHead(200);
    res.end("OK");
  } else if (url === "/") {
    fs.readFile("./index.html", (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error loading index.html");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(data);
    });
  } else if (url.startsWith("/chat")) {
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    const question = decodeURIComponent(parsedUrl.search.substring(1));
    if (question === "!clear") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("clear");
    } else {
      try {
        const answer = await llama(question);
        console.log({ question, answer });
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end(answer);
      } catch (error) {
        res.writeHead(500);
        res.end("Error processing request");
      }
    }
  } else {
    res.writeHead(404);
    res.end("Not Found");
  }
}

http.createServer(handler).listen(3000, () => {
  console.log("Server is listening on port 3000");
});
