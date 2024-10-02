// app.js
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/doctorDB', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log(err));

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Ensure this directory exists
    },
    filename: function (req, file, cb) {
        // Use Date.now() to make filename unique
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: function (req, file, cb) {
        // Only accept PDF files
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// Doctor Schema
const doctorSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    contactNumber: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    degree: { type: String, required: true },
    specializations: { type: [String], required: true },
    licenseNumber: { type: String, required: true, unique: true },
    issuingAuthority: { type: String, required: true },
    fees: { type: Number, required: true },
    licenseFile: { type: String, required: true },
    timingSlots: [{
        day: { type: String, required: true },
        from: { type: String, required: true }, // Storing time as string (HH:MM)
        to: { type: String, required: true }
    }],
    bio: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// POST Route for form submission
app.post('/register', upload.single('licenseFile'), async (req, res) => {
    try {
        // Extract form data
        const {
            fullName,
            dob,
            gender,
            contactNumber,
            email,
            degree,
            specializations,
            licenseNumber,
            issuingAuthority,
            fees,
            bio,
            timingDays,
            timingFrom,
            timingTo
        } = req.body;

        // Handle multiple specializations
        const specializationsArray = Array.isArray(specializations) ? specializations : [specializations];

        // Handle timing slots
        const timingSlotsArray = [];
        if (Array.isArray(timingDays)) {
            for (let i = 0; i < timingDays.length; i++) {
                timingSlotsArray.push({
                    day: timingDays[i],
                    from: timingFrom[i],
                    to: timingTo[i]
                });
            }
        } else if (timingDays) { // Single timing slot
            timingSlotsArray.push({
                day: timingDays,
                from: timingFrom,
                to: timingTo
            });
        }

        // Create new doctor instance
        const newDoctor = new Doctor({
            fullName,
            dob,
            gender,
            contactNumber,
            email,
            degree,
            specializations: specializationsArray,
            licenseNumber,
            issuingAuthority,
            fees,
            licenseFile: req.file.path, // Store the path to the uploaded file
            timingSlots: timingSlotsArray,
            bio
        });

        // Save to database
        await newDoctor.save();

        res.send('Doctor registered successfully!');
    } catch (error) {
        console.error(error);
        if (error.code === 11000) {
            res.status(400).send('Duplicate entry detected. Please check your email or license number.');
        } else {
            res.status(400).send(`Error: ${error.message}`);
        }
    }
});

// Serve the form page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
