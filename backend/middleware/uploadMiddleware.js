
const multer = require('multer');
const path = require('path');

// File storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      '-' +
      Math.round(Math.random() * 1E9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  }
});

// Allow specific document formats
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    '.pdf',
    '.jpg',
    '.jpeg',
    '.png',
    '.doc',
    '.docx'
  ];

  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF, JPG, PNG and DOC files are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = upload;
