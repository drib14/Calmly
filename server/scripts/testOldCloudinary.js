require('dotenv').config();
const cloudinary = require('cloudinary').v2;

const OLD_CLOUD_NAME = process.env.OLD_CLOUD_NAME;
const OLD_API_KEY = process.env.OLD_CLOUDINARY_API_KEY;
const OLD_API_SECRET = process.env.OLD_CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: OLD_CLOUD_NAME,
  api_key: OLD_API_KEY,
  api_secret: OLD_API_SECRET
});

async function testOld() {
  console.log(`Configured old Cloudinary. Cloud: ${OLD_CLOUD_NAME}`);
  try {
    const publicId = 'calmly_uploads/dzqcdmdycy6tss3mjutn';
    console.log(`Fetching details for resource: ${publicId}`);
    
    const result = await cloudinary.api.resource(publicId, { resource_type: 'image' });
    console.log('SUCCESS! Resource details:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('FAILED to fetch resource from old Cloudinary:', err);
  }
}

testOld();
