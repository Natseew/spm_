import * as React from 'react';
import Box from '@mui/material/Box';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function BasicSelect() {
  const [type, setType] = React.useState('');

  const handleChange = (event) => {
    setType(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 60 }}>
      <FormControl fullWidth>
        <InputLabel id="demo-simple-select-label">Type of Arrangement</InputLabel>
        <Select
          labelId="demo-simple-select-label"
          id="arrangementType"
          value={type}
          label="Type of Arrangement"
          onChange={handleChange}
        >
          <MenuItem value={"WFH"}>Work-From-Home</MenuItem>
          <MenuItem value={"Leave"}>Leave</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}