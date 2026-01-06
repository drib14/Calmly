const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

let upload;

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn("Cloudinary env vars missing. Falling back to memory storage.");
  const storage = multer.memoryStorage();
  upload = multer({ storage });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
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
