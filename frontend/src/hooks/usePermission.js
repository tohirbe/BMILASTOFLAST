// Ruxsatni tekshiruvchi hook
import { useAuth } from '../contexts/AuthContext'

export function usePermission(permission) {
  const { hasPermission } = useAuth()
  return hasPermission(permission)
}