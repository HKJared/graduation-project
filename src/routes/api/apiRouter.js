const express = require('express');
const { compileCode } = require("../../utils/compileService");

// const VerificationController = require('../../controllers/api/verificationController');

const uploadFiles = require('../../controllers/api/uploadController');

const authenticate = require('../../middlewares/authentication');
const authorize = require('../../middlewares/authorization');

const ElementController = require('../../controllers/api/elementController');

const RoleController = require('../../controllers/api/roleController');

const LogController = require('../../controllers/api/logController');

const apiRouter = express.Router();

// apiRouter.post('/phone-verification', VerificationController.createPhoneVerification);
// apiRouter.put('/phone-verification', VerificationController.phoneVerification);

// upload file
apiRouter.post('/upload', uploadFiles);

// compile
apiRouter.post("/compile", (req, res) => {
    try {
        const { code, input, lang } = req.body;

        // Kiểm tra xem mã nguồn và ngôn ngữ có tồn tại không
        if (!code || !lang) {
            console.log("Thiếu mã nguồn hoặc ngôn ngữ");
            return res.status(400).json({ output: "Thiếu mã nguồn hoặc ngôn ngữ" });
        }

        // Gọi hàm compileCode và xử lý kết quả
        compileCode(lang, code, input, (data) => {
            // Nếu có lỗi từ hàm compileCode, xử lý nó
            if (data && data.output) {
                return res.send(data);
            } else {
                return res.status(500).json({ output: "Có lỗi trong quá trình biên dịch." });
            }
        });
    } catch (error) {
        console.error('Compile error: ' + error);
        return res.status(500).json({ output: "Có lỗi từ phía server." });
    }
});


module.exports = apiRouter;