require('dotenv').config();
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;
const dns = require('dns');

// Configure custom DNS resolvers for Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (err) {}

const MONGO_URI = process.env.MONGO_URI;
const OLD_CLOUD_NAME = process.env.OLD_CLOUD_NAME || 'drcuvibon';
const NEW_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const NEW_API_KEY = process.env.CLOUDINARY_API_KEY;
const NEW_API_SECRET = process.env.CLOUDINARY_API_SECRET;

// Configure new Cloudinary connection for uploads
cloudinary.config({
  cloud_name: NEW_CLOUD_NAME,
  api_key: NEW_API_KEY,
  api_secret: NEW_API_SECRET
});

const urlCache = new Map();

async function migrateCloudinaryUrl(url) {
  if (urlCache.has(url)) {
    return urlCache.get(url);
  }

  // Parse the public ID and resource type from the URL
  // Matches: resource_type (image/video/raw) and public_id (calmly_uploads/abc)
  const regex = new RegExp(`res\\.cloudinary\\.com\\/${NEW_CLOUD_NAME}\\/(image|video|raw)\\/upload\\/(?:v\\d+\\/)?(.+?)(?:\\.[a-zA-Z0-9]+)?$`);
  const match = url.match(regex);

  if (match) {
    const resourceType = match[1];
    const publicId = match[2];

    // Reconstruct the old Cloudinary URL
    // We append the extension if present in the original URL or reconstruct it cleanly
    const extensionMatch = url.match(/\.[a-zA-Z0-9]+$/);
    const extension = extensionMatch ? extensionMatch[0] : '';
    const oldUrl = `https://res.cloudinary.com/${OLD_CLOUD_NAME}/${resourceType}/upload/${publicId}${extension}`;

    console.log(`[Media Recovery] Reconstructed old URL: ${oldUrl}`);
    console.log(`[Media Recovery] Uploading to new Cloudinary account "${NEW_CLOUD_NAME}" as public_id: "${publicId}"...`);

    try {
      const result = await cloudinary.uploader.upload(oldUrl, {
        public_id: publicId,
        resource_type: resourceType,
        invalidate: true
      });

      console.log(`[Media Recovery] SUCCESS! New URL: ${result.secure_url}`);
      urlCache.set(url, result.secure_url);
      return result.secure_url;
    } catch (err) {
      console.error(`[Media Recovery] FAILED to upload from ${oldUrl}:`, err.message);
      // Return original URL so we don't break the document if it fails
      return url;
    }
  }

  return url;
}

async function migrateObject(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    if (obj.includes(`res.cloudinary.com/${NEW_CLOUD_NAME}`)) {
      return await migrateCloudinaryUrl(obj);
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    const migratedArray = [];
    for (const item of obj) {
      migratedArray.push(await migrateObject(item));
    }
    return migratedArray;
  }

  if (typeof obj === 'object') {
    if (obj._bsontype || obj instanceof Date || (obj.constructor && obj.constructor.name === 'ObjectId')) {
      return obj;
    }

    const migratedObj = {};
    for (const key of Object.keys(obj)) {
      migratedObj[key] = await migrateObject(obj[key]);
    }
    return migratedObj;
  }

  return obj;
}

async function startRecovery() {
  if (!MONGO_URI || !NEW_CLOUD_NAME || !NEW_API_KEY || !NEW_API_SECRET) {
    console.error("Error: Missing required environment variables in server/.env");
    process.exit(1);
  }

  console.log('Connecting to database...');
  const conn = await mongoose.createConnection(MONGO_URI).asPromise();
  console.log('Connected.');

  try {
    const collections = await conn.db.listCollections().toArray();
    console.log(`Scanning ${collections.length} collections for recovery...`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      if (colName.startsWith('system.')) continue;

      console.log(`\nScanning collection: "${colName}"`);
      const col = conn.collection(colName);
      const docs = await col.find({}).toArray();

      for (const doc of docs) {
        const migratedDoc = await migrateObject(doc);
        
        // Update the document if any URLs changed (e.g. version timestamps updated)
        if (JSON.stringify(doc) !== JSON.stringify(migratedDoc)) {
          console.log(`[Database] Updating document: ${doc._id} in "${colName}"`);
          await col.updateOne({ _id: doc._id }, { $set: migratedDoc });
        }
      }
    }

    console.log('\nRecovery complete.');
  } catch (err) {
    console.error('Error during recovery:', err);
  } finally {
    await conn.close();
  }
}

startRecovery();
