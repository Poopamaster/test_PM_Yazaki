import axiosClient from './axiosclient';

export const pmService = {
    // --- Category API ---
    getAllCategories: () => axiosClient.get('/category'),
    getCategoryById: (id) => axiosClient.get(`/category/${id}`),
    createCategory: (data) => axiosClient.post('/category', data),
    updateCategory: (id, data) => axiosClient.put(`/category/${id}`, data),
    deleteCategory: (id) => axiosClient.delete(`/category/${id}`),

    // --- Equipment API ---
    getAllEquipments: () => axiosClient.get('/equipment'),
    getEquipmentBySn: (sn) => axiosClient.get(`/equipment/${sn}`),
    createEquipment: (data) => axiosClient.post('/equipment', data),
    updateEquipment: (sn, data) => axiosClient.put(`/equipment/${sn}`, data),
    deleteEquipment: (sn) => axiosClient.delete(`/equipment/${sn}`),

    // --- PM Schedule API ---
    getAllSchedules: () => axiosClient.get('/pm-schedule'),
    getSchedulesBySn: (sn) => axiosClient.get(`/pm-schedule/equipment/${sn}`),
    createSchedule: (data) => axiosClient.post('/pm-schedule', data),
    updateSchedule: (id, data) => axiosClient.put(`/pm-schedule/${id}`, data),
    deleteSchedule: (id) => axiosClient.delete(`/pm-schedule/${id}`),
};