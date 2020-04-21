const Express = require("express");
const Mongoose = require("mongoose");
const BodyParser = require("body-parser");

var app = Express();

Mongoose.connect("mongodb+srv://myAtlas:$ecret123@cluster0-iqd5r.mongodb.net/ostdb", 
        {useNewUrlParser: true, useUnifiedTopology: true});

const DocfileModel = Mongoose.model("docfile", {
    secno: String,
    filetype: String,
    filename: String,
    filebody: String
});

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));


app.post("/docfile", async (request, response) => {
    try {
        var docfile = new DocfileModel(request.body);
        var result = await docfile.save();
        response.send(result);
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/docfile/secno/:search", async (request, response) => {
    try {
        console.log(request.params.search);
        var docfile = await DocfileModel.find({"filebody" : request.params.search}).exec();
        response.send(docfile);
    } catch (error) {
        response.status(500).send(error);
    }
});

app.get("/docfile/list", async (request, response) => {
    try {
        var docfile = await DocfileModel.find().exec();
        response.send(docfile);
    } catch (error) {
        response.status(500).send(error);
    }
});


app.get("/docfile/:id", async (request, response) => {
    try {
        console.log(request.params.id);
        var docfile = await DocfileModel.findById(request.params.id).exec();
        response.send(docfile);
    } catch (error) {
        response.status(500).send(error);
    }
});



app.put("/docfile/:id", async (request, response) => {
    try {
        var docfile = await PersonModel.findById(request.params.id).exec();
        docfile.set(request.body);
        var result = await docfile.save();
        response.send(result);
    } catch (error) {
        response.status(500).send(error);
    }
});

app.delete("/docfile/:id", async (request, response) => {
    try {
        var result = await DocfileModel.deleteOne({ _id: request.params.id }).exec();
        response.send(result);
    } catch (error) {
        response.status(500).send(error);
    }
});


// listen for requests
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log('listening at port ' + port);
})

