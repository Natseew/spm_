require('dotenv').config()

const express = require('express')

// TO CHANGE
const workoutRoutes = require('./routes/workouts')

// express app
const app = express()

// middleware
app.use(express.json())

app.use((req,res,next) => {
    console.log(req.path,req.method)
    next()
})

// TO CHANGE : all routes start with api/workouts
app.use('/api/workouts',workoutRoutes)


// listen for requests
app.listen(process.env.PORT,() => {
    console.log('listening on port', process.env.PORT)
})


