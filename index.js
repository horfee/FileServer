const express = require('express');
const multer = require('multer');
const logger = require('morgan');
const bodyParser = require('body-parser');
//const fileExists = require('fs').existsSync;
const resolver = require("path").resolve;
const localFS = require('./localfs');
const SimpleAuthorizationSystem = require('./authorization');

const port = process.env.PORT || 3000;
const documentFolder = process.env.ROOTFOLDER || "/Users/horfee";

const dataFileSystemService = new localFS({rootFolder: documentFolder});
const systemFileSystemService = new localFS({rootFolder: __dirname});

const authorizationService = new SimpleAuthorizationSystem({defaultAnswer: true});

const app = express();
app.use(logger('tiny'));
//app.use(express.json());
app.use(express.urlencoded(true));
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());

/***********************/
/**     UPLOAD PART    */
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = resolver(documentFolder, "./" + decodeURIComponent(req.path)).split("/").slice(0, -1).join("/");
        console.log(`Path is ${path}`);
        cb(null,  path );
    },
    filename: (req, file, cb) => {
        const filename = decodeURIComponent(req.path.split("/").slice(-1)[0]);
        console.log(`Filename is ${filename}`);
        cb(null, filename);
    }
});


const upload = multer({ storage: storage });
function uploadFiles(req, res) {
    //fileSystemService.saveFile()
    res.json({ message: `File ${decodeURIComponent(req.path)} successfully uploaded`, file: req.path });
}

app.post("/", async function(req, res) {
    const folderToCreate = decodeURIComponent(req.body.folder);
    const folderCreated = await fs.mkdir(resolver( documentFolder, "./" + folderToCreate), {
        recursive: true
    })
    res.json({message: `Folder ${folderToCreate} successfully created`, file: folderToCreate});
});
app.put("/*", upload.single("file"), uploadFiles);

/** END OF UPLOAD PART */
/***********************/


app.delete('/*', async function(req,res){
    const path = decodeURIComponent(req.path);
    await fs.rm(resolver(documentFolder, "./" + path), {
        recursive: true,
        force: true        
    })
    res.json({message: `${path} successfully deleted}`, file: decodeURIComponent(path)});
});

const listFiles = async function(path) {
    return await dataFileSystemService.getFilesForPath(path);
}

app.get('/*', async function(req,res) {
   

    //const requestedFile = resolver(documentFolder, "./" + decodeURIComponent( req.path ));
    const requestedFile = decodeURIComponent(req.path);
    if ( await dataFileSystemService.fileExists(requestedFile)  && await authorizationService.isAuthorizedForFile('test', requestedFile)) {
        return dataFileSystemService.sendFile(res, requestedFile);
        //return res.sendFile(requestedFile);
    }
    if ( req.headers.accept === 'application/json' ) {
        if ( await authorizationService.isAuthorizedForFile('test', requestedFile) ) {
            return res.send((await listFiles(requestedFile)));
        }
        return res.json([]);
    } 
    
    const staticFile = decodeURIComponent(req.path);
    if ( await systemFileSystemService.fileExists(staticFile) ) {
        return systemFileSystemService.sendFile(res, staticFile);
        //return res.sendFile(staticFile);
    }

    return systemFileSystemService.sendFile(res, 'static/index.html');
    //return res.sendFile(resolver(__dirname, 'static/index.html'));
    
});

app.get('/index.html', async function(req, res) {
    return res.sendFile(resolver(__dirname, 'static/index.html'));
});



app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
})



