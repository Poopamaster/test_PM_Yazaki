// เช็คชื่อไฟล์ Model ให้ตรงกับที่คุณตั้งไว้นะครับ (ในตัวอย่างก่อนหน้าผมให้ตั้งว่า Category.js)
const Category = require('../models/Categorymodel'); 

// ดึงข้อมูลกลุ่มอุปกรณ์ทั้งหมด
exports.getAllCategories = async () => {
    return await Category.find();
};

// ดึงข้อมูลกลุ่มอุปกรณ์ตาม ID
exports.getCategoryById = async (id) => {
    const category = await Category.findById(id);
    if (!category) throw new Error('ไม่พบข้อมูลกลุ่มอุปกรณ์นี้');
    return category;
};

// สร้างกลุ่มอุปกรณ์ใหม่
exports.createCategory = async (data) => {
    // ป้องกันการสร้างชื่อกลุ่มซ้ำ (เช่น มี PRINTER อยู่แล้ว จะไม่ให้สร้าง PRINTER อีก)
    const existing = await Category.findOne({ name: data.name });
    if (existing) throw new Error('ชื่อกลุ่มอุปกรณ์นี้มีอยู่ในระบบแล้ว');

    return await Category.create(data);
};

// อัปเดตข้อมูลกลุ่มอุปกรณ์
exports.updateCategory = async (id, data) => {
    const category = await Category.findByIdAndUpdate(id, data, {
        new: true, // คืนค่า document ที่อัปเดตแล้ว
        runValidators: true
    });
    if (!category) throw new Error('ไม่พบข้อมูลที่ต้องการอัปเดต');
    return category;
};

// ลบกลุ่มอุปกรณ์
exports.deleteCategory = async (id) => {
    const category = await Category.findByIdAndDelete(id);
    if (!category) throw new Error('ไม่พบข้อมูลที่ต้องการลบ');
    return category;
};