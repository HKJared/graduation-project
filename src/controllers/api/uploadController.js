const fs = require('fs');
const { upload, cloudinary } = require('../../utils/upload');

// Hàm upload được export từ module
async function uploadFiles(req, res) {
    upload(req, res, async function(err) {
        if (err) {
            console.error('Upload Error:', err); // Log lỗi upload
            return res.status(500).json({ message: 'Error processing files.' });
        }

        const files = req.files;
        const keys = req.body.keys; // Các key từ body, nếu chỉ có một key thì sẽ là string
        
        // Kiểm tra nếu chỉ có một key, chuyển nó thành mảng
        let keyArray = Array.isArray(keys) ? keys : [keys];
        if (!keys) {
            keyArray = [];
        }

        if (files.length !== keyArray.length) {
            return res.status(400).json({ message: 'Đã có lỗi xảy ra trong quá trình upload ảnh, vui lòng thử lại.' });
        }

        try {
            // Khởi tạo object để chứa các cặp key-url
            let uploadedUrls = {};

            await Promise.all(files.map(async (file, index) => {
                try {
                    let result;

                    // Phân loại loại tệp và upload
                    if (file.mimetype.startsWith('image/')) {
                        result = await cloudinary.uploader.upload(file.path, {
                            folder: 'uploads/images',
                            public_id: `${Date.now()}-${file.originalname}`
                        });
                    } else if (file.mimetype.startsWith('video/')) {
                        result = await cloudinary.uploader.upload(file.path, {
                            resource_type: 'video',
                            folder: 'uploads/videos',
                            public_id: `${Date.now()}-${file.originalname}`
                        });
                    } else if (file.mimetype === 'application/pdf' || file.mimetype === 'application/msword' || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || file.mimetype === 'application/vnd.ms-excel' || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                        // Upload tài liệu
                        result = await cloudinary.uploader.upload(file.path, {
                            resource_type: 'raw', // Đối với tài liệu, sử dụng loại raw
                            folder: 'uploads/documents',
                            public_id: `${Date.now()}-${file.originalname}`
                        });
                    } else {
                        throw new Error('Unsupported file type');
                    }

                    // Xóa file tạm thời sau khi upload
                    fs.unlinkSync(file.path);

                    // Thêm cặp key-url vào object
                    uploadedUrls[keyArray[index]] = result.secure_url;
                } catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError); // Log lỗi upload của từng file
                    // Xóa file tạm thời nếu có lỗi
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }));

            return res.status(200).json(uploadedUrls);
        } catch (error) {
            console.error('Error in uploadFiles function:', error); // Log lỗi tổng quát
            return res.status(500).json({ message: 'Error uploading files.' });
        }
    });
}

module.exports = uploadFiles;