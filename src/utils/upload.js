const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const path = require('path');
require('dotenv').config();

// Cấu hình Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Cấu hình Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'src/uploads/'); // Thư mục lưu trữ tạm thời
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`); // Đổi tên tệp tạm thời
    }
});

const upload = multer({ storage: storage }).any();

// Tách public_id chính xác từ URL
const extractPublicId = (fileUrl) => {
    try {
        const parts = fileUrl.split('/upload/');
        if (parts.length < 2) {
            throw new Error('Invalid Cloudinary URL format');
        }
        
        // Lấy phần sau "upload/" và trước đuôi file
        const pathWithTimestamp = parts[1];
        const publicIdWithExtension = pathWithTimestamp.split('/').slice(1).join('/').split('.')[0];
        
        // Decode URL để xử lý các ký tự mã hóa (%20 -> khoảng trắng)
        const public_id = decodeURIComponent(publicIdWithExtension);
        return public_id;
    } catch (error) {
        console.error('Error extracting public_id:', error);
        throw error;
    }
};

// Hàm xóa tệp từ Cloudinary
async function deleteFileFromCloudinary(fileUrl) {
    try {
        const public_id = extractPublicId(fileUrl);
        console.log(`Extracted public_id: ${public_id}`);
        
        const result = await cloudinary.uploader.destroy(public_id);
        if (result.result === 'ok') {
            console.log(`File with public_id ${public_id} has been deleted successfully.`);
            return { success: true, message: 'File deleted successfully.' };
        } else {
            throw new Error(`Failed to delete file from Cloudinary. Result: ${result.result}`);
        }
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        return { success: false, message: error.message };
    }
}

module.exports = {
    upload,
    cloudinary,
    deleteFileFromCloudinary
};