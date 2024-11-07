const LogModel = require("../../models/logModel");
const ExerciseModel = require("../../models/exerciseModel");

class ExerciseController {
    // Tạo bài tập mới
    static async createExercise(req, res) {
        try {
            const exerciseData = req.body; // Dữ liệu bài tập từ request body
            const log_id = await LogModel.createLog('Tạo bài tập mới', req.user_id);

            const newExerciseId = await ExerciseModel.createExercise(exerciseData);
            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog(`Tạo bài tập thành công với ID: ${newExerciseId}`, log_id);
            return res.status(201).json({ message: "Tạo bài tập thành công.", exercise_id: newExerciseId });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Lấy thông tin bài tập theo ID
    static async getExercise(req, res) {
        try {
            const exerciseId = req.params.id; // Lấy ID từ URL
            const exercise = await ExerciseModel.getExerciseById(exerciseId);

            if (!exercise) {
                return res.status(404).json({ message: "Bài tập không tồn tại." });
            }

            return res.status(200).json({ exercise });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Cập nhật thông tin bài tập
    static async updateExercise(req, res) {
        try {
            const exerciseId = req.params.id; // Lấy ID từ URL
            const exerciseData = req.body; // Dữ liệu cập nhật từ request body
            const log_id = await LogModel.createLog('Cập nhật bài tập', req.user_id);

            const isUpdated = await ExerciseModel.updateExercise(exerciseId, exerciseData);
            if (!isUpdated) {
                await LogModel.updateDetailLog(`Cập nhật bài tập không thành công với ID: ${exerciseId}`, log_id);
                return res.status(400).json({ message: "Cập nhật bài tập không thành công." });
            }

            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog(`Cập nhật bài tập thành công với ID: ${exerciseId}`, log_id);
            return res.status(200).json({ message: "Cập nhật bài tập thành công." });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Xóa bài tập theo ID
    static async deleteExercise(req, res) {
        try {
            const exerciseId = req.params.id; // Lấy ID từ URL
            const log_id = await LogModel.createLog('Xóa bài tập', req.user_id);

            const isDeleted = await ExerciseModel.deleteExercise(exerciseId);
            if (!isDeleted) {
                await LogModel.updateDetailLog(`Không thành công: Bài tập không tồn tại với ID: ${exerciseId}`, log_id);
                return res.status(404).json({ message: 'Không tìm thấy bài tập muốn xóa.' });
            }

            await LogModel.updateStatusLog(log_id);
            await LogModel.updateDetailLog(`Xóa bài tập thành công với ID: ${exerciseId}`, log_id);
            return res.status(200).json({ message: 'Đã xóa bài tập.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    // Lấy tất cả bài tập (nếu cần)
    static async getAllExercises(req, res) {
        try {
            const exercises = await ExerciseModel.getAllExercises();
            return res.status(200).json({ exercises });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = ExerciseController;