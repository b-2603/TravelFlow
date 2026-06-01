import { Suspense, lazy } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const GuideAssignmentsAdmin = lazy(() => import('./pages/Admin/GuideAssignments'));
const ActivityLog = lazy(() => import('./pages/Admin/ActivityLog'));
const AdminBookings = lazy(() => import('./pages/Admin/Bookings'));
const AdminReviews = lazy(() => import('./pages/Admin/ReviewModeration'));
const TourApproval = lazy(() => import('./pages/Admin/TourApproval'));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
const AgentDashboard = lazy(() => import('./pages/Agent/Dashboard'));
const AgentBookings = lazy(() => import('./pages/Agent/Bookings'));
const AgentCustomers = lazy(() => import('./pages/Agent/Customers'));
const AgentCustomerDetail = lazy(() => import('./pages/Agent/CustomerDetail'));
const AgentCreateBooking = lazy(() => import('./pages/Agent/CreateBooking'));
const AgentSupportTickets = lazy(() => import('./pages/Agent/SupportTickets'));
const AgentCustomTours = lazy(() => import('./pages/Agent/CustomTours'));
const GuideDashboard = lazy(() => import('./pages/Guide/Dashboard'));
const GuideNotifications = lazy(() => import('./pages/Guide/Notifications'));
const GuideHistory = lazy(() => import('./pages/Guide/History'));
const AssignmentDetail = lazy(() => import('./pages/Guide/AssignmentDetail'));
const AssignmentSummary = lazy(() => import('./pages/Guide/AssignmentSummary'));
const Payments = lazy(() => import('./pages/Accountant/Payments'));
const AccountantDashboard = lazy(() => import('./pages/Accountant/Dashboard'));
const PaymentDetailAccountant = lazy(() => import('./pages/Accountant/PaymentDetail'));
const Refunds = lazy(() => import('./pages/Accountant/Refunds'));
const AccountantLogs = lazy(() => import('./pages/Accountant/Logs'));
const Reports = lazy(() => import('./pages/Accountant/Reports'));
const Booking = lazy(() => import('./pages/Booking'));
const BookingDetail = lazy(() => import('./pages/BookingDetail'));
const BookingEdit = lazy(() => import('./pages/BookingEdit'));
const Favorites = lazy(() => import('./pages/Favorites'));
const CustomerDashboard = lazy(() => import('./pages/Customer/Dashboard'));
const CustomerCompareTours = lazy(() => import('./pages/Customer/CompareTours'));
const CustomerNotifications = lazy(() => import('./pages/Customer/Notifications'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Assignments = lazy(() => import('./pages/Guide/Assignments'));
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const TourForm = lazy(() => import('./pages/Manager/TourForm'));
const TourDetailManager = lazy(() => import('./pages/Manager/TourDetail'));
const TourListManager = lazy(() => import('./pages/Manager/TourListManager'));
const MyBookings = lazy(() => import('./pages/MyBookings'));
const MySupport = lazy(() => import('./pages/MySupport'));
const PaymentCheckout = lazy(() => import('./pages/PaymentCheckout'));
const PartnerDashboard = lazy(() => import('./pages/Partner/Dashboard'));
const Services = lazy(() => import('./pages/Partner/Services'));
const Profile = lazy(() => import('./pages/Profile'));
const Register = lazy(() => import('./pages/Register'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const TourDetail = lazy(() => import('./pages/TourDetail'));
const TourList = lazy(() => import('./pages/TourList'));
const About = lazy(() => import('./pages/About'));
const NewsPromotions = lazy(() => import('./pages/NewsPromotions'));
const NewsPromotionDetail = lazy(() => import('./pages/NewsPromotionDetail'));
const NewsPromotionsManager = lazy(() => import('./pages/Admin/NewsPromotionsManager'));
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
          <Route path="/about" element={<About />} />
          <Route path="/news-promotions" element={<NewsPromotions />} />
          <Route path="/news-promotions/:id" element={<NewsPromotionDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<ProtectedRoute allowedRoles={['customer', 'admin', 'tour_manager', 'agent', 'guide', 'partner', 'accountant']} />}>
          <Route path="/booking" element={<Booking />} />
          <Route path="/customer/dashboard" element={<CustomerDashboard />} />
          <Route path="/compare-tours" element={<CustomerCompareTours />} />
          <Route path="/customer/notifications" element={<CustomerNotifications />} />
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
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/guide-assignments" element={<GuideAssignmentsAdmin />} />
              <Route path="/admin/bookings" element={<AdminBookings />} />
              <Route path="/admin/logs" element={<ActivityLog />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['tour_manager', 'admin']} />}>
              <Route path="/manager/tours" element={<TourListManager />} />
              <Route path="/manager/tours/:id" element={<TourDetailManager />} />
              <Route path="/manager/tours/create" element={<TourForm />} />
              <Route path="/manager/tours/:id/edit" element={<TourForm />} />
              <Route path="/manager/news-promotions" element={<NewsPromotionsManager />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['agent']} />}>
              <Route path="/agent/dashboard" element={<AgentDashboard />} />
              <Route path="/agent/customers" element={<AgentCustomers />} />
              <Route path="/agent/customers/:id" element={<AgentCustomerDetail />} />
              <Route path="/agent/bookings" element={<AgentBookings />} />
              <Route path="/agent/create-booking" element={<AgentCreateBooking />} />
              <Route path="/agent/support-tickets" element={<AgentSupportTickets />} />
              <Route path="/agent/custom-tours" element={<AgentCustomTours />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['guide']} />}>
              <Route path="/guide/dashboard" element={<GuideDashboard />} />
              <Route path="/guide/assignments" element={<Assignments />} />
              <Route path="/guide/assignments/:tourId" element={<AssignmentDetail />} />
              <Route path="/guide/assignments/:tourId/:departureDate" element={<AssignmentDetail />} />
              <Route path="/guide/assignments/:tourId/:departureDate/summary" element={<AssignmentSummary />} />
              <Route path="/guide/notifications" element={<GuideNotifications />} />
              <Route path="/guide/history" element={<GuideHistory />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['partner']} />}>
              <Route path="/partner/dashboard" element={<PartnerDashboard />} />
              <Route path="/partner/services" element={<Services />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['accountant']} />}>
              <Route path="/accountant/dashboard" element={<AccountantDashboard />} />
              <Route path="/accountant/payments" element={<Payments />} />
              <Route path="/accountant/payments/:id" element={<PaymentDetailAccountant />} />
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
