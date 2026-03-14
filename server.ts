import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("beupdated.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    bio TEXT,
    profile_pic TEXT
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    content TEXT,
    media_url TEXT,
    media_type TEXT, -- 'image' or 'video'
    lat REAL,
    lon REAL,
    city TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS news_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    description TEXT,
    url TEXT,
    url_to_image TEXT,
    published_at DATETIME,
    source_name TEXT
  );
`);

// Seed initial user if not exists
const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as { count: number };
if (userCount.count === 0) {
  db.prepare("INSERT INTO users (name, bio, profile_pic) VALUES (?, ?, ?)").run(
    "Guest User",
    "I love staying updated!",
    "https://picsum.photos/seed/user/200"
  );
}

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/user", (req, res) => {
    const user = db.prepare("SELECT * FROM users LIMIT 1").get();
    res.json(user);
  });

  app.post("/api/user/update", (req, res) => {
    const { name, bio, profile_pic } = req.body;
    db.prepare("UPDATE users SET name = ?, bio = ?, profile_pic = ? WHERE id = 1").run(name, bio, profile_pic);
    res.json({ status: "success" });
  });

  app.get("/api/posts", (req, res) => {
    const posts = db.prepare(`
      SELECT posts.*, users.name as user_name, users.profile_pic as user_pic 
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      ORDER BY timestamp DESC
    `).all();
    res.json(posts);
  });

  app.post("/api/posts", (req, res) => {
    const { content, media_url, media_type, lat, lon, city } = req.body;
    const result = db.prepare(`
      INSERT INTO posts (user_id, content, media_url, media_type, lat, lon, city) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(1, content, media_url, media_type, lat, lon, city);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/news", (req, res) => {
    // Mock NewsAPI response
    const mockNews = [
      {
        id: 1,
        title: "Global Tech Summit 2026 Announced",
        description: "The world's leading tech companies will gather in Tokyo to discuss AI ethics and sustainable energy.",
        url: "#",
        url_to_image: "https://picsum.photos/seed/tech/800/400",
        published_at: new Date().toISOString(),
        source_name: "TechDaily"
      },
      {
        id: 2,
        title: "New Space Station Module Successfully Docked",
        description: "International space agencies celebrate a major milestone in orbital construction.",
        url: "#",
        url_to_image: "https://picsum.photos/seed/space/800/400",
        published_at: new Date().toISOString(),
        source_name: "Cosmos News"
      }
    ];
    res.json(mockNews);
  });

  app.get("/api/search", (req, res) => {
    const { q } = req.query;
    const query = `%${q}%`;
    const posts = db.prepare(`
      SELECT posts.*, users.name as user_name, users.profile_pic as user_pic 
      FROM posts 
      JOIN users ON posts.user_id = users.id 
      WHERE city LIKE ? OR users.name LIKE ?
      ORDER BY timestamp DESC
    `).all(query, query);
    res.json(posts);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
