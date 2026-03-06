import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'public', // Treat public as the root for Vite
    build: {
        outDir: '../dist',
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'public/index.html'),
                adminDashboard: resolve(__dirname, 'public/admin-dashboard.html'),
                adminLogin: resolve(__dirname, 'public/admin-login.html'),
                driverAuth: resolve(__dirname, 'public/driver-auth.html'),
                driverDashboard: resolve(__dirname, 'public/driver-dashboard.html'),
                report: resolve(__dirname, 'public/report.html')
            }
        }
    }
});
