// https://guarded-woodland-56217.herokuapp.com
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const GridFsStorage = require('multer-gridfs-storage');
const Grid = require('gridfs-stream');
const methodOverride = require('method-override');

var app = express();

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static('public'));
//app.use(express.json({limit: '1mb'}));

app.set('view engine', 'ejs');

const mongoURI = 'mongodb+srv://myAtlas:$ecret123@cluster0-iqd5r.mongodb.net/ostdb';
const options = {
    useUnifiedTopology: true,
    useNewUrlParser: true,
};
const conn = mongoose.createConnection(mongoURI, options);

// Init gfs
let gfs;

conn.once('open', () => {
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('docfile');
})

// Create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
        return new Promise( (resolve, reject) => {
            let ts       = Date.now();
            let date_obj = new Date(ts);
            let datetimefield = date_obj.getFullYear()
            + ("0" + (date_obj.getMonth() + 1)).slice(-2)
            + ("0" + date_obj.getDate()).slice(-2)
            + ("0" + date_obj.getHours()).slice(-2)
            + ("0" + date_obj.getMinutes()).slice(-2)
            + ("0" + date_obj.getSeconds()).slice(-2);

            let secno = req.body.secno.toUpperCase();
            let formtype = req.body.formtype.toUpperCase();
            let period = req.body.period.toUpperCase();

            const filename = secno + "_"
                + formtype + "_"
                + period + "_"
                + datetimefield
                + path.extname(file.originalname);
//            const filename = path.basename(file.originalname,  path.extname(file.originalname)) + "_"
//                + datetimefield + path.extname(file.originalname);

//console.log('inside storage');
//console.log(file);
//console.log('the request');
//console.log(req.body.secno);
            const fileInfo = {
                filename: filename,
                bucketName: 'docfile',
                metadata: {
                    secno:secno,
                    formtype: formtype,
                    period: period,
                    desc: 'Description of the document',
                    originalname: file.originalname
                }
            };
            resolve(fileInfo);
        });
    }
});

const upload = multer({storage});

// @route POST /upload
// @desc  Uploads files to DB
app.post('/upload', upload.single('file1'), (req, res) => {
//   res.json({file: req.file});
//res.send(req.body);
//    console.log(req.file.metadata.secno);
  res.redirect('/');
});

//app.post('/upload', (req, res) => {
//    upload.single(req, res, (err) => {
//        if (err) {
//            res.render('index', {
//                msg: err
//            });
//        } else {
//            console.log(req.file);
//            res.send(req.file);
//        }
//    });
//});


// @route GET /
// @desc Loads form
app.get('/', (req, res) => {
//{"metadata.secno":"CN200912345"}
  gfs.files.find().sort({"filename":1}).toArray( (err, files) => {
//    res.send(files);
    res.render('index', {files: files});
    })
});


// @route GET /files
// @desc  Display all files in JSON
app.get('/files', (req, res) => {
    gfs.files.find().toArray( (err, files) => {
        // Check if files
        if(!files || files.length === 0) {
            return res.status(404).json({
                err: 'No files exist'
            });
        }
        // Files exist
        return res.json(files);
    });
})


// @route GET /files/:filename
// @desc  Display single file
app.get('/files/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // Check if file
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // File exists
        return res.json(file);

        // Files exist
        return res.json(files);
    });
})



// @route GET /image/:filename
// @desc  Display image
app.get('/image/:filename', (req, res) => {
    gfs.files.findOne({filename: req.params.filename}, (err, file) => {
        // Check if file
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // Check if image
        if( file.contentType === 'image/jpeg' || 
            file.contentType === 'image/png' || 
            file.contentType === 'application/pdf') {
            // Read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }

    });
})


// @route GET /imageid/:filename
// @desc  Display image by id
app.get('/imageid/:id', (req, res) => {
    const file_id = req.params.id;
    gfs.files.find({_id: file_id}).toArray( (err, file) => {
        // Check if file
        if(!file || file.length === 0) {
            return res.status(404).json({
                err: 'No file exists'
            });
        }
        // Check if image
        if( file.contentType === 'image/jpeg' || 
            file.contentType === 'image/png' ||
            file.contentType === 'application/pdf' || 1 === 1) {
            // Read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else {
            res.status(404).json({
                err: 'Not an image'
            });
        }
    });
})

// @route DELETE /files/:id
// @desc  Delete file
app.delete('/files/:id', (req, res) => {
    gfs.remove({_id: req.params.id, root: 'docfile'}, (err, gridStore) => {
        if(err) {
            return res.status(404).json({ err: err })
        }

        res.redirect('/');
    })
})


// listen for requests
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('listening at port ' + port);
})

