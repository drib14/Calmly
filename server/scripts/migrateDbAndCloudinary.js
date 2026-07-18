const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

// Migration Configuration
const OLD_MONGO_URI = 'mongodb+srv://jhondrib:jhondrib@cluster1.gcx5yt0.mongodb.net/Calmly?retryWrites=true&w=majority&appName=Cluster1';
const NEW_MONGO_URI = 'mongodb://sheikha:sheikha@ac-widk2dh-shard-00-00.5sycajj.mongodb.net:27017,ac-widk2dh-shard-00-01.5sycajj.mongodb.net:27017,ac-widk2dh-shard-00-02.5sycajj.mongodb.net:27017/Calmly?ssl=true&replicaSet=atlas-p74rb7-shard-0&authSource=admin&appName=Systematize';

const OLD_CLOUD_NAME = 'drcuvibon';
const NEW_CLOUD_NAME = 'dwquuisuj';
const NEW_API_KEY = '655351295167741';
const NEW_API_SECRET = 'F0UAKwbXYzDbcTbFr43iwL0D0qQ';

// Initialize the new Cloudinary connection
cloudinary.config({
  cloud_name: NEW_CLOUD_NAME,
  api_key: NEW_API_KEY,
  api_secret: NEW_API_SECRET
});

// Cache for migrated URLs to avoid re-uploading the same file multiple times
const urlCache = new Map();

async function migrateCloudinaryUrl(url) {
  // Check if we already migrated this URL
  if (urlCache.has(url)) {
    return urlCache.get(url);
  }

  // Parse the Cloudinary resource type and public ID
  // e.g. res.cloudinary.com/drcuvibon/image/upload/v12345/calmly_uploads/abc.png
  // Matches: resource_type (image/video/raw) and public_id (calmly_uploads/abc) without extension
  const regex = /res\.cloudinary\.com\/drcuvibon\/(image|video|raw)\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/;
  const match = url.match(regex);

  if (match) {
    const resourceType = match[1];
    const publicId = match[2];

    console.log(`[Cloudinary] Migrating file: ${publicId} (type: ${resourceType})...`);
    
    try {
      const result = await cloudinary.uploader.upload(url, {
        public_id: publicId,
        resource_type: resourceType,
        invalidate: true
      });

      console.log(`[Cloudinary] Successfully uploaded. New URL: ${result.secure_url}`);
      urlCache.set(url, result.secure_url);
      return result.secure_url;
    } catch (err) {
      console.error(`[Cloudinary] ERROR uploading ${url}:`, err.message);
      throw err;
    }
  }

  return url;
}

async function migrateObject(obj) {
  if (obj === null || obj === undefined) return obj;

  if (typeof obj === 'string') {
    // If it contains the old Cloudinary host, migrate it
    if (obj.includes(`res.cloudinary.com/${OLD_CLOUD_NAME}`)) {
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
    // Preserve MongoDB ObjectID, Dates, and other BSON types
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

async function startMigration() {
  console.log('Starting Migration process...');
  
  console.log('Connecting to Source Database (Old)...');
  const sourceConn = await mongoose.createConnection(OLD_MONGO_URI).asPromise();
  console.log('Connected to Source Database.');

  console.log('Connecting to Target Database (New)...');
  const targetConn = await mongoose.createConnection(NEW_MONGO_URI).asPromise();
  console.log('Connected to Target Database.');

  try {
    const collections = await sourceConn.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source database.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      
      // Skip system collections
      if (colName.startsWith('system.')) {
        continue;
      }

      console.log(`\n--------------------------------------------`);
      console.log(`Processing Collection: "${colName}"`);
      console.log(`--------------------------------------------`);

      const sourceCol = sourceConn.collection(colName);
      const targetCol = targetConn.collection(colName);

      // Clean target collection
      console.log(`Clearing collection "${colName}" in target database...`);
      await targetCol.deleteMany({});

      // Read source documents
      const docs = await sourceCol.find({}).toArray();
      console.log(`Found ${docs.length} documents in source collection.`);

      if (docs.length === 0) {
        console.log(`No documents to copy for "${colName}".`);
        continue;
      }

      // Migrate each document
      const migratedDocs = [];
      for (let i = 0; i < docs.length; i++) {
        const doc = docs[i];
        console.log(`Migrating document ${i + 1}/${docs.length} (ID: ${doc._id})...`);
        const migratedDoc = await migrateObject(doc);
        migratedDocs.push(migratedDoc);
      }

      // Insert migrated documents
      console.log(`Inserting ${migratedDocs.length} migrated documents into target...`);
      await targetCol.insertMany(migratedDocs);
      console.log(`Collection "${colName}" migration completed.`);
    }

    console.log('\n============================================');
    console.log('MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('============================================');
  } catch (error) {
    console.error('\nMIGRATION FAILED:', error);
  } finally {
    await sourceConn.close();
    await targetConn.close();
    console.log('Database connections closed.');
  }
}

startMigration();
