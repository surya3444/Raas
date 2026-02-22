import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, getDoc } from "firebase/firestore";
// import { signInWithEmailAndPassword } from "firebase/auth"; // REMOVED: Using Firestore directly
// import { auth } from '../firebase'; // REMOVED
import { Lock, Mail, ArrowRight, Loader2, Monitor, Laptop, Smartphone, Globe, CheckCircle, AlertCircle } from 'lucide-react';

const LoginPage = () => {
    
    // Auth State
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Session Management State
    const [showSessionManager, setShowSessionManager] = useState(false);
    const [activeSessions, setActiveSessions] = useState([]);
    const [maxAllowed, setMaxAllowed] = useState(0);
    const [pendingUser, setPendingUser] = useState(null);

    // --- 1. CENTRAL REDIRECT LOGIC ---
    const redirectUser = (user) => {
        console.log("Redirecting user:", user.email, "Role:", user.role);
        console.log("Features:", user.limits?.features);
        
        let path = '/static'; // Default Fallback (Basic/Legacy)

        // 1. Admin Check
        if (user.role === 'admin') {
            path = '/admin';
        } 
        else {
            // Normalize features
            const features = (user.limits?.features || []).map(f => f.toString().toLowerCase());

            // 2. Feature-Based Routing
            if (features.some(f => f.includes('interactive') || f.includes('nexus'))) {
                console.log("Tier: Nexus");
                path = '/nexus';
            } 
            else if (features.some(f => f.includes('grid'))) {
                console.log("Tier: Interactive Grid");
                path = '/interactive';
            } 
            else {
                console.log("Tier: Static (Default)");
                path = '/static';
            }
        }

        // Force hard reload to update App context
        window.location.href = path;
    };

    // --- 2. AUTO-LOGIN ON LOAD ---
    useEffect(() => {
        const userStr = localStorage.getItem('rajchavin_user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.id) {
                    setTimeout(() => redirectUser(user), 50);
                } else {
                    localStorage.removeItem('rajchavin_user');
                }
            } catch (e) {
                console.error("Auto-login error:", e);
                localStorage.removeItem('rajchavin_user');
            }
        }
    }, []);

    // --- UTILS ---
    const parseUserAgent = (ua) => {
        if (!ua) return "Unknown Device";
        if (ua.includes("Windows")) return "Windows PC";
        if (ua.includes("Mac")) return "Mac";
        if (ua.includes("Android")) return "Android";
        if (ua.includes("iPhone")) return "iPhone";
        return "Unknown Device";
    };

    const getDeviceIcon = (name) => {
        if (name.includes("Windows")) return <Monitor size={18} />;
        if (name.includes("Mac") || name.includes("PC")) return <Laptop size={18} />;
        if (name.includes("iPhone") || name.includes("Android")) return <Smartphone size={18} />;
        return <Globe size={18} />;
    };

    // --- LOGIN HANDLER ---
    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // --- HARDCODED SUPER ADMIN ---
            if (email === 'admin@rajchavin.com' && password === 'admin123') {
                const adminUser = { 
                    name: 'Super Admin', 
                    role: 'admin', 
                    id: 'admin_master', 
                    email: email,
                    limits: { maxLogins: 999, features: [] } 
                };
                finalizeSession(adminUser);
                return;
            }

            // 1. DIRECT FIRESTORE AUTHENTICATION
            // Query the 'users' collection where email AND password match
            const q = query(
                collection(db, "users"), 
                where("email", "==", email), 
                where("password", "==", password)
            );
            const snap = await getDocs(q);

            if (snap.empty) {
                alert("Invalid Credentials");
                setIsLoading(false);
                return;
            }

            // 2. Extract User Data
            const userDoc = snap.docs[0];
            
            // Construct User Object with Default Role
            const userData = { 
                id: userDoc.id, 
                uid: userDoc.id, // For compatibility
                ...userDoc.data(),
                role: userDoc.data().role || 'developer' 
            };
            
            // Check Expiry
            if (userData.subscriptionEnd) {
                const now = new Date();
                const expiry = new Date(userData.subscriptionEnd.seconds * 1000);
                if (now > expiry) {
                    alert("Your subscription plan has expired.");
                    setIsLoading(false);
                    return;
                }
            }

            setPendingUser(userData);

            // 3. Check Active Sessions
            const limit = userData.role === 'admin' ? 99 : (userData.limits?.maxLogins || 1);
            setMaxAllowed(limit);

            const sessionQ = query(collection(db, "sessions"), where("userId", "==", userData.id));
            const sessionSnap = await getDocs(sessionQ);
            
            if (sessionSnap.size >= limit) {
                const sessions = sessionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setActiveSessions(sessions);
                setShowSessionManager(true);
                setIsLoading(false);
            } else {
                await createSession(userData);
            }

        } catch (err) {
            console.error(err);
            alert("Login Failed: " + err.message);
            setIsLoading(false);
        }
    };

    const createSession = async (user) => {
        try {
            await addDoc(collection(db, "sessions"), {
                userId: user.id,
                email: user.email,
                loginTime: new Date(),
                userAgent: navigator.userAgent
            });
            finalizeSession(user);
        } catch (err) {
            console.error(err);
            alert("Session Creation Failed");
            setIsLoading(false);
        }
    };

    const finalizeSession = (user) => {
        localStorage.setItem('rajchavin_user', JSON.stringify(user));
        redirectUser(user);
    };

    const terminateSession = async (sessionId) => {
        if (!window.confirm("Log out this device?")) return;
        try {
            await deleteDoc(doc(db, "sessions", sessionId));
            const updatedSessions = activeSessions.filter(s => s.id !== sessionId);
            setActiveSessions(updatedSessions);
        } catch (err) {
            alert("Failed to logout device");
        }
    };

    return (
        <div className="h-screen w-screen flex items-center justify-center bg-[#09090b] relative overflow-hidden">
             {/* Background Watermark */}
             <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <img src="/rajchavin-removebg-preview.png" alt="Bg" className="w-[60%] opacity-[0.02] grayscale invert" />
            </div>

            <div className="w-full max-w-sm p-8 rounded-2xl shadow-2xl relative overflow-hidden 
                bg-[#18181b]/60 backdrop-blur-xl border border-[#27272a] z-10">
                
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-6">
                        <img 
                            src="/rajchavin-removebg-preview.png" 
                            alt="Raj Chavin" 
                            className="h-20 w-auto object-contain drop-shadow-md" 
                        />
                    </div>
                    
                    <p className="text-[10px] font-bold tracking-[0.2em] text-gray-300 uppercase mt-2">
                       RaaS™ - The Operating System of Modern Real Estate
                    </p>
                    <span className='text-[6px] font-bold tracking-[0.2em] text-gray-500 uppercase mt-2'>Control Every Plot. Track Every rupee. Grow Without Limits.</span>
                </div>

                {!showSessionManager ? (
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition placeholder:text-gray-600" 
                                    placeholder="name@company.com" 
                                    required 
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-white/10 rounded-lg py-2.5 pl-9 pr-3 text-sm text-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none transition placeholder:text-gray-600" 
                                    placeholder="••••••••" 
                                    required 
                                />
                            </div>
                        </div>
                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg text-sm shadow-lg shadow-blue-900/20 transition flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={18} /> : (
                                <><span>Sign In</span> <ArrowRight size={16} className="group-hover:translate-x-1 transition" /></>
                            )}
                        </button>
                    </form>
                ) : (
                    /* Session Manager UI */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="text-center mb-4">
                            <div className="w-10 h-10 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-2 mx-auto">
                                <AlertCircle size={20} />
                            </div>
                            <h3 className="font-bold text-white text-sm">Device Limit Reached</h3>
                            <p className="text-[10px] text-gray-400 mt-1">
                                Your plan allows <span className="text-white font-bold">{maxAllowed}</span> active sessions. 
                                Please log out a device.
                            </p>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-1 max-h-[200px] custom-scrollbar">
                            {activeSessions.map((session) => {
                                const deviceName = parseUserAgent(session.userAgent);
                                const isCurrent = session.userAgent === navigator.userAgent;
                                return (
                                    <div key={session.id} className="flex justify-between items-center bg-white/5 p-3 rounded-lg border border-white/5 hover:border-blue-500/30 transition">
                                        <div>
                                            <div className="flex items-center gap-2 text-blue-500">
                                                {getDeviceIcon(deviceName)}
                                                <span className="text-xs font-bold text-gray-200">
                                                    {deviceName} {isCurrent && '(This)'}
                                                </span>
                                            </div>
                                            <p className="text-[9px] text-gray-500 mt-0.5">
                                                Active since: {session.loginTime?.seconds ? new Date(session.loginTime.seconds * 1000).toLocaleDateString() : 'Just now'}
                                            </p>
                                        </div>
                                        <button onClick={() => terminateSession(session.id)} className="text-[10px] text-red-400 bg-red-500/10 hover:bg-red-500 hover:text-white px-3 py-1.5 rounded transition font-bold">
                                            Logout
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="space-y-2 mt-auto">
                            {activeSessions.length < maxAllowed && (
                                <button onClick={() => createSession(pendingUser)} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2.5 rounded-lg text-xs shadow-lg animate-pulse transition flex items-center justify-center gap-2">
                                    <CheckCircle size={14} /> Slot Available - Login Now
                                </button>
                            )}
                            <button onClick={() => { setShowSessionManager(false); setPendingUser(null); }} className="w-full bg-white/5 hover:bg-white/10 text-gray-400 font-bold py-2.5 rounded-lg text-xs transition">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}

                <div className="mt-8 text-center border-t border-white/5 pt-4">
                    <p className="text-[10px] text-gray-600">Restricted Access. Authorized Personnel Only.</p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;