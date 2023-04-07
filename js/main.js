const { jsPDF } = window.jspdf;
const pdflib = window.PDFLib

//--------------

const drag_drop = document.getElementsByClassName('drag-drop container')[0]
const drag_drop_pdf = document.getElementsByClassName('drag-drop container')[1]
const filesViewer = document.getElementById('main-files-content')
const remItems = document.getElementsByClassName('item-remove')
const inputFiles = document.getElementById('inFiles')
const btnCreator = document.getElementsByClassName('btn-gerar')[1]
const archiveName = document.getElementById('archiveName')
const btnOpt =  document.getElementsByClassName('btn-gerar')[0]
const inputPDF = document.getElementById('inPDFopt')
const showGroup = document.getElementById('details')
const showFilename = document.getElementsByClassName('textarea')[0]
const showFileSize = document.getElementsByClassName('textarea')[1]
const showPreviewName = document.getElementsByClassName('textarea')[2]
//-------------------

const _imagens = []
var pdfData;

var debug;

const Tools = {
    toBase64: function(imgSrc)
    {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
    
        canvas.width = imgSrc.width;
        canvas.height = imgSrc.height;
        context.drawImage(imgSrc, 0, 0);
        return canvas.toDataURL();
    },
    receiveFiles: function(files)
    {
        if(files == undefined)
            return

        Item.toggleShowItens()
        for (let i = 0; i < files.length; i++) {
            const img = new Image();
            img.src = URL.createObjectURL(files[i])
            img.onload = function() {
                const base64 = Tools.toBase64(img)
                const imgObj = { 
                    name: files[i].name,
                    type: files[i].type,
                    base64: base64,
                    height: img.height,
                    width: img.width
                }
                Item.createItem(imgObj.name, imgObj.base64)
                _imagens.push(imgObj)
                Item.updateItens()
              }
        }
    },
    toPDF: function()
    {
        const doc = new jsPDF();
        _imagens.forEach((image, i) => {
            const pageWidth = doc.internal.pageSize.getWidth()
            const pageHeight = doc.internal.pageSize.getHeight()

            const widthRatio = pageWidth / image.width;
            const heightRatio = pageHeight / image.height;
            const ratio = widthRatio > heightRatio ? heightRatio : widthRatio;
        
            const canvasWidth = image.width * ratio;
            const canvasHeight = image.height * ratio;
        
            const marginX = (pageWidth - canvasWidth) / 2;
            const marginY = (pageHeight - canvasHeight) / 2;

            doc.addImage(image.base64, "JPEG", marginX, marginY, canvasWidth, canvasHeight, image.name,'MEDIUM')
            
            if(i !== _imagens.length - 1)
                doc.addPage();
            })

            const fileName = archiveName.value;
            if(fileName.length <= 0 || fileName === undefined)
                fileName = 'arc-imagens'
            else if(fileName.includes('.pdf'))
                fileName.replace('.pdf','') 
            doc.save(fileName + '.pdf');
        },
        receivePDF: function(){

            var filePDF = inputPDF.files[0];

            if(filePDF !== undefined)
            // btnOpt.toggleAttribute('disabled', false)

             showFilename.innerText = filePDF.name;
             showFileSize.innerText = this.fmtSize(filePDF.size)
             showGroup.toggleAttribute('hidden', false)
            
             drag_drop_pdf.classList.toggle('drag-drop-min', true)
            var fileReader = new FileReader();
            
            fileReader.onload = function() {  
                pdfData  = new Uint8Array(this.result);
                
            }
            fileReader.readAsArrayBuffer(filePDF);
        },
        optimzePDF: function(){
            
          
        },
        fmtSize: function(size)
        {
            var inBytes = size / 1024;
            const result = []; // 0 = value, 1 = unity
  
            inBytes = (inBytes.toFixed(2) / 1024).toString()
            result[0] = inBytes.substring(0, inBytes.indexOf('.') + 3);
            result[1] = ' MB'
 
            return result[0] + result[1]
        }
}


const Item = {
    createItem: function (name,image64) {
        var obj = `<div class="item">
                        <img class="item-preview" src='${image64}'>
                        <span class="item-name">${name}</span>
                        <div class="item-remove material-symbols-outlined"></div>
                    </div>`
        filesViewer.children[1].innerHTML += obj
    },
    removeItem: function (e) {
        const toArray = [].slice.call(remItems)
        var aidi = toArray.lastIndexOf(e.srcElement)
        _imagens.splice(aidi, 1)
        e.srcElement.parentElement.remove()
        this.toggleShowItens()
    },
    updateItens: function () {
        for (let i = 0; i < remItems.length; i++) {
            remItems[i].addEventListener('click', (e) => {
                Item.removeItem(e)
            })}
    },
    toggleShowItens: function()
    {
        if(_imagens.length > 0)
            return

        var state = filesViewer.hidden
        filesViewer.toggleAttribute('hidden')
        btnCreator.toggleAttribute('disabled')
        filesViewer.classList.toggle('content-hidden', !state)
        drag_drop.classList.toggle('drag-drop-min', state)
    }
}


// Events
inputFiles.addEventListener('change', ()=>{Tools.receiveFiles(inputFiles.files)})
drag_drop.addEventListener('dragover', (e) => {e.preventDefault()})
drag_drop.addEventListener('drop', (e) => {e.preventDefault(); Tools.receiveFiles(e.dataTransfer.files)})
btnCreator.addEventListener('click', () => {Tools.toPDF()})
inputPDF.addEventListener('change', ()=>{Tools.receivePDF()})
archiveName.addEventListener('keyup', () => {showPreviewName.innerText = archiveName.value.length > 0 ? archiveName.value + '.pdf' : 'arc-imagens.pdf'})