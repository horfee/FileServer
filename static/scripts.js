'use strict';



const currentPath = window.location.pathname;

const h1 = document.body.querySelector("h1 .title");
const listFiles = document.body.querySelector(".content");
const newFolderButton = document.body.querySelector("h1 .action button.newFolder");
let entries = new Map();

h1.innerHTML = currentPath;


function convert(size) {
    return Intl.NumberFormat(navigator.language, {
        notation: "compact",
        style: "unit",
        unit: "byte",
        unitDisplay: "narrow",
      }).format(size);
}

function formatDate(d) {
    return Intl.DateTimeFormat( navigator.language, { dateStyle: "short", timeStyle: "short"}).format(d);
}
function _renderEntries(entries, path) {
    const listElements =  [...entries].map( (entry) => `
        <tr>
            <td>
                ${entry[1].isDir ? "<img class=\"entryIcon\" src=\"/static/folder.png\"/>" : ""}
                <a href="${path + (path.endsWith("/") ? "": "/") + entry[0]}">${entry[0]}</a>
            </td>
            <td>
                ${formatDate(entry[1].atimeMs)}
            </td>
            <td>
                ${formatDate(entry[1].birthtimeMs)}
            </td>
            <td>
                ${formatDate(entry[1].mtimeMs)}
            </td>
            <td>
            ${convert(entry[1].size)}
            </td>
            <td>
                ${entry[0] === '..' ? '' : `<button data-file="${entry[0]}" class="delete">Delete</button>`}
            </td>
        </tr>`);
    listFiles.innerHTML = [`
        <table>
            <tr>
                <th data-sort-attribute="" >File</th>
                <th data-sort-attribute="size" >Size</th>
                <th data-sort-attribute="atimeMs" >Last access</th>
                <th data-sort-attribute="birthtimeMs" >Created</th>
                <th data-sort-attribute="mtimeMs">Last modification</th>
                <th></th>
            </tr>`, 
        ...listElements, 
        "</table>"].join("");

    listFiles.querySelectorAll("button.delete").forEach( (button) => button.addEventListener("click", deleteFile));
    listFiles.querySelectorAll("th[data-sort-attribute]").forEach( (header) => header.addEventListener("click", sortEntries));
}

const orders = {
    "": 1,
    "size": 1
};

function sortEntries(ev) {
    var order = orders[ev.target.getAttribute("data-sort-attribute")];
    if ( order == undefined ) order = 1;
    order = -order;

    if ( ev.target.getAttribute("data-sort-attribute") === "" ) {
        entries = Object.fromEntries(Object.entries(entries).sort( (e1, e2) => order * e1[0].localeCompare(e2[0])));
    } else {
        entries = Object.fromEntries(Object.entries(entries).sort( (e1, e2) => order * (e1[1].size - e2[1].size)));
    }
    
    orders[ev.target.getAttribute("data-sort-attribute")] = order;

    _renderEntries(new Map(Object.entries(entries)), currentPath);
}

async function resolveFilesForPath(path) {
    const files = await fetch(path, {
        headers: {
        'Accept': 'application/json',
        }
    });
    if ( files && files.status == 200 ) {
        entries = await files.json();
        _renderEntries(new Map(Object.entries(entries)), path);
    }
}

resolveFilesForPath(currentPath);

async function deleteFile(ev) {
    const file = ev.target.getAttribute("data-file");
    const res = confirm(`Do you really want to delete ${file} ?`);
    if ( res ) {
        const res = await fetch(currentPath + (currentPath.endsWith("/") ? "": "/") + file, {
            method: 'DELETE'
        });
        displayMessage(await res.json());
        resolveFilesForPath(currentPath);
    }
}

const dropContainer = document.body;
dropContainer.addEventListener("dragenter", (e) => {
    e.stopPropagation();
    e.preventDefault();
    dropContainer.classList.add("drag");
}, false);

dropContainer.addEventListener("dragleave", (e) => {
    e.stopPropagation();
    e.preventDefault();
    dropContainer.classList.remove("drag");
}, false);

dropContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropContainer.classList.add("drag");
}, false);

dropContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropContainer.classList.add("drag");
}, false);


newFolderButton.addEventListener("click", async (e) => {
    const fileName = prompt("New folder name");
    if ( fileName == undefined ) return;

    const path = currentPath + (!currentPath.endsWith("/") ? "/" : "" ) + fileName;
    await fetch("/", {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({folder: path})
    });
    resolveFilesForPath(currentPath);

});

async function uploadFiles(files) {
    const uploads = files.map( (file) => {
        const fileName = file.name;
        const path = currentPath + (!currentPath.endsWith("/") ? "/" : "" ) + fileName;
        const data = new FormData();
        data.append("file", file);
        return fetch(path, {
            method: "PUT",
            body: data
        });
    });

    const fileUploaded = await Promise.all(uploads);
    fileUploaded.forEach( async (uploadResult) => {
        if ( uploadResult && (uploadResult.status == 200 || uploadResult == 201)) {
            displayMessage(await uploadResult.json());
        }
    })
    resolveFilesForPath(currentPath);
}

dropContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();

    const draggedData = e.dataTransfer;
    const files = [...draggedData.files];
    uploadFiles(files);
});


function displayMessage(message) {
    console.log(`${message.message}`);
}