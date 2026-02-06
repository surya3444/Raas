import React from 'react';
import MapCanvas from '../project/MapCanvas'; // Reusing your robust MapCanvas

const InteractiveMap = ({ layout }) => {
    return (
        <div className="flex-1 flex flex-col p-4 overflow-hidden h-full">
            <div className="flex justify-between items-center mb-2 shrink-0">
                <h3 className="text-xs font-bold text-gray-500 uppercase">Reference Map</h3>
                {/* Note: MapCanvas handles upload internally now */}
            </div>
            
            {/* We wrap MapCanvas in a container that fills the available space.
                The MapCanvas component we built earlier is responsive and handles 
                its own sizing, but here we constrain it to the interactive pane.
            */}
            <div className="flex-1 rounded-xl border border-white/10 relative overflow-hidden bg-[#121214]">
                 {/* We can reuse MapCanvas. Since MapCanvas has 'h-[400px]' default style 
                    when not fullscreen, we might want to override class names or 
                    just ensure it flex-grows. 
                    
                    Ideally, modify MapCanvas to accept a className prop to override h-[400px].
                    Assuming standard usage:
                 */}
                 <div className="absolute inset-0">
                    <MapCanvas layout={layout} />
                 </div>
            </div>
        </div>
    );
};

export default InteractiveMap;