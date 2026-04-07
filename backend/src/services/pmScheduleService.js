const PmSchedule = require('../models/PMScheduleModel');

// ดึงข้อมูลแผน PM ทั้งหมด
exports.getAllSchedules = async () => {
    return await PmSchedule.find();
};

// ดึงข้อมูลแผน PM ตาม ID ของรายการนั้นๆ
exports.getScheduleById = async (id) => {
    const schedule = await PmSchedule.findById(id);
    if (!schedule) throw new Error('ไม่พบข้อมูลแผน PM นี้');
    return schedule;
};

// ดึงประวัติแผน PM ทั้งหมดของอุปกรณ์เครื่องนั้น (ค้นหาด้วย SN)
exports.getSchedulesByEquipmentSn = async (sn) => {
    return await PmSchedule.find({ equipmentSn: sn }).sort({ planDate: 1 }); // เรียงจากวันที่น้อยไปมาก
};

// สร้างแผน PM ใหม่
exports.createSchedule = async (data) => {
    return await PmSchedule.create(data);
};

// อัปเดตข้อมูลแผน PM (เช่น อัปเดตสถานะเป็น Completed, ใส่ค่าใช้จ่ายจริง)
exports.updateSchedule = async (id, data) => {
    const schedule = await PmSchedule.findByIdAndUpdate(id, data, {
        new: true,
        runValidators: true
    });
    if (!schedule) throw new Error('ไม่พบข้อมูลที่ต้องการอัปเดต');
    return schedule;
};

// ลบแผน PM
exports.deleteSchedule = async (id) => {
    const schedule = await PmSchedule.findByIdAndDelete(id);
    if (!schedule) throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
    return schedule;
};

// pmScheduleService.js (เพิ่มต่อท้าย)

exports.bulkUpdateSchedules = async (ids, data) => {
    // ใช้ updateMany เพื่อหา _id ที่อยู่ใน array ids แล้วทำการ set ค่าใหม่
    const result = await PmSchedule.updateMany(
        { _id: { $in: ids } }, 
        { $set: data }
    );
    return result;
};