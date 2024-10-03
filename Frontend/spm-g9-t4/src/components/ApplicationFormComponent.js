import * as React from 'react';
import Button from '@mui/material/Button';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Tabs, Tab, Typography, Box } from '@mui/material';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import { useTheme } from '@mui/material/styles';
import OutlinedInput from '@mui/material/OutlinedInput';
import BasicSelect from './DropdownComponent';


export default function ApplicationForm() {
    const handleChangeDropdown = (event) => {
        setSelectedValue(event.target.value);
      };

  return(
    <box>
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-2 p-4">Date:</div>
            <div class="col-span-10 p-4">
                {/* Date Picker */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DatePicker']}>
                        <DatePicker label="Select Date" />
                    </DemoContainer>
                </LocalizationProvider>
            </div>
        </div>

        <Divider></Divider>

        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-2 p-4">Type of Arrangement:</div>
            <div class="col-span-4 p-4">
                {/* Arrangement Dropdown */}
                <BasicSelect></BasicSelect>
            </div>
            <div class="col-span-6 p-4"></div>
        </div>

        <Divider></Divider>

        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-2 p-4">Reason:</div>
            <div class="col-span-10 p-4">
                {/* TextBox */}
                <TextField id="reason" label="" variant="outlined" fullWidth size="Normal" multiline
                 />
            </div>
        </div>
        
        <Button color="secondary">Cancel</Button>
        <Button variant="contained" color="success">
            Submit
        </Button>
    </box>
  )
}



export function ApplicationFormRecurring() {
    const handleChangeDropdown = (event) => {
        setSelectedValue(event.target.value);
      };

  return(
    <box>
        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-2 p-4">Day:</div>
            <div class="col-span-10 p-4">
                {/* Date Picker */}
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DemoContainer components={['DatePicker']}>
                        <DatePicker label="Select Date" />
                    </DemoContainer>
                </LocalizationProvider>
            </div>
        </div>

        <Divider></Divider>

        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-2 p-4">Type of Arrangement:</div>
            <div class="col-span-4 p-4">
                {/* Arrangement Dropdown */}
                <BasicSelect></BasicSelect>
            </div>
            <div class="col-span-6 p-4"></div>
        </div>

        <Divider></Divider>

        <div class="grid grid-cols-12 gap-4">
            <div class="col-span-2 p-4">Reason:</div>
            <div class="col-span-10 p-4">
                {/* TextBox */}
                <TextField id="reason" label="" variant="outlined" fullWidth size="Normal" multiline
                 />
            </div>
        </div>
        
        <Button color="secondary">Cancel</Button>
        <Button variant="contained" color="success">
            Submit
        </Button>
    </box>
  )
}