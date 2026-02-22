import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calculator, IndianRupee, Save, PieChart, Ruler, Plus, Trash2, ArrowRight } from 'lucide-react';

const ExpenseCalculatorModal = ({ layout, onSave, onClose }) => {
    
    // --- INTELLIGENT AREA PARSER ---
    // Converts strings like "2 Acres 10 Guntas" or "5 Hectares" directly into total Sq.Ft.
    const parseAreaToSqft = (areaStr) => {
        if (!areaStr) return 0;
        if (typeof areaStr === 'number') return areaStr;
        
        const str = String(areaStr).toLowerCase();
        let totalSqft = 0;
        let matched = false;

        // 1 Acre = 43,560 sq ft
        const acresMatch = str.match(/([\d.]+)\s*acre/);
        if (acresMatch) {
            totalSqft += parseFloat(acresMatch[1]) * 43560;
            matched = true;
        }

        // 1 Gunta = 1,089 sq ft
        const guntasMatch = str.match(/([\d.]+)\s*gunta/);
        if (guntasMatch) {
            totalSqft += parseFloat(guntasMatch[1]) * 1089;
            matched = true;
        }

        // 1 Hectare = 107,639.1 sq ft
        const hectaresMatch = str.match(/([\d.]+)\s*hectare/);
        if (hectaresMatch) {
            totalSqft += parseFloat(hectaresMatch[1]) * 107639.1;
            matched = true;
        }

        // 1 Sq.Yard = 9 sq ft
        const sqYardsMatch = str.match(/([\d.]+)\s*sq\.?yard/);
        if (sqYardsMatch) {
            totalSqft += parseFloat(sqYardsMatch[1]) * 9;
            matched = true;
        }

        // Sq.Ft.
        const sqFtMatch = str.match(/([\d.]+)\s*sq\.?ft/);
        if (sqFtMatch) {
            totalSqft += parseFloat(sqFtMatch[1]);
            matched = true;
        }

        // If we found specific units, return the calculated total
        if (matched) return totalSqft;

        // Fallback: just parse the first number if no units matched
        return parseFloat(str) || 0;
    };

    // --- 1. ROBUST INITIALIZATION ---
    const getInitialAreaData = () => {
        const saved = layout.areaDetails || {};
        
        // Use previously saved sqft total if available, else parse the raw string
        let initialTotal = parseFloat(saved.total);
        if (!initialTotal || isNaN(initialTotal)) {
            initialTotal = parseAreaToSqft(layout.totalArea);
        }

        return {
            total: initialTotal || 0,
            roadPct: saved.roadPct || 0,
            parkPct: saved.parkPct || 0,
            infraPct: saved.infraPct || 0,
            otherPct: saved.otherPct || 0
        };
    };

    const [areaData, setAreaData] = useState(getInitialAreaData());
    
    // Determine Step: If we have a total area, jump to Step 2
    const [step, setStep] = useState(areaData.total > 0 ? 2 : 1);

    // --- STEP 1 STATE (Inputs) ---
    const [unitMode, setUnitMode] = useState('guntha'); 
    const [dimInput, setDimInput] = useState({ val: '', acres: '', guntas: '' });
    const [calculatedTotalSqft, setCalculatedTotalSqft] = useState(areaData.total);

    // --- STEP 2 STATE (Expenses) ---
    const [standardExpenses, setStandardExpenses] = useState({
        landCost: layout.expenses?.standard?.landCost || 0,
        registration: layout.expenses?.standard?.registration || 0,
        development: layout.expenses?.standard?.development || 0,
        marketing: layout.expenses?.standard?.marketing || 0,
        legal: layout.expenses?.standard?.legal || 0
    });
    
    const [customExpenses, setCustomExpenses] = useState(layout.expenses?.custom || []);

    // --- METRICS STATE ---
    const [metrics, setMetrics] = useState({
        sellableSqft: 0,
        totalExpenses: 0,
        costPerSellableSqft: 0
    });

    // --- EFFECT: Handle Unit Conversion (Step 1) ---
    useEffect(() => {
        if (step === 1) {
            let total = 0;
            if (unitMode === 'sqft') {
                total = parseFloat(dimInput.val) || 0;
            } else if (unitMode === 'acres') {
                total = (parseFloat(dimInput.val) || 0) * 43560;
            } else if (unitMode === 'guntha') {
                const ac = parseFloat(dimInput.acres) || 0;
                const gu = parseFloat(dimInput.guntas) || 0;
                total = (ac * 43560) + (gu * 1089);
            }
            setCalculatedTotalSqft(total);
        }
    }, [dimInput, unitMode, step]);

    // --- EFFECT: Live Calculations (Step 2) ---
    useEffect(() => {
        // A. Area Calculation
        const totalA = parseFloat(areaData.total) || 0;
        
        // Ensure values are numbers for calculation
        const deductionsPct = 
            (parseFloat(areaData.roadPct) || 0) + 
            (parseFloat(areaData.parkPct) || 0) + 
            (parseFloat(areaData.infraPct) || 0) + 
            (parseFloat(areaData.otherPct) || 0);
        
        const nonSellableSqft = totalA * (deductionsPct / 100);
        const sellable = Math.max(0, totalA - nonSellableSqft);

        // B. Expense Calculation
        const stdTotal = Object.values(standardExpenses).reduce((a, b) => a + (parseFloat(b) || 0), 0);
        const customTotal = customExpenses.reduce((a, item) => a + (parseFloat(item.amount) || 0), 0);
        const grandTotal = stdTotal + customTotal;

        // C. Final Metric
        const perSqft = sellable > 0 ? (grandTotal / sellable) : 0;

        setMetrics({
            sellableSqft: sellable,
            totalExpenses: grandTotal,
            costPerSellableSqft: perSqft
        });
    }, [areaData, standardExpenses, customExpenses]);


    // --- HANDLERS ---

    const handleSetupContinue = (e) => {
        e.preventDefault();
        if (calculatedTotalSqft <= 0) return alert("Please enter a valid total area");
        setAreaData(prev => ({ ...prev, total: calculatedTotalSqft }));
        setStep(2);
    };

    const addCustomExpense = () => {
        setCustomExpenses([...customExpenses, { id: Date.now(), name: '', amount: 0 }]);
    };

    const updateCustomExpense = (id, field, value) => {
        setCustomExpenses(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeCustomExpense = (id) => {
        setCustomExpenses(prev => prev.filter(item => item.id !== id));
    };

    const handleFinalSave = () => {
        onSave({
            areaDetails: areaData,
            expenses: {
                standard: standardExpenses,
                custom: customExpenses
            },
            totalProjectCost: metrics.totalExpenses,
            costPerSqft: metrics.costPerSellableSqft.toFixed(2),
            sellableArea: metrics.sellableSqft.toFixed(0),
            totalArea: `${areaData.total} sq.ft`, 
            lastCalculated: new Date().toISOString()
        });
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95">
            <div className={`glass-panel w-full bg-[#121214] border border-white/10 shadow-2xl rounded-2xl overflow-hidden flex flex-col transition-all ${step === 1 ? 'max-w-md' : 'max-w-4xl h-[85vh]'}`}>
                
                {/* Header */}
                <div className="p-5 border-b border-white/10 bg-[#18181b] flex justify-between items-center shrink-0">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Calculator size={18} className="text-orange-500"/> 
                        {step === 1 ? 'Layout Dimensions' : 'Financial Planner'}
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white transition"/></button>
                </div>

                {/* --- STEP 1: INITIAL SIZE SETUP --- */}
                {step === 1 && (
                    <div className="p-8 flex flex-col gap-6">
                        <div className="text-center space-y-2">
                            <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-500"><Ruler size={24}/></div>
                            <h3 className="text-lg font-bold text-white">Enter Total Area</h3>
                            <p className="text-xs text-gray-400">Total land area is required to calculate expenses.</p>
                        </div>
                        
                        <form onSubmit={handleSetupContinue} className="space-y-4">
                            <div className="flex bg-black/40 border border-white/10 rounded-lg p-1">
                                {['guntha', 'acres', 'sqft'].map(u => (
                                    <button key={u} type="button" onClick={() => { setUnitMode(u); setDimInput({ val: '', acres: '', guntas: '' }); }} className={`flex-1 py-2 text-xs font-bold rounded-md transition ${unitMode === u ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                                        {u === 'guntha' ? 'Acres & Guntas' : (u === 'acres' ? 'Acres' : 'Sq.ft')}
                                    </button>
                                ))}
                            </div>

                            {unitMode === 'guntha' ? (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Acres</label>
                                        <input type="number" autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500" placeholder="0" 
                                            value={dimInput.acres} onChange={e => setDimInput({...dimInput, acres: e.target.value})} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Guntas</label>
                                        <input type="number" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500" placeholder="0" 
                                            value={dimInput.guntas} onChange={e => setDimInput({...dimInput, guntas: e.target.value})} />
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase mb-1 block">Value in {unitMode === 'acres' ? 'Acres' : 'Sq.ft'}</label>
                                    <input type="number" autoFocus className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-blue-500" placeholder="e.g. 5" 
                                        value={dimInput.val} onChange={e => setDimInput({...dimInput, val: e.target.value})} />
                                </div>
                            )}

                            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex justify-between items-center text-xs">
                                <span className="text-blue-300">Converted Area:</span>
                                <span className="font-bold text-white font-mono text-sm">{calculatedTotalSqft.toLocaleString()} Sq.ft</span>
                            </div>

                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mt-2">Continue <ArrowRight size={16}/></button>
                        </form>
                    </div>
                )}

                {/* --- STEP 2: EXPENSES & BREAKDOWN --- */}
                {step === 2 && (
                    <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                        
                        {/* LEFT: SELLABLE AREA LOGIC */}
                        <div className="w-full md:w-1/3 bg-[#0e0e10] border-r border-white/10 p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6">
                            
                            {/* Edit Total Area Option */}
                            <div className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:border-white/20 transition cursor-pointer" onClick={() => setStep(1)}>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><Ruler size={12}/> Total Layout Area</label>
                                    <span className="text-[10px] text-blue-400 font-bold opacity-0 group-hover:opacity-100 transition">EDIT</span>
                                </div>
                                <div className="text-2xl font-bold text-white">{Math.round(areaData.total).toLocaleString()} <span className="text-xs text-gray-500">Sq.ft</span></div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-b border-white/10 pb-2">Non-Sellable Deductions (%)</h3>
                                
                                {[{l:'Roads', k:'roadPct', c:'gray'}, {l:'Parks', k:'parkPct', c:'green'}, {l:'Infra/Amenities', k:'infraPct', c:'purple'}, {l:'Other', k:'otherPct', c:'red'}].map(field => (
                                    <div key={field.k} className="flex justify-between items-center">
                                        <label className={`text-xs text-${field.c}-400 font-medium`}>{field.l}</label>
                                        <div className="flex items-center bg-white/5 rounded px-2 py-1 w-20 border border-white/5 focus-within:border-white/20 transition">
                                            <input 
                                                type="number" 
                                                className="bg-transparent w-full text-right text-sm text-white outline-none" 
                                                value={areaData[field.k] === 0 ? '' : areaData[field.k]} // Allow empty input for UX
                                                placeholder="0"
                                                onChange={e => setAreaData({...areaData, [field.k]: e.target.value})}
                                            />
                                            <span className="text-xs text-gray-500 ml-1">%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-auto bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                                <p className="text-[10px] text-blue-300 uppercase font-bold">Net Sellable Area</p>
                                <p className="text-2xl font-black text-white mt-1">{Math.round(metrics.sellableSqft).toLocaleString()} <span className="text-sm font-medium text-blue-400">Sq.ft</span></p>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div className="bg-blue-500 h-full transition-all duration-500" style={{ width: `${(metrics.sellableSqft / areaData.total) * 100}%` }}></div>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-2 text-right">
                                    {((metrics.sellableSqft / areaData.total) * 100).toFixed(1)}% Efficiency
                                </p>
                            </div>
                        </div>

                        {/* RIGHT: EXPENSES */}
                        <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#121214]">
                            
                            {/* Summary */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 rounded-xl p-5 relative overflow-hidden">
                                    <div className="relative z-10">
                                        <p className="text-[10px] text-orange-400 font-bold uppercase tracking-wider">Cost Per Sellable Sq.ft</p>
                                        <h1 className="text-4xl font-black text-white mt-1">₹{metrics.costPerSellableSqft.toFixed(0)}</h1>
                                        <p className="text-[10px] text-gray-500 mt-1">Break-even Price</p>
                                    </div>
                                </div>
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 flex flex-col justify-center">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Project Expense</p>
                                    <h2 className="text-2xl font-bold text-white mt-1">₹ {(metrics.totalExpenses/10000000).toFixed(4)} Cr</h2>
                                    <p className="text-[10px] text-gray-500 mt-1">₹ {metrics.totalExpenses.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Standard Costs */}
                                <div>
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2"><PieChart size={12}/> Standard Costs</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        {Object.keys(standardExpenses).map(key => (
                                            <div key={key} className={key === 'landCost' ? 'col-span-2' : ''}>
                                                <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">
                                                    {key.replace(/([A-Z])/g, ' $1').trim()}
                                                </label>
                                                <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-3 py-2 focus-within:border-blue-500 transition">
                                                    <IndianRupee size={12} className="text-gray-500 mr-2"/>
                                                    <input type="number" className="bg-transparent w-full text-sm text-white outline-none" 
                                                        value={standardExpenses[key] === 0 ? '' : standardExpenses[key]} 
                                                        placeholder="0"
                                                        onChange={e => setStandardExpenses({...standardExpenses, [key]: e.target.value})}/>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Custom Expenses */}
                                <div>
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2">Other Expenses</h3>
                                        <button onClick={addCustomExpense} className="text-[10px] text-blue-400 hover:text-white flex items-center gap-1 font-bold"><Plus size={12}/> Add Item</button>
                                    </div>
                                    <div className="space-y-2">
                                        {customExpenses.map((item) => (
                                            <div key={item.id} className="flex gap-2">
                                                <input type="text" placeholder="Expense Name" className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-blue-500"
                                                    value={item.name} onChange={e => updateCustomExpense(item.id, 'name', e.target.value)} />
                                                <div className="flex items-center bg-black/40 border border-white/10 rounded-lg px-3 py-2 w-32 focus-within:border-blue-500">
                                                    <IndianRupee size={12} className="text-gray-500 mr-1"/>
                                                    <input type="number" placeholder="0" className="bg-transparent w-full text-sm text-white outline-none"
                                                        value={item.amount} onChange={e => updateCustomExpense(item.id, 'amount', e.target.value)} />
                                                </div>
                                                <button onClick={() => removeCustomExpense(item.id)} className="p-2 text-gray-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"><Trash2 size={16}/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer */}
                {step === 2 && (
                    <div className="p-4 border-t border-white/10 bg-[#18181b] flex justify-end">
                        <button onClick={handleFinalSave} className="bg-orange-600 hover:bg-orange-500 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-orange-900/20">
                            <Save size={16}/> Save & Update
                        </button>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ExpenseCalculatorModal;