const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    interval_months: {
        type: Number,
        required: true
    },
    default_price: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Category', CategorySchema);