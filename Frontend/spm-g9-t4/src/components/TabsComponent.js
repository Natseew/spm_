// components/CalendarComponent.js
'use client';

import React, { useState } from 'react';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import ApplicationForm from './ApplicationFormComponent';
import {ApplicationFormRecurring} from './ApplicationFormComponent';

const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`tabpanel-${index}`}
            aria-labelledby={`tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box p={3}>
                    <Typography>{children}</Typography>
                </Box>
            )}
        </div>
    );
};

export default function SimpleTabs() {
    const [value, setValue] = useState(0);

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box>
            <Tabs value={value} onChange={handleChange} aria-label="simple tabs example">
                <Tab label="Ad-Hoc Application" />
                <Tab label="Recurring Application" />
            </Tabs>
            <TabPanel value={value} index={0}>
                <ApplicationForm></ApplicationForm>
            </TabPanel>
            <TabPanel value={value} index={1}>
                <ApplicationFormRecurring></ApplicationFormRecurring>
            </TabPanel>
        </Box>
    );
}