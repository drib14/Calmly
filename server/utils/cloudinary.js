const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine resource type based on mimetype
    // 'raw' is required for pdf, docx, etc.
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
      // Cloudinary handles 'raw' formats differently (no format conversion), so allowed_formats might be ignored for raw
      // But good to keep for auto
    };
  },
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
