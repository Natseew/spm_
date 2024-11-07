import React, { useState } from 'react';
import ManagerAdhocComponent from "@/components/ManagerAdhocComponent";
import ManagerRecurringComponent from "@/components/ManagerRecurringComponent";

const ToggleView = () => {
    const [activeView, setActiveView] = useState('adhoc'); // Default view is 'adhoc'

    const handleToggle = (view) => {
        setActiveView(view); // Update the active view based on the button clicked
    };

    return (
        <div className="flex flex-col min-h-full bg-white px-6 py-12 lg:px-8 text-center">
            <div>
                <h1>Employee Timetable Display</h1>
                <div className="mb-4">
                    <button 
                        className={`py-2 px-4 mr-2 ${activeView === 'adhoc' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} 
                        onClick={() => handleToggle('adhoc')}
                    >
                        Recurring Schedule
                    </button>
                    <button 
                        className={`py-2 px-4 ${activeView === 'recurring' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`} 
                        onClick={() => handleToggle('recurring')}
                    >
                        Ad Hoc Schedule
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    {activeView === 'adhoc' ? (
                        <ManagerRecurringComponent />
                    ) : (
                        <ManagerAdhocComponent />
                    )}
                </div>
            </div>
        </div>
    );
};

export default ToggleView;
