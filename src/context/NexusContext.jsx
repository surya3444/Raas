import React, { createContext, useState, useEffect, useContext } from 'react';
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from '../firebase'; 

const NexusContext = createContext();

export const NexusProvider = ({ children }) => {
    // 1. Initialize user from LocalStorage directly here to ensure it's fresh on mount
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('rajchavin_user'));
        } catch(e) { return null; }
    });

    const [panicMode, setPanicMode] = useState(false);
    const [isDummyMode, setIsDummyMode] = useState(false);
    const [activeCollection, setActiveCollection] = useState('layouts'); 
    const [configData, setConfigData] = useState({ dummyRevenue: 150000, dummyName: "Verified Client" });

    // 2. Listen to User Settings (and Global Panic)
    useEffect(() => {
        if (!user || !user.id) return;

        const unsub = onSnapshot(doc(db, "settings", user.id), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setConfigData({ 
                    dummyRevenue: data.dummyRevenue || 150000, 
                    dummyName: data.dummyName || "Verified Client" 
                });
                
                if (data.panicMode) {
                    setPanicMode(true);
                    setIsDummyMode(true);
                    setActiveCollection('layouts_dummy');
                } else {
                    setPanicMode(false);
                }
            }
        });
        return () => unsub();
    }, [user]);

    const toggleDummy = (val) => {
        if (panicMode) return; 
        setIsDummyMode(val);
        setActiveCollection(val ? 'layouts_dummy' : 'layouts');
    };

    const triggerPanic = async () => {
        if (!user) return;
        await updateDoc(doc(db, "settings", user.id), { panicMode: true });
    };

    const resetPanic = async () => {
        if (!user) return;
        await updateDoc(doc(db, "settings", user.id), { panicMode: false });
    };

    return (
        <NexusContext.Provider value={{ 
            panicMode, isDummyMode, activeCollection, toggleDummy, 
            triggerPanic, resetPanic, configData, user 
        }}>
            {children}
        </NexusContext.Provider>
    );
};

export const useNexus = () => useContext(NexusContext);