const equipmentService = require('../services/equipmentService');

exports.getAllEquipments = async (req, res) => {
    try {
        const equipments = await equipmentService.getAllEquipments();
        res.status(200).json({ success: true, data: equipments });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.getEquipmentBySn = async (req, res) => {
    try {
        const equipment = await equipmentService.getEquipmentBySn(req.params.sn);
        res.status(200).json({ success: true, data: equipment });
    } catch (error) {
        res.status(404).json({ success: false, message: error.message });
    }
};

exports.createEquipment = async (req, res) => {
    try {
        const newEquipment = await equipmentService.createEquipment(req.body);
        res.status(201).json({ success: true, data: newEquipment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.updateEquipment = async (req, res) => {
    try {
        const updatedEquipment = await equipmentService.updateEquipment(req.params.sn, req.body);
        res.status(200).json({ success: true, data: updatedEquipment });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.deleteEquipment = async (req, res) => {
    try {
        await equipmentService.deleteEquipment(req.params.sn);
        res.status(200).json({ success: true, message: 'ลบอุปกรณ์สำเร็จ' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};