const fs = require('fs');
const path = require('path');
const sharp = require('C:/Users/admin/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
(async () => {
  const basePath = path.join(__dirname, '01-cover-probe.png');
  const base = fs.readFileSync(basePath);
  const {width, height} = await sharp(base).metadata();
  if (width !== 1672 || height !== 941) throw new Error(`Unexpected dimensions ${width}x${height}`);
  const correction = '<rect x="1336" y="510" width="290" height="74" rx="16" fill="#eef8ff" stroke="#d3e7fc"/><text x="1481" y="556" text-anchor="middle" font-family="Microsoft YaHei,SimHei,sans-serif" font-size="27" fill="#101b38">只读副本承担读请求</text>';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">${correction}</svg>`;
  fs.writeFileSync(path.join(__dirname,'01-cover-typography.svg'),svg);
  fs.writeFileSync(path.join(__dirname,'01-cover-editable.svg'),`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}"><image width="${width}" height="${height}" xlink:href="data:image/png;base64,${base.toString('base64')}"/>${correction}</svg>`);
  await sharp(base).composite([{input:Buffer.from(svg)}]).png().toFile(path.join(__dirname,'01-cover-final.png'));
  console.log(JSON.stringify({width,height,correction:'one caption, deterministic SVG typography'}));
})().catch(e=>{console.error(e);process.exit(1)});
