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
        const keys = req.body.keys; 
        
        let keyArray = Array.isArray(keys) ? keys : [keys];
        if (!keys) {
            keyArray = [];
        }
    
        if (files.length !== keyArray.length) {
            return res.status(400).json({ message: 'Đã có lỗi xảy ra trong quá trình upload ảnh, vui lòng thử lại.' });
        }
    
        try {
            let uploadedUrls = {};
    
            await Promise.all(files.map(async (file, index) => {
                try {
                    // Lấy tên file không có phần mở rộng
                    const fileNameWithoutExt = file.originalname.split('.').slice(0, -1).join('.');
                    
                    // Upload tệp vào Cloudinary với public_id không chứa phần mở rộng
                    const result = await cloudinary.uploader.upload(file.path, {
                        public_id: `${Date.now()}-${fileNameWithoutExt}`
                    });
    
                    // Xóa file tạm thời sau khi upload
                    fs.unlinkSync(file.path);

                    // Thêm cặp key-url vào object
                    uploadedUrls[keyArray[index]] = result.secure_url;
                } catch (uploadError) {
                    console.error(`Error uploading file ${file.originalname}:`, uploadError);
                    if (fs.existsSync(file.path)) {
                        fs.unlinkSync(file.path);
                    }
                }
            }));
    
            return res.status(200).json(uploadedUrls);
        } catch (error) {
            console.error('Error in uploadFiles function:', error);
            return res.status(500).json({ message: 'Error uploading files.' });
        }
    });
    
}

module.exports = uploadFiles;