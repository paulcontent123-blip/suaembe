/** @type {import('next').NextConfig} */
// Dùng .js thay vì .ts — next.config.ts cần gói `typescript` để tự
// transpile lúc server khởi động, nhưng trên hosting chạy Production mode
// (VD Vietnix Node.js Selector), `npm install` tự bỏ qua devDependencies
// (typescript nằm trong đó) → app crash với "Cannot find module
// 'typescript'". Config .js không cần transpile nên tránh được lỗi này.
const nextConfig = {
  /* config options here */
};

module.exports = nextConfig;
