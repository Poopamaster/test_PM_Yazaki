const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

const equipmentRoutes = require('./routes/EquipmetRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const pmScheduleRoutes = require('./routes/pmScheduleRoutes');

app.use('/api/equipment', equipmentRoutes);
app.use('/api/category', categoryRoutes);
app.use('/api/pm-schedule', pmScheduleRoutes);

module.exports = app;