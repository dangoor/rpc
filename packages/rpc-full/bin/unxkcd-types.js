#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const distDir = path.resolve(__dirname, '../dist');
const baseName = 'wranggle-rpc.d.ts';
fs.copyFileSync(path.join(distDir, `rpc-full/src/${baseName}`), path.join(distDir, baseName));
