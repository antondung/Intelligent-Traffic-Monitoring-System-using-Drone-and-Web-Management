import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import MainLayout from './layouts/MainLayout';

// Lazy load all pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const LiveMonitoring = lazy(() => import('./pages/LiveMonitoring'));
const AIDetection = lazy(() => import('./pages/AIDetection'));
const ViolationsOCR = lazy(() => import('./pages/ViolationsOCR'));
const TrafficAnalytics = lazy(() => import('./pages/TrafficAnalytics'));
const SystemArchitecture = lazy(() => import('./pages/SystemArchitecture'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-cyan-400/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin" />
          <div className="absolute inset-2 rounded-full border border-transparent border-t-purple-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
        <div className="text-xs font-mono tracking-widest text-slate-500 uppercase">Đang tải mô-đun</div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={
          <Suspense fallback={<LoadingFallback />}>
            <Login />
          </Suspense>
        } />
        <Route path="/register" element={
          <Suspense fallback={<LoadingFallback />}>
            <Register />
          </Suspense>
        } />
        <Route element={<MainLayout />}>
          <Route path="/" element={
            <Suspense fallback={<LoadingFallback />}><Dashboard /></Suspense>
          } />
          <Route path="/monitoring" element={
            <Suspense fallback={<LoadingFallback />}><LiveMonitoring /></Suspense>
          } />
          <Route path="/detection" element={
            <Suspense fallback={<LoadingFallback />}><AIDetection /></Suspense>
          } />
          <Route path="/violations" element={
            <Suspense fallback={<LoadingFallback />}><ViolationsOCR /></Suspense>
          } />
          <Route path="/analytics" element={
            <Suspense fallback={<LoadingFallback />}><TrafficAnalytics /></Suspense>
          } />
          <Route path="/architecture" element={
            <Suspense fallback={<LoadingFallback />}><SystemArchitecture /></Suspense>
          } />
          <Route path="/settings" element={
            <Suspense fallback={<LoadingFallback />}><SettingsPage /></Suspense>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
