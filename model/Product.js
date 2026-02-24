const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const employeeSchema = new Schema({
    image: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    createdBy: {
        type: String,
        required: false
    }
    ,
    rating: {
        type: Map,
        of: Number,
        default: {
            star: 4.5,
            count: 120
        }
    },
    priceCents: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Employee', employeeSchema);