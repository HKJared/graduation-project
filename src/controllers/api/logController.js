const LogModel = require("../../models/logModel");

class LogController {
    static async getOldLogs(req, res) {
        try {
            let time = req.query.time || new Date();
            time = time.toISOString().replace('T', ' ').replace('Z', '');
    
            const logs = await LogModel.getOldLogs('', time);
    
            return res.status(200).json({ data: logs });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getNewLogs(req, res) {
        try {
            let time = req.query.time || new Date();
            time = time.toISOString().replace('T', ' ').replace('Z', '');
            
            const logs = await LogModel.getNewLogs('', time);
    
            return res.status(200).json({ data: logs });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = LogController;