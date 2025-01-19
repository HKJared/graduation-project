const LogModel = require("../../models/logModel");
const RecruitmentModel = require("../../models/recruitmentModel");

class RecruitmentController {
    static async createRecruitment (req, res) {
        try {
            const recruitment = req.body.recruitment;
            const user_id = req.user_id;
            const log_id = req.log_id;
    
            if (!recruitment) {
                await LogModel.updateDetailLog('Không nhận được dữ liệu bài tuyển dụng', log_id);
                return res.status(400).json({ message: 'Không nhận được dữ liệu, vui lòng thử lại.' });
            }
    
            
            await LogModel.updateDetailLog(`Tạo bài tuyển dụng: ${ recruitment.position }`, log_id);
    
            const newRecruitmentId = await RecruitmentModel.createRecruitment(recruitment, user_id);
    
            await LogModel.updateStatusLog(log_id);
    
            return res.status(200).json({ message: 'Tạo bài tuyển dụng thành công.' })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
    
    static async getRecruitments (req, res) {
        try {
            const keyword = req.query.keyword || "";
            const page = req.query.page || 1;
            
            const recruitments = await RecruitmentModel.getRecruitments(keyword, page);
    
            return res.status(200).json({ data: recruitments });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
    
    static async  getRecruitment (req, res) {
        try {
    
            const recruitment_id = req.query.id;
            
            const recruitment = await RecruitmentModel.getRecruitmentById(recruitment_id);
    
            if (!recruitment) {
                return res.status(400).json({ message: 'Không tìm thấy bài tuyển dụng cần chỉnh sửa, vui lòng tải lại trang.' });
            }
    
            return res.status(200).json({ data: recruitment });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
    
    static async updateRecruitment (req, res) {
        try {
            const newDataRecruitment = req.body.newDataRecruitment;
            const user_id = req.user_id;
            const log_id = req.log_id;
    
            if (!newDataRecruitment) {
                await LogModel.updateDetailLog('Không nhận được dữ liệu chỉnh sửa bài tuyển dụng', log_id);
                return res.status(400).json({ message: 'Không nhận được dữ liệu chỉnh sửa, vui lòng thử lại.' });
            }
    
            const recruitment = await RecruitmentModel.getRecruitmentById(newDataRecruitment.id);
            
            if (!recruitment) {
                await LogModel.updateDetailLog('Không tìm thấy bài tuyển dụng cần chỉnh sửa.', log_id);
                return res.status(400).json({ message: 'Không tìm thấy bài tuyển dụng cần chỉnh sửa, vui lòng tải lại trang.' });
            }
    
            await LogModel.updateDetailLog(`Chỉnh sửa bài tuyển dụng: ${ recruitment.position }`, log_id);
    
            await RecruitmentModel.updateRecruitment(newDataRecruitment, user_id);
    
            await LogModel.updateStatusLog(log_id);
    
            return res.status(200).json({ message: 'Chỉnh sửa bài tuyển dụng thành công.' })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
    
    static async deleteRecruitment (req, res) {
        try {
            const recruitment_id = req.body.recruitment_id;
            const user_id = req.user_id;
            const log_id = req.log_id;
    
            if (!recruitment_id) {
                await LogModel.updateDetailLog('Không có id được gửi về', log_id);
                return res.status(400).json({ message: 'Không tìm thấy bài tuyển dụng cần xóa, vui lòng tải lại trang.' });
            }
    
            const recruitment = await RecruitmentModel.getRecruitmentById(recruitment_id);
    
            if (!recruitment) {
                await LogModel.updateDetailLog('Không tìm thấy bài tuyển dụng cần xóa', log_id);
                return res.status(400).json({ message: 'Không tìm thấy bài tuyển dụng cần xóa, vui lòng tải lại trang.' });
            }
    
            await LogModel.updateDetailLog(`Xóa bài tuyển dụng: ${ recruitment.position }`, log_id);
    
            await RecruitmentModel.deleteRecruitment(recruitment_id);
    
            await LogModel.updateStatusLog(log_id);
    
            return res.status(200).json({ message: 'Xóa bài tuyển dụng thành công.' })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = RecruitmentController;