const pmScheduleService = require('../services/pmScheduleService');

exports.getAllSchedules = async (req, res) => {
    try {
        const schedules = await pmScheduleService.getAllSchedules();
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getScheduleById = async (req, res) => {
    try {
        const schedule = await pmScheduleService.getScheduleById(req.params.id);
        res.status(200).json({ success: true, data: schedule });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

// Controller สำหรับดึงประวัติด้วย SN
exports.getSchedulesByEquipmentSn = async (req, res) => {
    try {
        const schedules = await pmScheduleService.getSchedulesByEquipmentSn(req.params.sn);
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.createSchedule = async (req, res) => {
    try {
        const newSchedule = await pmScheduleService.createSchedule(req.body);
        res.status(201).json({ success: true, data: newSchedule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateSchedule = async (req, res) => {
    try {
        const updatedSchedule = await pmScheduleService.updateSchedule(req.params.id, req.body);
        res.status(200).json({ success: true, data: updatedSchedule });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteSchedule = async (req, res) => {
    try {
        await pmScheduleService.deleteSchedule(req.params.id);
        res.status(200).json({ success: true, message: 'ลบแผน PM สำเร็จ' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};


exports.bulkUpdate = async (req, res) => {
    try {
        const { ids, updateData } = req.body;
        
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ success: false, message: 'กรุณาส่ง IDs ของรายการที่ต้องการอัปเดต' });
        }

        const result = await pmScheduleService.bulkUpdateSchedules(ids, updateData);
        res.status(200).json({ success: true, message: `อัปเดตสำเร็จ ${result.modifiedCount} รายการ`, data: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};