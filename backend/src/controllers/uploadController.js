const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Allowed file types
const ALLOWED_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

// Đảm bảo thư mục uploads tồn tại
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

exports.uploadFile = async (req, res) => {
  try {
    if (!req.files || !req.files.file) {
      return res.status(400).json({
        error: 'No file uploaded',
        message: 'Please upload a file'
      });
    }

    const file = req.files.file;

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
      return res.status(400).json({
        error: 'Invalid file type',
        message: 'Only PDF and Word documents are allowed'
      });
    }

    // Generate unique filename
    const fileExt = path.extname(file.name);
    const fileName = `${uuidv4()}${fileExt}`;
    const uploadPath = path.join(__dirname, '../../uploads', fileName);

    // Move file to uploads directory
    await file.mv(uploadPath);

    res.json({
      message: 'File uploaded successfully',
      fileUrl: `/uploads/${fileName}`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      error: 'Failed to upload file',
      message: error.message
    });
  }
}; 