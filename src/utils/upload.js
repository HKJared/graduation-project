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

// Hàm xóa tệp từ Cloudinary
async function deleteFileFromCloudinary(fileUrl) {
    if (!fileUrl) {
        return;
    }

    try {        
        // Tách `public_id` và bỏ qua phần `/v{timestamp}/` nếu có
        const parts = fileUrl.split('/upload/');
        if (parts.length < 2) {
            throw new Error('Invalid Cloudinary URL format');
        }

        // Bỏ phần `v{timestamp}/` nếu có
        const publicIdWithTimestamp = parts[1];
        const public_id = publicIdWithTimestamp.replace(/v\d+\/(.+?)\.[^.]+$/, '$1');
        
        // Xóa tệp khỏi Cloudinary
        const result = await cloudinary.uploader.destroy(public_id);
        // console.log(public_id, result)
        if (result.result === 'ok') {
            console.log(`File with public_id ${public_id} has been deleted successfully.`);
            return { success: true, message: 'File deleted successfully.' };
        } else {
            throw new Error('Failed to delete file from Cloudinary.');
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