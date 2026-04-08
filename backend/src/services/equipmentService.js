const Equipment = require('../models/EquipmentModel');

// ดึงข้อมูลอุปกรณ์ทั้งหมด (พร้อมดึงข้อมูล Category มาแสดงด้วย)
exports.getAllEquipments = async () => {
    return await Equipment.find().populate('category');
};

// ดึงข้อมูลอุปกรณ์ตาม SN
exports.getEquipmentBySn = async (sn) => {
    const equipment = await Equipment.findOne({ sn }).populate('category');
    if (!equipment) throw new Error('ไม่พบอุปกรณ์ที่มี SN นี้');
    return equipment;
};

// สร้างอุปกรณ์ใหม่
exports.createEquipment = async (data) => {
    // เช็คว่า SN ซ้ำไหม
    const existing = await Equipment.findOne({ sn: data.sn });
    if (existing) throw new Error('อุปกรณ์ที่มี SN นี้มีอยู่ในระบบแล้ว');
    
    return await Equipment.create(data);
};

// อัปเดตข้อมูลอุปกรณ์ด้วย SN
exports.updateEquipment = async (sn, data) => {
    const equipment = await Equipment.findOneAndUpdate({ sn }, data, { 
        returnDocument: 'after',
        runValidators: true 
    });
    if (!equipment) throw new Error('ไม่พบอุปกรณ์ที่ต้องการอัปเดต');
    return equipment;
};

// ลบอุปกรณ์ด้วย SN
exports.deleteEquipment = async (sn) => {
    const equipment = await Equipment.findOneAndDelete({ sn });
    if (!equipment) throw new Error('ไม่พบอุปกรณ์ที่ต้องการลบ');
    return equipment;
};