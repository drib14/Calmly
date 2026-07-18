require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
  console.log('Using Google DNS (8.8.8.8, 8.8.4.4) for connection resolution.');
} catch (err) {
  console.warn('Warning: Unable to set custom DNS servers, falling back to default resolvers:', err.message);
}

const MONGO_URI = process.env.OLD_MONGO_URI;

async function checkUrls() {
  if (!MONGO_URI) {
    console.error("MONGO_URI is missing from server/.env");
    process.exit(1);
  }

  console.log('Connecting to target database...');
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  console.log('Connected.');

  try {
    const collections = await conn.db.listCollections().toArray();
    console.log(`Checking ${collections.length} collections...`);

    let totalOldUrls = 0;
    let totalNewUrls = 0;
    let otherUrls = 0;

    const fs = require('fs');
    let outputLines = [];

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      const docs = await conn.collection(colName).find({}).toArray();
      
      // Recursive scanner
      function scan(obj, path = '') {
        if (!obj) return;
        if (typeof obj === 'string') {
          if (obj.includes('cloudinary.com')) {
            const line = `[Found URL] Collection: "${colName}", Path: "${path}", Value: "${obj}"`;
            outputLines.push(line);
            console.log(line);
            if (obj.includes('drcuvibon')) {
              totalOldUrls++;
            } else if (obj.includes('dwquuisuj')) {
              totalNewUrls++;
            } else {
              otherUrls++;
            }
          }
        } else if (Array.isArray(obj)) {
          obj.forEach((item, idx) => scan(item, `${path}[${idx}]`));
        } else if (typeof obj === 'object') {
          if (obj._bsontype || obj instanceof Date || (obj.constructor && obj.constructor.name === 'ObjectId')) {
            return;
          }
          for (const key of Object.keys(obj)) {
            scan(obj[key], path ? `${path}.${key}` : key);
          }
        }
      }

      docs.forEach(doc => scan(doc));
    }

    fs.writeFileSync('found_urls.txt', outputLines.join('\n'), 'utf8');
    console.log('\nSaved found URLs to found_urls.txt');

    console.log('\n=======================================');
    console.log(`Scan Summary:`);
    console.log(`- Old Cloudinary URLs (drcuvibon): ${totalOldUrls}`);
    console.log(`- New Cloudinary URLs (dwquuisuj): ${totalNewUrls}`);
    console.log(`- Other Cloudinary URLs: ${otherUrls}`);
    console.log('=======================================');

  } catch (err) {
    console.error('Error scanning database:', err);
  } finally {
    await conn.close();
  }
}

checkUrls();
