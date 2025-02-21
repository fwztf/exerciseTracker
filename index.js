require('dotenv').config()
const MONGO_URI = process.env.MONGO_URI;
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const {
    Schema
} = mongoose;

app.use(cors())
app.use(express.urlencoded({
    extended: true
}));
app.use(express.static('public'))
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/index.html')
});

// connect to DB
mongoose.connect(MONGO_URI);

// create new user schema
const UserSchema = new Schema({
    username: {
        type: String,
        required: true
    }
});

// create exercise schema
const ExerciseSchema = new Schema({
    user_id: {
        type: String,
        required: true
    },
    description: String,
    duration: Number,
    date: Date
});

// create user model from schema
const User = mongoose.model("User", UserSchema);

// create exercise model from schema
const Exercise = mongoose.model("Exercise", ExerciseSchema);

// write endpoint to get all users
app.get("/api/users", async (req, res) => {
    // get users from User model
    const users = await User.find({}).select("_id username");

    if (!users) {
        res.json({
            error: "no users"
        })
    } else {
        res.json(users);
    }
})

// write endpoint to post to usersDB
app.post("/api/users", async (req, res) => {
    // get username from request body
    const userName = req.body.username;

    // create new user object from schema
    const userObj = new User({
        username: userName
    })

    try {
        // save user to DB
        const user = await userObj.save();
        res.json(user);
    } catch (err) {
        res.json({
            error: err
        })
    }

})

// write endpoint to post to exerciseDB
app.post("/api/users/:_id/exercises", async (req, res) => {
    // get id from req.params
    const id = req.params._id;
    const {
        description,
        duration,
        date
    } = req.body;

    try {
        // get user from User model
        const user = await User.findById(id);

        if (!user) {
            return res.send("could not find user")
        } else {
            // create new exercise object
            const exerciseObj = new Exercise({
                user_id: user._id,
                description,
                duration,
                date: date ? new Date(date) : new Date()
            })

            // save exerciseObj to Exercise model
            const exercise = await exerciseObj.save();

            res.json({
                _id: user._id,
                username: user.username,
                description: exercise.description,
                duration: exercise.duration,
                date: new Date(exercise.date).toDateString()
            })
        }
    } catch (err) {
        res.json({
            error: err
        })
    }
})

// write endpoint to get logs
app.get("/api/users/:_id/logs", async (req, res) => {
    // retrieve query parameters from req.query
    const {
        from,
        to,
        limit
    } = req.query;
    const id = req.params._id;
    const user = await User.findById(id);

    if (!user) {
        return res.json({
            error: "could not find user"
        })
    }

    let dateObj = {};

    if (from) {
        dateObj["$gte"] = new Date(from);
    }

    if (to) {
        dateObj["$lte"] = new Date(to);
    }

    let filter = {
        user_id: id
    }

    if (from || to) {
        filter.date = dateObj;
    }

    const exercises = await Exercise.find(filter).limit(+limit ?? 500);
    const log = exercises.map(e => ({
        description: e.description,
        duration: e.duration,
        date: e.date.toDateString(),

    }))

    res.json({
        usernae: user.username,
        count: exercises.length,
        _id: user._id,
        log
    })

})



const listener = app.listen(process.env.PORT || 3000, () => {
    console.log('Your app is listening on port ' + listener.address().port)
})