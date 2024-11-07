const LogModel = require("../../models/logModel");
const TopicModel = require("../../models/topicModel");
const { validateTopic } = require("../../validators/topicValidator");

class TopicController {
    static async createTopic(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const new_topic = req.body.new_topic;

            const checkTopic = validateTopic(new_topic);

            if (!checkTopic.isValid) {
                await LogModel.updateDetailLog(checkTopic.errors.join('. ') , log_id);

                return res.status(400).json({ message: 'Chủ đề không hợp lệ.', errors: checkTopic.errors.join('. ') });
            }

            new_topic.created_by = user_id;
            const topic_id = await TopicModel.createTopic(new_topic);

            if (!topic_id) {
                await LogModel.updateDetailLog('Tạo chủ đề mới không thành công.', log_id);

                return res.status(400).json({ message: 'Tạo chủ đề mới không thành công.', errors: 'Thêm vào database không thành công.' });
            }

            await LogModel.updateDetailLog('Tạo chủ đề mới thành công.', log_id);
            await LogModel.updateStatusLog(log_id);

            const topic = await this.getTopicById(topic_id);

            return res.status(200).json({ message: 'Tạo chủ đề mới thành công.', topic: topic });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicsByUser(req, res) {
        try {
            const topics = await TopicModel.getNonEditableTopics();

            return req.status(200).json({ topics: topics });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicsByAdmin(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            await LogModel.updateDetailLog('Xem toàn bộ bài tập hệ thống.', log_id);

            const topics = await TopicModel.getTopics();

            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ topics: topics });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getTopicById(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const topic_id = req.query.topic_id;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần xem.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần xem.', errors: 'Không tìm thấy chủ đề cần xem trong database.' });
            }

        } catch (error) {
            
        }
    }

    static async getTopicStatisticsByAdmin(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            await LogModel.updateDetailLog('Xem số liệu thống kê bài tập hệ thống.', log_id);

            const topics = await TopicModel.getTopics();

            await LogModel.updateStatusLog(log_id);
            return res.status(200).json({ topics: topics });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async updateTopic(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;

            const topic_id = req.body.topic_id;
            const updateData = req.body.updateData;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần chỉnh sửa.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần chỉnh sửa.', errors: 'Không tìm thấy chủ đề cần chỉnh sửa trong database.' });
            }

            await LogModel.updateDetailLog(`Cập nhật thông tin chủ đề: ${ topic.name } (ID: ${ topic_id }).` , log_id);

            if (!topic.is_editable) {
                await LogModel.updateDetailLog('Chủ đề không được cho phép cập nhật.' , log_id);

                return res.status(400).json({ message: 'Chủ đề không được cho phép cập nhật.', errors: 'Chủ đề không được cho phép cập nhật (non-editable).' });
            }

            const checkTopic = validateTopic(updateData);

            if (!checkTopic.isValid) {
                await LogModel.updateDetailLog(checkTopic.errors.join('. ') , log_id);

                return res.status(400).json({ message: 'Thông tin mới của chủ đề không hợp lệ.', errors: checkTopic.errors.join('. ') });
            }

            updateData.updated_by = user_id;
            const is_updated = await TopicModel.updateTopic(topic_id, updateData);

            if (!is_updated) {
                await LogModel.updateDetailLog('Cập nhật thông tin chủ đề không thành công.', log_id);

                return res.status(400).json({ message: 'Cập nhật không thành công.', errors: 'Cập nhật database không thành công.' });
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Cập nhật thành công.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async deleteTopic(req, res) {
        try {
            const log_id = req.log_id;

            const topic_id = req.body.topic_id;

            const topic = await TopicModel.getTopicById(topic_id);

            if (!topic) {
                await LogModel.updateDetailLog('Không tìm thấy chủ đề cần xóa.' , log_id);

                return res.status(400).json({ message: 'Không tìm thấy chủ đề cần xóa.', errors: 'Không tìm thấy chủ đề cần xóa trong database.' });
            }

            await LogModel.updateDetailLog(`Xóa chủ đề: ${ topic.name } (ID: ${ topic_id }).` , log_id);

            const is_deleted = await TopicModel.deleteTopic(topic_id);

            if (!is_deleted) {
                await LogModel.updateDetailLog('Xóa chủ đề không thành công.', log_id);

                return res.status(400).json({ message: 'Xóa không thành công.', errors: 'Xóa chủ đề trong database không thành công.' });
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Xóa thành công.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = TopicController