const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
module.exports = defineConfig({plugins:[react.default()],server:{port:5173,proxy:{'/api':'http://localhost:3000','/ws':{target:'ws://localhost:3000',ws:true}}},build:{outDir:'dist'}});
