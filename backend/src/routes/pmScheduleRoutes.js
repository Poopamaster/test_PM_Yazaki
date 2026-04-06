const express = require('express');
const router = express.Router();
const pmScheduleController = require('../controllers/pmScheduleController');

// Routes ปกติที่ใช้ ID
router.get('/', pmScheduleController.getAllSchedules);
router.get('/:id', pmScheduleController.getScheduleById);
router.post('/', pmScheduleController.createSchedule);
router.put('/:id', pmScheduleController.updateSchedule);
router.delete('/:id', pmScheduleController.deleteSchedule);

// Route พิเศษสำหรับค้นหาด้วย SN อุปกรณ์ (ตั้ง URL ให้ต่างออกไปเพื่อไม่ให้ชนกับ /:id)
router.get('/equipment/:sn', pmScheduleController.getSchedulesByEquipmentSn);

module.exports = router;