import { LayoutGroup } from 'framer-motion'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../modules/auth/AuthProvider'
import ProtectedRoute from '../modules/auth/ProtectedRoute'
import { IntroProvider } from '../modules/intro/IntroContext'
import LogoIntro from '../modules/intro/LogoIntro'
import { ToastProvider } from '../shared/ui/Toast'
import ScrollToTop from './ScrollToTop'
import PublicLayout from '../shared/layouts/PublicLayout'
import AdminLayout from '../shared/layouts/AdminLayout'
import HomePage from '../modules/accueil/HomePage'
import ConvoisPage from '../modules/convois/ConvoisPage'
import ConvoiDetailPage from '../modules/convois/ConvoiDetailPage'
import CroisadesPage from '../modules/croisades/CroisadesPage'
import { LoginPage, RegisterPage } from '../modules/auth/AuthPages'
import MonEspacePage from '../modules/reservations/MonEspacePage'
import RecuPage from '../modules/paiements/RecuPage'
import DashboardPage from '../modules/dashboard/DashboardPage'
import ReservationsAdminPage from '../modules/reservations/ReservationsAdminPage'
import PaiementsAdminPage from '../modules/paiements/PaiementsAdminPage'
import UtilisateursPage from '../modules/utilisateurs/UtilisateursPage'
import { ConducteursAdmin, ConvoisAdmin, CroisadesAdmin, VehiculesAdmin } from '../modules/admin/ResourcePages'

const ADMIN = ['admin']

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <AuthProvider>
        <ToastProvider>
          <IntroProvider>
            <LayoutGroup>
              <LogoIntro />
              <Routes>
                <Route element={<PublicLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="convois" element={<ConvoisPage />} />
                  <Route path="convois/:id" element={<ConvoiDetailPage />} />
                  <Route path="croisades" element={<CroisadesPage />} />
                  <Route path="connexion" element={<LoginPage />} />
                  <Route path="inscription" element={<RegisterPage />} />
                  <Route path="mon-espace" element={<ProtectedRoute><MonEspacePage /></ProtectedRoute>} />
                  <Route path="recu/:id" element={<ProtectedRoute><RecuPage /></ProtectedRoute>} />
                </Route>
                <Route path="admin" element={<ProtectedRoute roles={ADMIN}><AdminLayout /></ProtectedRoute>}>
                  <Route index element={<DashboardPage />} />
                  <Route path="reservations" element={<ReservationsAdminPage />} />
                  <Route path="paiements" element={<PaiementsAdminPage />} />
                  <Route path="convois" element={<ConvoisAdmin />} />
                  <Route path="croisades" element={<CroisadesAdmin />} />
                  <Route path="vehicules" element={<VehiculesAdmin />} />
                  <Route path="conducteurs" element={<ConducteursAdmin />} />
                  <Route path="utilisateurs" element={<UtilisateursPage />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </LayoutGroup>
          </IntroProvider>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
