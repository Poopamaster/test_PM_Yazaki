import axios from 'axios';

const axiosClient = axios.create({
    baseURL: 'http://localhost:5000/api', // ชี้ไปที่ Backend ของเรา
    headers: {
        'Content-Type': 'application/json',
    },
});

export default axiosClient;