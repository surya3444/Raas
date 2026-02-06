import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

// --- LAYOUTS ---
import AdminLayout from './layouts/AdminLayout';
import DeveloperLayout from './layouts/DeveloperLayout';

// --- CONTEXT ---
import { NexusProvider } from './context/NexusContext';

// --- PAGES (SHARED) ---
import LoginPage from './pages/LoginPage';

// --- PAGES (ADMIN) ---
import AdminDevelopers from './pages/AdminDevelopers';
import AdminPlans from './pages/AdminPlans';

// --- PAGES (DEVELOPER - STATIC) ---
import DashboardPage from './pages/DashboardPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';

// --- PAGES (DEVELOPER - INTERACTIVE) ---
import InteractivePage from './pages/InteractivePage';
import InteractiveLayoutPage from './pages/InteractiveLayoutPage';

// --- PAGES (DEVELOPER - NEXUS) ---
import NexusDashboard from './pages/nexus/NexusDashboard';
import NexusLayoutViewer from './pages/nexus/NexusLayoutViewer';
import NexusBlueprintEditor from './pages/nexus/NexusBlueprintEditor';

// --- 🔒 PROTECTED ROUTE COMPONENT ---
const ProtectedRoute = ({ user, allowedRoles, children }) => {
    const location = useLocation();

    // 1. Check if User exists
    if (!user) {
        return <Navigate to="/" state={{ from: location }} replace />;
    }

    // 2. Check Role Access
    if (!allowedRoles.includes(user.role)) {
        // If unauthorized, redirect to their appropriate home
        if (user.role === 'admin') {
            return <Navigate to="/admin" replace />;
        } else if (user.role === 'developer') {
            // Default to Nexus for developers, or change to /static /interactive based on preference
            return <Navigate to="/nexus" replace />;
        } else {
            return <Navigate to="/" replace />;
        }
    }

    // 3. Allow Access
    return children;
};

const App = () => {
    // Retrieve user (ensuring strict role management)
    const user = JSON.parse(localStorage.getItem('rajchavin_user') || 'null');

    return (
        <Router>
            <Routes>
                {/* 1. PUBLIC ROUTE */}
                <Route path="/" element={<LoginPage />} />

                {/* 2. ADMIN ROUTES (Strictly Admin Only) */}
                <Route path="/admin" element={
                    <ProtectedRoute user={user} allowedRoles={['admin']}>
                        <AdminLayout />
                    </ProtectedRoute>
                }>
                    <Route path="developers" element={<AdminDevelopers />} />
                    <Route path="plans" element={<AdminPlans />} />
                    <Route index element={<Navigate to="developers" replace />} />
                </Route>

                {/* 3. DEVELOPER ROUTES (STATIC MODE) */}
                <Route path="/static" element={
                    <ProtectedRoute user={user} allowedRoles={['developer', 'admin']}>
                        <DeveloperLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="layout/:id" element={<ProjectDetailsPage />} />
                </Route>

                {/* 4. DEVELOPER ROUTES (INTERACTIVE MODE) */}
                <Route path="/interactive" element={
                    <ProtectedRoute user={user} allowedRoles={['developer', 'admin']}>
                        <DeveloperLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<InteractivePage />} />
                    <Route path="layout/:id" element={<InteractiveLayoutPage />} />
                </Route>

                {/* 5. NEXUS ROUTES (ADVANCED MODE) */}
                <Route path="/nexus/*" element={
                    <ProtectedRoute user={user} allowedRoles={['developer', 'admin']}>
                        <NexusProvider user={user}>
                            <Routes>
                                <Route index element={<NexusDashboard />} />
                                <Route path="view/:id" element={<NexusLayoutViewer />} />
                                <Route path="design/:id" element={<NexusBlueprintEditor />} />
                                <Route path="editor/:id" element={<Navigate to="../view/:id" replace />} />
                            </Routes>
                        </NexusProvider>
                    </ProtectedRoute>
                } />

                {/* 6. CATCH-ALL (Redirect based on role if logged in, else Login) */}
                <Route path="*" element={
                    user ? (
                        user.role === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/nexus" replace />
                    ) : (
                        <Navigate to="/" replace />
                    )
                } />
            </Routes>
        </Router>
    );
};

export default App;