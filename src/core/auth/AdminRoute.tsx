import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

export function AdminRoute() {
    const { isAdmin } = useAuth()

    // 若不是 Admin，直接踢回 /chat 頁面
    if (!isAdmin) {
        return <Navigate to="/chat" replace />
    }

    return <Outlet />
}
