require('dotenv').config();
const { MongoClient } = require('mongodb');

// Advanced recursive replace that tracks paths to use with $set
function getPathsToUpdate(obj, currentPath = '') {
  let updates = {};

  if (typeof obj === 'string') {
    if (obj.includes('res.cloudinary.com/drcuvibon')) {
      updates[currentPath] = obj.replace(/res\.cloudinary\.com\/drcuvibon/g, 'res.cloudinary.com/dwquuisuj');
    }
  } else if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const newPath = currentPath ? `${currentPath}.${i}` : `${i}`;
      Object.assign(updates, getPathsToUpdate(obj[i], newPath));
    }
  } else if (obj !== null && typeof obj === 'object') {
    // Skip BSON types
    if (obj._bsontype || obj instanceof Date || obj instanceof RegExp) {
      return updates;
    }

    for (const key in obj) {
      if (Object.hasOwnProperty.call(obj, key)) {
        const newPath = currentPath ? `${currentPath}.${key}` : key;
        Object.assign(updates, getPathsToUpdate(obj[key], newPath));
      }
    }
  }

  return updates;
}

async function runMigration() {
  const client = new MongoClient(process.env.MONGO_URI);
  let totalUpdated = 0;

  try {
    await client.connect();
    console.log("Connected successfully to server");
    const db = client.db();
    const collections = await db.collections();

    for (let collection of collections) {
      console.log(`Processing collection: ${collection.collectionName}`);
      let updatedInCollection = 0;

      const cursor = collection.find({});
      while (await cursor.hasNext()) {
        const doc = await cursor.next();

        const updates = getPathsToUpdate(doc);

        if (Object.keys(updates).length > 0) {
           try {
             await collection.updateOne({ _id: doc._id }, { $set: updates });
             updatedInCollection++;
             totalUpdated++;
           } catch(err) {
             console.error(`Error updating doc ${doc._id} in ${collection.collectionName}:`, err);
           }
        }
      }
      if (updatedInCollection > 0) {
        console.log(`Updated ${updatedInCollection} documents in ${collection.collectionName}`);
      }
    }

    console.log(`\nMigration script updated to use $set and dot notation. Total documents capable of being updated: ${totalUpdated}`);

  } catch (e) {
    console.error("Migration failed:", e);
  } finally {
    await client.close();
  }
}

runMigration();
