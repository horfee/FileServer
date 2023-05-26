const express = require('express');
const multer = require('multer');
const logger = require('morgan');
const fs = require('fs').promises;
const bodyParser = require('body-parser');
const fileExists = require('fs').existsSync;
const resolver = require("path").resolve;


const port = process.env.PORT || 3000;
const documentFolder = process.env.ROOTFOLDER || __dirname;

const app = express();
app.use(logger('tiny'));
//app.use(express.json());
app.use(bodyParser.urlencoded({
    extended: true
  }));
app.use(bodyParser.json());

/***********************/
/**     UPLOAD PART    */
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const path = resolver(documentFolder, "./" + req.path).split("/").slice(0, -1).join("/");
        cb(null,  path );
    },
    filename: (req, file, cb) => {
        const filename = decodeURIComponent(req.path.split("/").slice(-1)[0]);
        cb(null, filename);
    }
});


const upload = multer({ storage: storage });
function uploadFiles(req, res) {
    res.json({ message: `File ${decodeURIComponent(req.path)} successfully uploaded`, file: req.path });
}

app.post("/", async function(req, res) {
    const folderToCreate = decodeURIComponent(req.body.folder);
    const folderCreated = await fs.mkdir(resolver( __dirname, "./" + folderToCreate), {
        recursive: true
    })
    res.json({message: `Folder ${folderToCreate} successfully created`, file: folderToCreate});
});
app.put("/*", upload.single("file"), uploadFiles);

/** END OF UPLOAD PART */
/***********************/


app.delete('/*', async function(req,res){
    const path = decodeURIComponent(req.path)
    await fs.rm(resolver(documentFolder, "./" + path), {
        recursive: true,
        force: true        
    })
    res.json({message: `${path} successfully deleted}`, file: decodeURIComponent(path)});
});

const listFiles = async function(path) {
    var items;
    if ( !fileExists(path)) items = [".."];
    else items = ["..", ...(await fs.readdir(path))];
    console.log(`Items in path ${path}: ${items.join(",")}`);

    const res = (await Promise.all(items.map( async (entry) => {
        try {
            const res = await fs.stat(resolver(path, entry));
            return { [entry]: Object.assign( res, { isDir: res.isDirectory()})};
        } catch(err) {
            return { [entry]: { isDir: true}};
        }
    }))).reduce( (prev, current) => Object.assign(prev, current), {});
    
    return res;
}

app.get('/*', async function(req,res) {
   

    const resquestedFile = resolver(documentFolder, "./" + req.path);

    if ( fileExists(resquestedFile) && (await fs.stat(resquestedFile)).isFile() ) {
        return res.sendFile(resquestedFile);
    }
    if ( req.headers.accept === 'application/json' ) {
        return res.send((await listFiles(resquestedFile)));
    } 
    
    return res.sendFile(resolver(documentFolder, 'static/index.html'));
    
});

app.get('/index.html', async function(req, res) {
    return res.sendFile(resolver(__dirname, 'static/index.html'));
});



app.listen(port, () => {
    console.log(`Server is up and running on port ${port}`);
})



