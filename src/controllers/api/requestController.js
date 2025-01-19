const LogModel = require("../../models/logModel");
const RequestModel = require("../../models/requestModel");

class RequestController {
    static async creatRequest (req, res){
        try {
            const request = req.body.request;

            await RequestModel.createRequest(request);

            return res.status(200).json({ message: `Chúng tôi đã nhận được tin nhắn từ bạn và sẽ có phản hồi sớm nhất tới email ${request.email} hoặc số điện thoại ${request.phone_number}` });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getRequests(req, res) {
        try {
            const keyword = req.query.keyword || '';
            const page = req.query.page || 1;

            const requests = await RequestModel.getRequests(keyword, page);

            return res.status(200).json({ data: requests })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async updateRequest(req, res) {
        try {
            const user_id = req.user_id;
            const request_id = req.body.request_id;
            const log_id = req.log_id;
            console.log(req.body, user_id)

            await LogModel.updateDetailLog(`Cập nhật yêu cầu liên hệ số ${request_id}`, log_id);

            await RequestModel.updateRequest(request_id, user_id);

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Cập nhật thành công.' })
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = RequestController;