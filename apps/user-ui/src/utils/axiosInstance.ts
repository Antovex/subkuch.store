import axios from "axios";

const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
    withCredentials: true,
});

let isRefreshing = false;
let refreshSubscribers: (() => void)[] = [];

// Handle logout and prevent multiple refresh attempts
const handlelogout = () => {
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
};

// handle adding a new access token to the queued requests
const subscribeTokenRefresh = (cb: () => void) => {
    refreshSubscribers.push(cb);
};

// Execute all the queued requests once a new access token is obtained
const onRefreshSuccess = () => {
    refreshSubscribers.forEach((cb) => cb());
    refreshSubscribers = [];
};

// Handle API requests
axiosInstance.interceptors.request.use(
    (config) => config,
    (error) => Promise.reject(error)
);

// Handle expired tokens and refresh them
axiosInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // prevent infinite loops
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    subscribeTokenRefresh(() => {
                        resolve(axiosInstance(originalRequest));
                    });
                });
            }
            originalRequest._retry = true;
            isRefreshing = true;

            try {
                await axios.post(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/refresh-token-user`,
                    {},
                    { withCredentials: true }
                );
                isRefreshing = false;
                onRefreshSuccess();
                return axiosInstance(originalRequest);
            } catch (error) {
                isRefreshing = false;
                refreshSubscribers = [];
                handlelogout();
                return Promise.reject(error);
            }
        }

        return Promise.reject(error);
    }
);

export default axiosInstance;