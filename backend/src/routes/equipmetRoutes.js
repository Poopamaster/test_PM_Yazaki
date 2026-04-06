const express = require('express');
const router = express.Router();
const equipmentController = require('../controllers/EquipmentController');

router.get('/', equipmentController.getAllEquipments);
router.get('/:sn', equipmentController.getEquipmentBySn);
router.post('/', equipmentController.createEquipment);
router.put('/:sn', equipmentController.updateEquipment);
router.delete('/:sn', equipmentController.deleteEquipment);

module.exports = router;