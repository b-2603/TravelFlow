import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const GuideAssignmentsAdmin = lazy(() => import('./pages/Admin/GuideAssignments'));
const ActivityLog = lazy(() => import('./pages/Admin/ActivityLog'));
const AdminBookings = lazy(() => import('./pages/Admin/Bookings'));
const TourApproval = lazy(() => import('./pages/Admin/TourApproval'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const AgentDashboard = lazy(() => import('./pages/Agent/Dashboard'));
const AgentBookings = lazy(() => import('./pages/Agent/Bookings'));
const AgentCustomers = lazy(() => import('./pages/Agent/Customers'));
const AgentCreateBooking = lazy(() => import('./pages/Agent/CreateBooking'));
const Payments = lazy(() => import('./pages/Accountant/Payments'));
const Refunds = lazy(() => import('./pages/Accountant/Refunds'));
const AccountantLogs = lazy(() => import('./pages/Accountant/Logs'));
const Reports = lazy(() => import('./pages/Accountant/Reports'));
const Booking = lazy(() => import('./pages/Booking'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const BookingEdit = lazy(() => import('./pages/BookingEdit'));
const Favorites = lazy(() => import('./pages/Favorites'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Assignments = lazy(() => import('./pages/Guide/Assignments'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const TourForm = lazy(() => import('./pages/Manager/TourForm'));
const TourListManager = lazy(() => import('./pages/Manager/TourListManager'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const MySupport = lazy(() => import('./pages/MySupport'));
const PaymentCheckout = lazy(() => import('./pages/PaymentCheckout'));
const Services = lazy(() => import('./pages/Partner/Services'));
const Profile = lazy(() => import('./pages/Profile'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TourDetail = lazy(() => import('./pages/TourDetail'));
const TourList = lazy(() => import('./pages/TourList'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

function RouteFallback() {
  return (
    <div className="container py-5">
      <div className="alert alert-light border rounded-4 mb-0">Đang tải nội dung...</div>
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/tours" element={<TourList />} />
          <Route path="/tours/:slug" element={<TourDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute allowedRoles={['customer', 'admin', 'tour_manager', 'agent', 'guide', 'partner', 'accountant']} />}>
            <Route path="/booking" element={<Booking />} />
            <Route path="/my-bookings" element={<MyBookings />} />
            <Route path="/my-bookings/:id" element={<BookingDetail />} />
            <Route path="/my-bookings/:id/edit" element={<BookingEdit />} />
            <Route path="/payments/:id" element={<PaymentCheckout />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/my-support" element={<MySupport />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={['admin', 'tour_manager', 'agent', 'guide', 'partner', 'accountant']} />}>
          <Route element={<AdminLayout />}>
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<Dashboard />} />
              <Route path="/admin/users" element={<UserManagement />} />
              <Route path="/admin/tours" element={<TourApproval />} />
              <Route path="/admin/guide-assignments" element={<GuideAssignmentsAdmin />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/logs" element={<ActivityLog />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['tour_manager', 'admin']} />}>
              <Route path="/manager/tours" element={<TourListManager />} />
              <Route path="/manager/tours/create" element={<TourForm />} />
              <Route path="/manager/tours/:id/edit" element={<TourForm />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/customers" element={<AgentCustomers />} />
              <Route path="/agent/bookings" element={<AgentBookings />} />
              <Route path="/agent/create-booking" element={<AgentCreateBooking />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['guide']} />}>
              <Route path="/guide/assignments" element={<Assignments />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
              <Route path="/partner/services" element={<Services />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
              <Route path="/accountant/payments" element={<Payments />} />
              <Route path="/accountant/refunds" element={<Refunds />} />
              <Route path="/accountant/logs" element={<AccountantLogs />} />
              <Route path="/accountant/reports" element={<Reports />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
