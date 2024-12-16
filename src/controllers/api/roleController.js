const RoleModel = require("../../models/roleModel");
const UserModel = require("../../models/userModel");
const LogModel = require('../../models/logModel');

class RoleController {
    static async getRolePermissions(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = await LogModel.createLog('role_permissions', user_id);
            
            await LogModel.updateDetailLog('Lấy danh sách quyền hạn', log_id);

            const user = await UserModel.getUserById(user_id);

            const permissions = await RoleModel.getPermissionsByRoleId(user.role_id) || [];

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ permissions: permissions });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async createRole(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id
            await LogModel.updateDetailLog('Tạo chức vụ mới.', log_id);

            const { name } = req.body;

            if (!name) {
                await LogModel.updateDetailLog('Thiếu thông tin.', log_id);
                return res.status(400).json({ message: 'Vui lòng cung cấp thông tin chức vụ mới.' });
            }

            const old_role = await RoleModel.getRoleByName(name);

            if (old_role) {
                await LogModel.updateDetailLog('Chức vụ đã tồn tại.', log_id);
                return res.status(400).json({ message: 'Chức vụ đã tồn tại, vui lòng nhập tên khác.' });
            }

            const new_role_id = await RoleModel.createRole(name);

            if (!new_role_id) {
                await LogModel.updateDetailLog('Tạo mới không thành công.', log_id);
                return res.status(400).json({ message: 'Tạo mới không thành công, vui lòng thử lại hoặc tải lại trang.' });
            }

            const new_role = await RoleModel.getRoleById(new_role_id);
            new_role.permissions = [];

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Tạo chức vụ mới thành công.', new_role: new_role });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async getRoles(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id
            await LogModel.updateDetailLog('get_roles', log_id);

            const roles = await RoleModel.getAllRoles();

            for (let i = 0; i < roles.length; i++) {
                roles[i].permissions = await RoleModel.getPermissionsByRoleId(roles[i].id) || [];
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ roles });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async updateRole(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id
            await LogModel.updateDetailLog('Chỉnh sửa thông tin chức vụ.', log_id);

            const { id, name } = req.body;

            if (!id || !name) {
                await LogModel.updateDetailLog('Thiếu thông tin.', log_id);
                return res.status(400).json({ message: 'Vui lòng cung cấp thông tin chức vụ muốn cập nhật.' });
            }

            const old_role = await RoleModel.getRoleByName(name);

            if (old_role) {
                await LogModel.updateDetailLog('Tên chức vụ đã được đặt cho một chức vụ khác.', log_id);
                return res.status(400).json({ message: 'Tên chức vụ đã được đặt cho một chức vụ khác, vui lòng nhập tên khác.' });
            }

            const is_updated = await RoleModel.updateRole(id, name);

            if (!is_updated) {
                await LogModel.updateDetailLog('Chỉnh sửa không thành công.', log_id);
                return res.status(400).json({ message: 'Chỉnh sửa không thành công, vui lòng thử lại hoặc tải lại trang.' });
            }

            const new_role = await RoleModel.getRoleById(id);
            new_role.permissions = await RoleModel.getPermissionsByRoleId(id) || [];

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Chỉnh sửa chức vụ thành công.', new_role: new_role });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async updateRolePermissions(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id
            await LogModel.updateDetailLog('Chỉnh sửa quyền hạn chức vụ.', log_id);

            const { id, permission_ids } = req.body;

            if (!id || !permission_ids) {
                await LogModel.updateDetailLog('Thiếu thông tin.', log_id);
                return res.status(400).json({ message: 'Vui lòng cung cấp thông tin chức vụ muốn cập nhật.' });
            }

            await RoleModel.removePermissionsFromRole(id);
            if (permission_ids.length > 0) {
                await RoleModel.addPermissionsToRole(id, permission_ids);
            }

            const new_role = await RoleModel.getRoleById(id);
            new_role.permissions = await RoleModel.getPermissionsByRoleId(id) || [];

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Chỉnh sửa quyền hạn chức vụ thành công.', new_role: new_role });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }

    static async deleteRole(req, res) {
        try {
            const user_id = req.user_id;
            const log_id = req.log_id
            await LogModel.updateDetailLog('Xóa chức vụ.', log_id);

            const { id } = req.body;

            if (!id) {
                await LogModel.updateDetailLog('Thiếu thông tin.', log_id);
                return res.status(400).json({ message: 'Vui lòng cung cấp thông tin chức vụ mới.' });
            }

            const old_role = await RoleModel.getRoleById(id);

            if (!old_role) {
                await LogModel.updateDetailLog('Không tìm thấy chức vụ cần xóa.', log_id);
                return res.status(400).json({ message: 'Không tìm thấy chức vụ cần xóa, vui lòng thử lại hoặc tải lại trang.' });
            }

            const is_deleted = await RoleModel.deleteRole(id);

            if (!is_deleted) {
                await LogModel.updateDetailLog('Xóa không thành công.', log_id);
                return res.status(400).json({ message: 'Xóa không thành công, vui lòng thử lại hoặc tải lại trang.' });
            }

            await LogModel.updateStatusLog(log_id);

            return res.status(200).json({ message: 'Xóa thành công.' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Lỗi từ phía server.' });
        }
    }
}

module.exports = RoleController