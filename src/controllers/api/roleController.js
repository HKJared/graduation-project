const RoleModel = require("../../models/roleModel");
const UserModel = require("../../models/userModel");
const LogModel = require('../../models/logModel');

class RoleController {
    static async getRolePermissions(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id;
            
            await LogModel.updateDetailLog('Lấy danh sách quyền hạn', log_id);

            const user = await UserModel.getUserById(user_id);

            const permissions = await RoleModel.getPermissionsByRoleId(user.role_id);

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ permissions: permissions });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = RoleController