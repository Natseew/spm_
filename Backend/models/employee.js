const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema({
  staff_id: {
    type: String,
    required: true,
    unique: true
  },
  first_name: {
    type: String,
    required: true
  },
  last_name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  position: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  reporting_manager: {
    type: String,  // References another Staff_ID
    required: true
  },
  role: {
    type: Number,  
    required: true
  }
});

module.exports = mongoose.model("Staff", staffSchema, "employeesTable");
