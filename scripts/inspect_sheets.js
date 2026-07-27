const https = require('https');
const fs = require('fs');

const sheetUrl = 'https://docs.google.com/spreadsheets/d/1LfCPZpj5PD1RNZbuAY6tJ_VV2X76iSsbwNHzAVxLs1g/edit';

https.get(sheetUrl, (res) => {
  let data = '';
  res.on('data', (chunk) => (data += chunk));
  res.on('end', () => {
    const matches = [...data.matchAll(/"name":"([^"]+)".*?"sheetId":(\d+)/g)];
    console.log('Found tabs:');
    matches.forEach((m) => {
      console.log(`Tab: "${m[1]}" | GID: ${m[2]}`);
    });
    fs.writeFileSync('scripts/sheet_meta.txt', data);
  });
});
