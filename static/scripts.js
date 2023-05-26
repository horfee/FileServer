'use strict';



const currentPath = window.location.pathname;

const h1 = document.body.querySelector("h1 .title");
const listFiles = document.body.querySelector(".content");
const newFolderButton = document.body.querySelector("h1 .action button.newFolder");

h1.innerHTML = currentPath;


function convert(size) {
    return Intl.NumberFormat(navigator.language, {
        notation: "compact",
        style: "unit",
        unit: "byte",
        unitDisplay: "narrow",
      }).format(size);
}
async function resolveFilesForPath(path) {
    const files = await fetch(path, {
        headers: {
        'Accept': 'application/json',
        }
    });
    if ( files && files.status == 200 ) {
        const res = await files.json();

        const listElements =  Object.keys(res).map( (entry) => `
            <tr>
                <td>
                    <a href="${path + (res[entry].isFile ? "" : path.endsWith("/") ? "": "/") + entry}">${entry}</a>
                </td>
                <td>
                ${convert(res[entry].size)}
                </td>
                <td>
                    ${entry === '..' ? '' : `<button data-file="${entry}" class="delete">Delete</button>`}
                </td>
            </tr>`);
        listFiles.innerHTML = ["<table><tr><th>File</th><th>Size</th><th></th></tr>", ...listElements, "</table>"].join("");

        listFiles.querySelectorAll("button.delete").forEach( (button) => button.addEventListener("click", deleteFile));
    }
}

resolveFilesForPath(currentPath);

async function deleteFile(ev) {
    const file = ev.target.getAttribute("data-file");
    const res = confirm(`Do you really want to delete ${file} ?`);
    if ( res ) {
        const res = await fetch(file, {
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