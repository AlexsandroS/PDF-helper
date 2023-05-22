const {jsPDF} = window.jspdf;

const msg = `
--//----//----//----//----//----//----//--
Taxa de compresão da imagem está em 0.5
compresão ao adicionar imagem pelo JSPDF está em 'FAST'

Para alterar, entre com os comandos abaixo no console

imgCompress = X | Valor entre 0 e 1
pdfCompress = 'x' | Valores: FAST, MEDIUM, HARD
--//----//----//----//----//----//----//--
`

console.log(msg)
//--------------

const drag_drop = document.getElementsByClassName('drag-drop container')[0]
const drag_drop_pdf = document.getElementsByClassName('drag-drop container')[1]
const filesViewer = document.getElementById('main-files-content')
const showFilescount = document.getElementById('files-title')
const remItems = document.getElementsByClassName('item-remove')
const inputFiles = document.getElementById('inFiles')
const btnCreator = document.getElementsByClassName('btn-gerar')[0]
const archiveName = document.getElementById('archiveName')
const btnOpt = document.getElementsByClassName('btn-gerar')[1]
const inputPDF = document.getElementById('inPDFopt')
const showGroup = document.getElementById('details')
const showFilename = document.getElementsByClassName('textarea')[1]
const showFileSize = document.getElementsByClassName('textarea')[2]
const showPreviewName = document.getElementsByClassName('textarea')[0]
//-------------------

const _imagens = []
var pdfData, uSize = 0,
    cSize = 0, imgCompress = 0.5, pdfCompress = 'FAST';
var debug;

const Tools = {
    toImg: async function (base64, name) {
        return new Promise(function (resolve, reject) {
            var img = new Image();

            img.onload = function () {
                resolve(img);
            }
            img.src = base64;
            img.name = name;
        });
    },
    test: async function () {
        reader.readAsDataURL(compress_out)
    },

    compressImg: function (file) {

        return new Promise(function (resolve, reject) {
            var opt = {
                strict: true,
                checkOrientation: true,
                maxWidth: Infinity,
                maxHeight: Infinity,
                minWidth: 0,
                minHeight: 0,
                quality:imgCompress,
                mimeType: 'auto',
                convertSize: 1,
                success(result) {
                    resolve(result)
                },
                error(err) {
                    console.log(err.message);
                },
            };

            new Compressor(file, opt);
        });

    },

    receiveFiles: async function (files) {
        if (files == undefined)
            return;

        Item.toggleShowItens();
        processFiles(files, 0); // recursivo

        function processFiles(files, index) {
            if (index >= files.length) {
                Item.updateItens();
                return;
            }

            const file = files[index];
            waitTillCompress(file)
                .then((compressedFile) => {
                    return readFileAsDataURL(compressedFile);
                })
                .then((dataURL) => {
                    return Tools.toImg(dataURL, file.name);
                })
                .then((img) => {
                    const imgObj = {
                        name: file.name,
                        type: file.type,
                        base64: img.src,
                        height: img.height,
                        width: img.width,
                        size: file.size,
                    };

                    _imagens.push(imgObj);
                    return Item.createItem(imgObj.name, imgObj.base64);
                })
                .then(() => {
                    processFiles(files, index + 1);
                });
        }

        function waitTillCompress(file) {
            return Tools.compressImg(file);
        }

        function readFileAsDataURL(file) {
            return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = function (e) {
                    resolve(e.target.result);
                };
                reader.readAsDataURL(file);
            });
        }


    },
    toPDF: async function () {
        btnCreator.innerText = "Criando..."
        setTimeout(() => {}, 10)
        const doc = new jsPDF();
        for (let i = 0; i < _imagens.length; i++) {
            const image = _imagens[i]

            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()

            const widthRatio = pageWidth / image.width;
            const heightRatio = pageHeight / image.height;
            const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;

            const canvasWidth = image.width * ratio;
            const canvasHeight = image.height * ratio;

            const marginX = (pageWidth - canvasWidth) / 2;
            const marginY = (pageHeight - canvasHeight) / 2;

            if (i !== 0) {
                doc.addPage(); // Adiciona uma nova página antes de cada imagem, exceto a primeira
            }

            await doc.addImage(image.base64, "JPEG", marginX, marginY, canvasWidth, canvasHeight, image.name, pdfCompress)

            uSize = uSize + image.size;
        }
        cSize = doc.output('arraybuffer')

        var fileName = archiveName.value;
        if (fileName.length <= 0 || fileName === undefined)
            fileName = 'group-imgs'
        else if (fileName.includes('.pdf'))
            fileName.replace('.pdf', '')
        doc.save(fileName + '.pdf');

        btnCreator.innerText = 'Feito'

    },
    receivePDF: function () {

        var filePDF = inputPDF.files[0];

       // if (filePDF !== undefined)
            // btnOpt.toggleAttribute('disabled', false)

        showFilename.innerText = filePDF.name;
        showFileSize.innerText = this.fmtSize(filePDF.size)
        showGroup.toggleAttribute('hidden', false)

        drag_drop_pdf.classList.toggle('drag-drop-min', true)
        var fileReader = new FileReader();

        fileReader.onload = function () {
            pdfData = new Uint8Array(this.result);

        }
        fileReader.readAsArrayBuffer(filePDF);
    },
    optimzePDF: function () {


    },
    fmtSize: function (size) {
        var inBytes = size / 1024;
        const result = []; // 0 = value, 1 = unity
        inBytes = (inBytes.toFixed(2) / 1024).toString()
        result[0] = inBytes.substring(0, inBytes.indexOf('.') + 3);
        result[1] = ' MB'
        return result[0] + result[1]
    }
}


