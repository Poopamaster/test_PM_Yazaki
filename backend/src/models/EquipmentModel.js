const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    sn : {
        type: String,
        required: true,
        unique: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    type: {
        type: String,
        required: true
    },
    brand: {
        type: String,
        required: true
    },
    model: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    zone: {
        type: String,
        required: true
    },
    status: {
        type: String, 
        default: 'Active'
    }
}, {timestamps: true} );

module.exports = mongoose.model('Equipment', equipmentSchema);