import { Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage'
import OwnerPackagesPage from './pages/OwnerPackagesPage'
import PackagePage from './pages/PackagePage'

export default function App() {
  return (
    <Routes>
      <Route element={<HomePage />} path="/" />
      <Route element={<OwnerPackagesPage />} path="/packages" />
      <Route element={<PackagePage />} path="/packages/google/highway" />
      <Route element={<OwnerPackagesPage />} path="/packages/:owner" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}
