import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface LoginData {
    email: string;
    password: string;
    rememberMe: boolean;
}

export interface SignUpData {
    email: string;
    nickname: string;
    password: string;
}

export const login = async (data: LoginData) => {
    const response = await axios.post(`${API_URL}/auth/login`, data);
    return response.data;
};

export const signUp = async (data: SignUpData) => {
    const response = await axios.post(`${API_URL}/auth/signup`, data);
    return response.data;
}; 