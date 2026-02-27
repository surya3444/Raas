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
        if (user.role === 'admin') return <Navigate to="/admin" replace />;
        if (user.role === 'developer' || user.role === 'manager') return <Navigate to="/nexus" replace />;
        return <Navigate to="/" replace />;
    }

    // 3. Allow Access
    return children;
};

const App = () => {
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
                    <ProtectedRoute user={user} allowedRoles={['developer', 'admin', 'manager']}>
                        <DeveloperLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<DashboardPage />} />
                    <Route path="layout/:id" element={<ProjectDetailsPage />} />
                </Route>

                {/* 4. DEVELOPER ROUTES (INTERACTIVE MODE) */}
                <Route path="/interactive" element={
                    <ProtectedRoute user={user} allowedRoles={['developer', 'admin', 'manager']}>
                        <DeveloperLayout />
                    </ProtectedRoute>
                }>
                    <Route index element={<InteractivePage />} />
                    <Route path="layout/:id" element={<InteractiveLayoutPage />} />
                </Route>

                {/* 5. NEXUS ROUTES (MIXED PUBLIC/PRIVATE) */}
                <Route path="/nexus/*" element={
                    <NexusProvider user={user}>
                        <Routes>
                            {/* 🔓 PUBLIC ROUTE: Layout Viewer (Bypasses ProtectedRoute) */}
                            <Route path="view/:id" element={<NexusLayoutViewer />} />

                            {/* 🔒 PROTECTED ROUTES: Dashboard & Editor */}
                            <Route path="*" element={
                                <ProtectedRoute user={user} allowedRoles={['developer', 'admin', 'manager']}>
                                    <Routes>
                                        <Route index element={<NexusDashboard />} />
                                        <Route path="design/:id" element={<NexusBlueprintEditor />} />
                                        <Route path="editor/:id" element={<Navigate to="../view/:id" replace />} />
                                    </Routes>
                                </ProtectedRoute>
                            } />
                        </Routes>
                    </NexusProvider>
                } />

                {/* 6. CATCH-ALL */}
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