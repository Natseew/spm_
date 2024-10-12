"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import WfhRecordsTable from '@/components/WithdrawArrangementComponent'; // Adjust the import path as necessary

const App = () => {
    return (
        <div>
            <h1>Welcome Ann Tranh!</h1>
            <WfhRecordsTable staffId="140891" />
        </div>
    );
};

export default App;
