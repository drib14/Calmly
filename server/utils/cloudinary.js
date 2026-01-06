const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

let upload;

// Helper to safely get and trim env vars
const getEnv = (key) => (process.env[key] ? process.env[key].trim() : '');

const cloudName = getEnv('CLOUDINARY_CLOUD_NAME');
const apiKey = getEnv('CLOUDINARY_API_KEY');
const apiSecret = getEnv('CLOUDINARY_API_SECRET');

if (!cloudName || !apiKey || !apiSecret) {
  console.warn("Cloudinary env vars missing. Falling back to memory storage.");
  const storage = multer.memoryStorage();
  upload = multer({ storage });
} else {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
  });

  const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
      let resource_type = 'auto';
      if (file.mimetype === 'application/pdf' ||
          file.mimetype.includes('msword') ||
          file.mimetype.includes('officedocument') ||
          file.mimetype.includes('zip') ||
          file.mimetype.includes('rar')) {
          resource_type = 'raw';
      }

      return {
        folder: 'calmly_uploads',
        resource_type: resource_type,
        allowed_formats: ['jpg', 'png', 'jpeg', 'mp4', 'mov', 'webm', 'pdf', 'doc', 'docx', 'txt'],
      };
    },
  });

  upload = multer({ storage: storage });
}

module.exports = { cloudinary, upload };
