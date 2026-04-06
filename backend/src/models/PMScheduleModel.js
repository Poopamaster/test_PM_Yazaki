const { Plane } = require('lucide-react');
const mongoose = require('mongoose');

const PMscheduleSchema = new mongoose.Schema({
    equipmentSN: {
        type: String,
        required: true
    },
    planedDate: {
        type: Date,
        required: true
    },
    actualDate: {
        type: Date
        ,default: null
    },
    operator: {
        type: String,
        default: ""
    },
    actualCost: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Pending', 'Completed', 'Overdue'],
        default: 'Pending'
    },
    require: {
        type: String,
        default: ""
    }
}, {timestamps: true} );

module.exports = mongoose.model('PMschedule', PMscheduleSchema);