import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Share2, Download, Copy, Check, Link as LinkIcon } from 'lucide-react';

const SharePlotModal = ({ layout, plot, onClose }) => {
    const canvasRef = useRef(null);
    const [showPrice, setShowPrice] = useState(true);
    const [copied, setCopied] = useState(false);

    // GENERATE INTELLIGENT LINK
    // We append 'mode=public' to tell the viewer to hide customer data
    // We append 'price=false' if the checkbox is unchecked
    const shareUrl = `${window.location.origin}/nexus/view/${layout.id}?focus=${plot.id}&mode=public${!showPrice ? '&price=false' : ''}`;

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !plot) return;
        const ctx = canvas.getContext('2d');
        const W = 1200;
        const H = 630;
        canvas.width = W;
        canvas.height = H;

        // Background
        const grd = ctx.createLinearGradient(0, 0, 0, H);
        grd.addColorStop(0, '#0f172a'); 
        grd.addColorStop(1, '#1e293b'); 
        ctx.fillStyle = grd;
        ctx.fillRect(0, 0, W, H);

        // Draw Plot Shape
        if (plot.points) {
            const points = plot.points.split(' ').map(p => {
                const [x, y] = p.split(',').map(Number);
                return { x, y };
            });
            const xs = points.map(p => p.x);
            const ys = points.map(p => p.y);
            const minX = Math.min(...xs), maxX = Math.max(...xs);
            const minY = Math.min(...ys), maxY = Math.max(...ys);
            
            const pW = maxX - minX;
            const pH = maxY - minY;
            const scale = Math.min(400 / pW, 400 / pH);

            ctx.save();
            ctx.translate(W/2 - (pW * scale)/2, H/2 - (pH * scale)/2 - 50);
            
            ctx.beginPath();
            ctx.moveTo((points[0].x - minX) * scale, (points[0].y - minY) * scale);
            points.forEach(p => ctx.lineTo((p.x - minX) * scale, (p.y - minY) * scale));
            ctx.closePath();

            ctx.fillStyle = 'rgba(59, 130, 246, 0.2)'; 
            ctx.strokeStyle = '#60a5fa'; 
            ctx.lineWidth = 6;
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        // Text Info
        ctx.textAlign = 'center';
        ctx.fillStyle = '#ffffff';

        ctx.font = 'bold 40px sans-serif';
        ctx.fillText(layout.name.toUpperCase(), W/2, 80);

        ctx.font = 'bold 100px sans-serif';
        ctx.fillStyle = '#60a5fa';
        ctx.fillText(plot.id, W/2, H/2);

        // Details
        ctx.fillStyle = '#94a3b8';
        ctx.font = '30px sans-serif';
        const details = [];
        if (plot.dimensions) details.push(`${plot.dimensions}`);
        if (plot.facing) details.push(`${plot.facing} Facing`);
        ctx.fillText(details.join('  •  '), W/2, H/2 + 80);

        // Price
        if (showPrice && plot.price) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 50px sans-serif';
            ctx.fillText(`₹ ${Number(plot.price).toLocaleString('en-IN')}`, W/2, H - 150);
        } else if (showPrice) {
            ctx.fillStyle = '#ffffff'; // Show "Contact for Price" if price is missing but enabled
            ctx.font = 'bold 40px sans-serif';
            ctx.fillText("Contact for Price", W/2, H - 150);
        }
        // If showPrice is false, we render NOTHING here.

        // Footer
        ctx.fillStyle = '#334155';
        ctx.fillRect(0, H - 80, W, 80);
        ctx.fillStyle = '#94a3b8';
        ctx.font = '24px sans-serif';
        ctx.fillText("View interactive map at: " + window.location.host, W/2, H - 30);

    }, [layout, plot, showPrice]);

    const handleCopyLink = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        const link = document.createElement('a');
        link.download = `${layout.name}_${plot.id}.png`;
        link.href = canvasRef.current.toDataURL();
        link.click();
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${layout.name} - ${plot.id}`,
                    text: `Check out Plot ${plot.id} at ${layout.name}`,
                    url: shareUrl
                });
            } catch (e) { console.error("Share failed", e); }
        } else {
            handleCopyLink();
        }
    };

    return createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
            <div className="glass-panel w-full max-w-lg bg-[#121214] border border-white/10 shadow-2xl flex flex-col rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#18181b]">
                    <h2 className="text-sm font-bold text-white flex items-center gap-2">
                        <Share2 size={16} className="text-blue-500"/> Share Plot {plot.id}
                    </h2>
                    <button onClick={onClose}><X size={20} className="text-gray-500 hover:text-white"/></button>
                </div>
                
                <div className="p-6 space-y-6">
                    
                    {/* Link Section */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                            <LinkIcon size={12}/> Interactive Map Link
                        </label>
                        <div className="flex gap-2">
                            <input 
                                readOnly 
                                value={shareUrl} 
                                className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-gray-300 outline-none focus:border-blue-500 font-mono"
                            />
                            <button 
                                onClick={handleCopyLink} 
                                className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition border ${copied ? 'bg-green-500/10 border-green-500/20 text-green-500' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                            >
                                {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copied' : 'Copy'}
                            </button>
                        </div>
                    </div>

                    <div className="w-full h-px bg-white/10"></div>

                    {/* Image Section */}
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Social Image Preview</label>
                            <label className="flex items-center gap-2 text-[10px] text-gray-300 cursor-pointer select-none">
                                <input type="checkbox" checked={showPrice} onChange={e => setShowPrice(e.target.checked)} className="rounded bg-white/10 border-white/20"/> 
                                Include Price
                            </label>
                        </div>
                        
                        <div className="relative group">
                            <canvas ref={canvasRef} className="w-full h-auto rounded-lg shadow-xl border border-white/10" />
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300 rounded-lg">
                                <button onClick={handleDownload} className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transform scale-90 hover:scale-100 transition">
                                    <Download size={14}/> Save Image
                                </button>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleNativeShare} 
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition shadow-lg shadow-blue-900/20"
                    >
                        <Share2 size={18}/> Share Interactive Plot
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default SharePlotModal;