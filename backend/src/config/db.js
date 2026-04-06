const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'PM_Thaiyazaki', // 👈 ใส่ชื่อ Database ที่คุณต้องการตรงนี้เลย
            family: 4 
        });
        console.log(`MongoDB Connected to DB: ${conn.connection.db.databaseName}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;