const Item = {
    createItem: async function (name, image64) {
        var template = `<div class="item">
                        <img class="item-preview" src='${image64}'>
                        <span class="item-name" title='${name}'>${name}</span>
                        <div class="item-remove material-symbols-outlined"></div>
                    </div>`
        filesViewer.children[1].innerHTML += template
    },

    removeItem: function (e) {
        const toArray = [].slice.call(remItems)
        var aidi = toArray.lastIndexOf(e.srcElement)
        _imagens.splice(aidi, 1)
        e.srcElement.parentElement.remove()
        this.toggleShowItens()
        showFilescount.innerText = remItems.length > 1 ? remItems.length + ' arquivos selecionados' : remItems.length + ' arquivo selecionado'
    },
    updateItens: function () {
        console.log('updateitens')
        for (let i = 0; i < remItems.length; i++) {
            remItems[i].addEventListener('click', (e) => {
                Item.removeItem(e)
            })
        }

        showFilescount.innerText = remItems.length > 1 ? remItems.length + ' arquivos selecionados' : remItems.length + ' arquivo selecionado'
    },
    toggleShowItens: function () {
        if (_imagens.length > 0)
            return

        var state = filesViewer.hidden
        filesViewer.toggleAttribute('hidden')
        btnCreator.toggleAttribute('disabled')
        filesViewer.classList.toggle('content-hidden', !state)
        drag_drop.classList.toggle('drag-drop-min', state)
    }
}


// Events
inputFiles.addEventListener('change', async () => {
    window.setTimeout(() => {
        Tools.receiveFiles(inputFiles.files)
    }, 10)
})
drag_drop.addEventListener('dragover', (e) => {
    e.preventDefault()
})
drag_drop.addEventListener('drop', (e) => {
    e.preventDefault();
    Tools.receiveFiles(e.dataTransfer.files)
})
btnCreator.addEventListener('click', async () => {
    window.setTimeout(() => {
        Tools.toPDF()
    }, 10)
})
inputPDF.addEventListener('change', () => {
    Tools.receivePDF()
})
archiveName.addEventListener('keydown', () => {
    showPreviewName.innerText = archiveName.value.length > 0 ? archiveName.value + '.pdf' : 'group-imgs.pdf'
})