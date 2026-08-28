// Entry point cho cPanel Node.js Selector (Passenger) — Passenger không tự
// chạy được "next start", phải có 1 file server.js dùng Next.js programmatic
// API, lắng nghe đúng process.env.PORT mà Passenger cấp cho app.
const { createServer } = require("http");
const next = require("next");

const port = process.env.PORT || 3000;
const app = next({ dev: false });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(port, () => {
    console.log("SuaEmbe server ready on port " + port);
  });
});
