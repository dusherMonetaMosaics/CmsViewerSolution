MosCmsViewer = function (urlArr, fileName) { // ******fileName is NEW!!!********
    this.urlArr = urlArr || [];

    this.pdfDoc = null;
    this.pageNum = 1;
    this.pageIsRendering = false;
    this.pageNumIsPending = null;
    //this.scale = 1.35;

    this.pagesPending = 0;

    //    this.canvas1 = document.getElementById("cms-canvas_1");
    //    this.ctx1 = this.canvas1.getContext("2d");
    //    this.markerImg = this.canvas1.height;
    //    this.maxImgWidth = this.canvas1.width;

    //    this.merge = document.getElementById("merge");
    this.coor = [];
    this.viewerContainer = document.querySelector(".cms-viewerContainer");
    this.viewer = document.querySelector(".cms-viewer");

    this.brush = document.getElementById('cms-brush');
    this.x1 = 0;
    this.y1 = 0;
    this.x2 = 0;
    this.y2 = 0;
    //    this.scrollBar = this.viewerContainer.scrollTop;
    this.copyButton = document.getElementById("cms-copy-button-container");
    this.markButton = document.getElementById("cms-mark-button-container");

    this.prevPageButton = document.getElementById("cms-prev-page");
    this.nextPageButton = document.getElementById("cms-next-page");
    this.title = document.getElementById("cms-title");
    this.prevDocButton = document.getElementById("cms-prev-document");
    this.nextDocButton = document.getElementById("cms-next-document");
    this.prevDocFunc = null;
    this.nextDocFunc = null;
    this.docScreenButton = document.getElementById("cms-doc-btn-container");
    this.allWas = document.getElementById("allWas");

    this.canvas1Container = document.getElementById("cms-side-canvas-container");

    this.pagesRotation = 0;

    this.firstDocFlag = false;
    this.readyForPrint = false;

    this.allCoors = {};

    this.initCms(fileName); // ****fileName*******
}

MosCmsViewer.prototype.initCms = function (fileName) { // ******fileName is NEW!!!!*******
    //this.clearPdf();
    //this.setURL(url);
    var _this = this;
    this.markFlag = (this.markButton.classList.value.indexOf("cms-enabled") > -1);
    this.copyFlag = this.copyButton.classList.value.indexOf("cms-enabled") > -1;
    var firstDocFlag = false;

    this.canvas1Container.classList.add("cmsHiddenScreen");

    this.docScreenButton.addEventListener("click", function (e) {
        if (_this.allWas.className.indexOf("cmsHiddenScreen") > -1) {
            _this.allWas.classList.remove("cmsHiddenScreen");
            _this.canvas1Container.classList.add("cmsHiddenScreen");
            document.getElementById("cms-split-send-button-container").classList.add("cmsHiddenScreen");
            document.getElementById("cms-split-canvas-area").classList.add("cmsHidden");
            document.getElementById("cms-compare-area").classList.add("cmsHidden");
        } else {
            _this.allWas.classList.add("cmsHiddenScreen");
        }
    });

    if (_this.urlArr.length === 0) {
        _this.addBarEvents();
    }
    //this.orgiginalScale = this.scale;
    _this.createViewer("empty");

    for (var u = 0; u < _this.urlArr.length; u++) {
        new Promise(function (resolve, reject) {
            _this.createViewer(u);
            var newViewerId = "viewer_" + u;
            if (u === 0) {
                document.querySelector("#" + newViewerId).parentElement.classList.add("cms-current-document");
                resolve(_this.createPdfViewer(_this.urlArr[u], newViewerId, fileName));
            } else {
                reject(_this.createPdfViewer(_this.urlArr[u], newViewerId, fileName));
            }
            //this.renderAll(newViewer);
        }).then(function () {
            //_this.scrollBar = _this.viewerContainer.scrollTop;
            //_this.updateCms(_this.urlArr[0]);
            _this.addBarEvents();
            _this.firstDocFlag = true;
        }, function () {
            _this.pdfDoc = _this.firstDocFlag ? _this.allCoors[_this.getPdfName(_this.urlArr[0])].pdfDoc : null;
            //_this.coor = firstDocFlag ? _this.allCoors[_this.getPdfName(_this.urlArr[0])].markerCoors : [];
            _this.url = _this.urlArr[0];
            //_this.scrollBar = _this.viewerContainer.scrollTop;
        });
    }
    //resolve(_this.urlArr[0]);



    /* UNCOMMENT WHEN RENDERED */

}

MosCmsViewer.prototype.updateCms = function (url, fileName) { // url instead of num? ****** File name is NEW!!! *****
    var _this = this;
    new Promise(function (resolve, reject) {
        resolve(_this.setURL(url))
    }).then(function () {
        _this.setViewer(_this.getViewerIdFromURL(url));
        _this.validateCrosshair();
        var pdfName = _this.getPdfName(url);
        _this.title.innerHTML = fileName ? fileName : pdfName;
        _this.matchCoors(url);

        var _pdfDoc = _this.allCoors[pdfName].pdfDoc;

        //console.log(this.getPdfName())
        //        this.allCoors[pdfName].pdfDoc = _pdfDoc;
        _this.pdfDoc = _pdfDoc;
        //var _this = _this;
        new Promise(function (reslove, reject) {
            document.getElementById("cms-num-pages").textContent = _this.pdfDoc.numPages;
            _this.prevPageButton.classList.remove("cms-unselectable");
            _this.nextPageButton.classList.remove("cms-unselectable");
            if (Number(document.getElementById("cms-page-index").innerHTML) == 1) {
                _this.prevPageButton.classList.add("cms-unselectable");
            }
            if (Number(document.getElementById("cms-page-index").innerHTML) == _this.pdfDoc.numPages) {
                _this.nextPageButton.classList.add("cms-unselectable");
            }
            if (document.querySelector(".cms-current-document")) {
                document.querySelector(".cms-current-document").classList.remove("cms-current-document");
            }
            _this.viewerContainer.classList.add("cms-current-document");
            //_this.updateScrollCmsPosition(_this.viewerContainer.getElementsByClassName("scroll-cms")[0]);
            reslove(_pdfDoc);
        }).then(resolved => {
            _this.pdfDoc = resolved;
            if (!_this.allCoors[pdfName].isScrollBar) {
                _this.loadScrollCms(_this.viewerContainer);
                _this.allCoors[pdfName].isScrollBar = true;
            }
        });
    })
}

MosCmsViewer.prototype.getViewerIdFromURL = function (url) {
    var viewerIdx = this.urlArr.indexOf(url);
    return document.getElementById("viewer_" + viewerIdx).id;
}

MosCmsViewer.prototype.createPdfViewer = function (url, viewerId, fileName) { //******fileName is NEW!!!!!!*****
    this.setURL(url);
    this.setViewer(viewerId);
    var viewer = this.viewer;
    var gotDocument = url.indexOf(".pdf") > -1 ? this.getDocument() : this.getBase64Document();
    return gotDocument.then(_pdfDoc => {
        this.matchCoors(url);
        this.allCoors[this.getPdfName(url)].pdfDoc = _pdfDoc;
        this.pdfDoc = _pdfDoc;
        if (this.coor.length == 0) {
            for (var i = 0; i < this.pdfDoc.numPages; i++) {
                this.coor.push([]);
            }
        }
        //this.createPages();
        //document.getElementById("page-count").textContent = this.pdfDoc.numPages;
        //this.renderPage(this.pageNum);
        //this.renderAll();
        //document.getElementById("cms-page-index").textContent = 1; // Will Change Into A Function
        //        document.getElementById("cms-num-pages").textContent = this.pdfDoc.numPages;
        this.createPages(viewer);
        //        var printViewer = document.getElementById("cms-print-viewer");
        //        this.createPages(printViewer);
        //        this.appendCanvas(document.querySelector(".cms-pdf-render"));
        //        this.appendSvg(document.querySelector(".cms-svg"));
        //        this.width = this.canvas.width;
        //        this.height = this.canvas.height;

        this.renderAll(viewer);
        //this.renderAll(printViewer, 1);
        this.addPdfEvents();
        if (viewerId == "viewer_0") {
            this.updateCms(this.urlArr[0], fileName);
        }
        //this.enablePrint();
    });
}

MosCmsViewer.prototype.createViewer = function (num) {
    var viewerContainer = document.createElement("div");
    viewerContainer.id = "viewerContainer_" + num;
    viewerContainer.classList.add("cmsDiv");
    viewerContainer.classList.add("cms-viewerContainer");
    var viewer = document.createElement("div");
    viewer.id = "viewer_" + num;
    viewer.classList.add("cms-viewer");
    viewer.classList.add("cms-pdfViewer");
    viewer.classList.add("cms-container");
    viewerContainer.appendChild(viewer);
    var scrollContainer = document.createElement("div");
    scrollContainer.classList.add("scroll-cms-container");
    viewerContainer.appendChild(scrollContainer);
    var scroll = document.createElement("div");
    scroll.classList.add("scroll-cms");
    scrollContainer.appendChild(scroll);
    document.getElementById("cms-pdf-area").appendChild(viewerContainer);
}

MosCmsViewer.prototype.matchCoors = function (url) {
    var pdfName = this.getPdfName(url);
    if (!this.allCoors[pdfName]) {
        this.allCoors[pdfName] = {
            scrollCoors: 0,
            markerCoors: [],
            pageCoors: 1,
            rotation: 0,
            scale: 1.35
        };
    }
    this.viewer.scrollTop = this.allCoors[pdfName].scrollCoors;
    this.coor = this.allCoors[pdfName].markerCoors;
    document.getElementById("cms-page-index").innerHTML = this.allCoors[pdfName].pageCoors;
    this.pagesRotation = this.allCoors[pdfName].rotation;
    this.scale = this.allCoors[pdfName].scale;
    this.pdfDoc = this.allCoors[pdfName].pdfDoc;
}

// sets URL of the PDF
MosCmsViewer.prototype.setURL = function (url) {
    if (this.urlArr.indexOf(url) === -1) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            resolve(_this.addURL(url));
        }).then(function () {
            _this.url = url;
        });
    } else {
        return this.url = url;
    }
}

MosCmsViewer.prototype.addURL = function (url) {
    this.urlArr.push(url);
    this.createViewer(this.urlArr.indexOf(url));
    return this.createPdfViewer(url, "viewer_" + this.urlArr.indexOf(url));
}

MosCmsViewer.prototype.setViewer = function (viewerId) {
    this.viewer = document.getElementById(viewerId);
    this.viewerContainer = this.viewer.parentElement;
}

MosCmsViewer.prototype.getPdfName = function (url) {
    var splitUrl = url.split("/");
    var pdfFile = splitUrl[splitUrl.length - 1];
    return pdfFile.replace(".pdf", "");
}

// using a lot of similar code to updateCms, might need update
MosCmsViewer.prototype.emptyViewer = function () {
    if (this.viewer == null) {
        return;
    }
    this.setViewer("viewer_empty");
    document.getElementById("cms-num-pages").textContent = this.pdfDoc.numPages;
    if (document.querySelector(".cms-current-document")) {
        document.querySelector(".cms-current-document").classList.remove("cms-current-document");
    }
    this.viewerContainer.classList.add("cms-current-document");
    this.title.innerHTML = "";
}

MosCmsViewer.prototype.clearPdf = function () {
    this.clearViewer(this.viewer);
    this.clearViewer(document.getElementById("cms-print-viewer"));
}

MosCmsViewer.prototype.clearViewer = function (viewer) {
    if (viewer == null) {
        return;
    }
    viewer.innerHTML = "<div id=\"cms-brush\" hidden></div>";
    this.brush = document.getElementById('cms-brush');
}

// Appends both a canvas and its context
MosCmsViewer.prototype.appendCanvas = function (canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
}

MosCmsViewer.prototype.appendSvg = function (svg) {
    this.svg = svg;
    //this.svgCtx = svg.getContext("2d");
}

MosCmsViewer.prototype.createPages = function (viewer, numPages) {
    const count = numPages ? numPages : this.pdfDoc.numPages;
    for (var i = 1; i <= count; i++) {
        var page = document.createElement("div");
        viewer.appendChild(page);
        page.classList.add("cms-page");
        page.setAttribute("data-page-number", i);
        var canvasWraper = document.createElement("div");
        page.appendChild(canvasWraper);
        canvasWraper.classList.add("cms-canvasWraper");
        var canvas = document.createElement("canvas");
        canvasWraper.appendChild(canvas);
        canvas.classList.add("cms-pdf-render");
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        canvasWraper.appendChild(svg);
        svg.classList.add("cms-svg");
    }
}

MosCmsViewer.prototype.rotateCanvas = function (elem) {
    var temp = elem.clientHeight;
    elem.style.height = elem.clientWidth + "px";
    elem.style.width = temp + "px";
}

// Render The Page
MosCmsViewer.prototype.renderPage = function (viewer, num, scale) {
    this.pageIsRendering = true;
    var viewerIdName = "#" + viewer.id; //className.split(" ")[0];
    //Get page
    return this.pdfDoc.getPage(num).then(page => {
        var queryValue = viewerIdName + " [data-page-number=\"" + num + "\"]";

        // Set scale
        this.appendCanvas(document.querySelector(queryValue + " .cms-pdf-render"));
        this.appendSvg(document.querySelector(queryValue + " .cms-svg"));
        var viewport = page.getViewport({ scale: scale, rotation: this.pagesRotation });
        document.querySelector(queryValue).style.height = viewport.height + "px";
        document.querySelector(queryValue).style.width = viewport.width + "px";
        this.canvas.height = viewport.height;
        this.canvas.width = viewport.width;
        this.svg.height = viewport.height;
        this.svg.width = viewport.width;
        //this.rotateCanvas(this.canvas.parentElement.parentElement);

        var renderCtx = {
            canvasContext: this.ctx,
            viewport: viewport
        };
        // //console.log(document.querySelector("[data-page-number=\"" + num + "\"]").offsetTop)

        //console.log(page.getTextContent());
        return page.render(renderCtx).promise.then(() => {
            this.pageIsRendering = false;
            if (this.pageNumIsPending !== null) {
                this.renderPage(this.pageNumIsPending);
                this.pageNumIsPending = null;
            }

            //var data = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.width);
            //this.ctx.putImageData(data, 0, 0);

            return new Promise(function (resolve, reject) {
                resolve(document.querySelector(viewerIdName + " [data-page-number=\"" + num + "\"]"));
            });
        });


        //document.querySelector("[data-page-number=" + num + "]").setAttribute("data-loaded", "true");
    });
}

// Temp Render All
MosCmsViewer.prototype.renderAll = function (viewer, scale) {
    if (!scale) {
        scale = this.scale;
    }
    var _this = this;
    var prevUrl = this.url;
    //this.matchCoors(this.url);
    var thisViewer = (viewer == _this.viewer); // check if the viewer is the main viewer of the cms
    if (thisViewer) {
        this.pagesPending += this.pdfDoc.numPages;
    }
    var pagesRendering = this.pdfDoc.numPages;
    var viewerIdName = "#" + viewer.id; //className.split(" ")[0];
    for (var i = 1; i <= this.pdfDoc.numPages; i++) {
        new Promise(function (resolve, reject) {
            resolve(i);
        }).then(function (resolved) {
            var queryValue = viewerIdName + " [data-page-number=\"" + resolved + "\"]";
            var currentPage = document.querySelector(queryValue);
            _this.appendCanvas(document.querySelector(queryValue + " .cms-pdf-render"));
            //_this.canvas.style.height = "1404px";
            //_this.canvas.style.width = "993px";
            _this.appendSvg(document.querySelector(queryValue + " .cms-svg"));
            //_this.svg.style.width = "993px";
            //_this.svg.style.height = "1404px";
            return _this.renderPage(viewer, resolved, scale);
            //return new Promise(function (resolve, reject) {
            //    resolve(currentPage);
            //});
        }).then(function (currentPage) {
            currentPage.setAttribute("data-loaded", "true");
            if (thisViewer) {
                var _i = Number(currentPage.getAttribute("data-page-number")) - 1;
                _this.url = _this.urlArr[Number(currentPage.parentElement.id.replace("viewer_", ""))];
                _this.repaint(_i, currentPage.parentElement);
                _this.pagesPending--;
            }
            pagesRendering--;
            if (pagesRendering === 0) {
                _this.matchCoors(prevUrl);
                _this.url = prevUrl;
            }
        });
    }
}

// Check for pages Rendering
MosCmsViewer.prototype.queueRenderPage = function (num) {
    if (this.pageIsRendering) {
        this.pageNumIsPending = num;
    } else {
        this.renderPage(num);
    }
}

MosCmsViewer.prototype.flagCopy = function () {
    this.copyFlag = !this.copyFlag;
    if (this.copyFlag) {
        this.copyButton.classList.add("cms-enabled");
        this.canvas1Container.classList.remove("cmsHiddenScreen");
        this.canvas1Container.parentElement.classList.remove("cmsHiddenScreen");
        this.allWas.classList.add("cmsHiddenScreen");
        document.getElementById("cms-split-canvas-area").classList.add("cmsHidden");
        document.getElementById("cms-compare-area").classList.add("cmsHidden");
        document.getElementById("cms-split-send-button-container").classList.add("cmsHiddenScreen");
        if (this.markFlag) {
            this.flagMark();
        }
    } else {
        this.copyButton.classList.remove("cms-enabled");
    }
    this.validateCrosshair();
}

MosCmsViewer.prototype.flagMark = function () {
    this.markFlag = !this.markFlag;
    if (this.markFlag) {
        this.markButton.classList.add("cms-enabled");
        document.getElementById("cms-compare-area").classList.add("cms-enabled");
        if (this.copyFlag) {
            this.flagCopy();
        }
    } else {
        this.markButton.classList.remove("cms-enabled");
        document.getElementById("cms-compare-area").classList.remove("cms-enabled");
    }
    this.validateCrosshair();
}

MosCmsViewer.prototype.validateCrosshair = function () {
    if (!this.markFlag && !this.copyFlag) {
        this.viewer.classList.add("cms-disabled-crosshair");
    } else {
        this.viewer.classList.remove("cms-disabled-crosshair");
    }
}

// Get Document
MosCmsViewer.prototype.getDocument = function () {
    return pdfjsLib.getDocument(this.url).promise;
}

MosCmsViewer.prototype.getBase64Document = function () {
    return pdfjsLib.getDocument({ data: atob(this.url) }).promise;
}

// marker_copy.js
MosCmsViewer.prototype.reCalc = function () {
    this.x3 = Math.min(this.x1, this.x2);
    this.x4 = Math.max(this.x1, this.x2);
    this.y3 = Math.min(this.y1, this.y2);
    this.y4 = Math.max(this.y1, this.y2);
    this.brush.style.left = this.x3 + 'px';
    this.brush.style.top = this.y3 + 'px';
    this.brush.style.width = this.x4 - this.x3 + 'px';
    this.brush.style.height = this.y4 - this.y3 + 'px';
}

MosCmsViewer.prototype.setMarkup = function (e, canvas, svg) {
    if (!this.isPending()) {
        if ((!this.copyFlag && !this.markFlag) || (e.target.tagName == "image" /*|| e.target.tagName == "svg"*/)) {
            return;
        }
        this.appendCanvas(canvas);
        this.appendSvg(svg);
        //console.log(this.svg.offsetLeft);
        this.brush.hidden = 0;
        this.x1 = e.clientX;
        this.y1 = e.clientY;
        this.x2 = e.clientX;
        this.y2 = e.clientY;
        this.reCalc();
    }
}

MosCmsViewer.prototype.updateMarkup = function (e) {
    if (!this.copyFlag && !this.markFlag) {
        return;
    }
    if (e.target == this.svg || e.target.tagName == "rect") {
        this.x2 = e.clientX;
        this.y2 = e.clientY/* - this.viewerContainer.offsetTop + this.viewer.scrollTop - this.viewer.offsetTop*/;
        this.reCalc();
    }
}

MosCmsViewer.prototype.markup = function (e) {
    if (!this.copyFlag && !this.markFlag) {
        return;
    }

    if (this.brush.hidden == 0) {

        var page = this.canvas.parentElement.parentElement;
        this.x3 = Math.min(this.x1, this.x2)/* - page.offsetLeft*/ - this.viewerContainer.offsetLeft - this.viewer.offsetLeft - page.offsetLeft;
        this.x4 = Math.max(this.x1, this.x2)/* - page.offsetLeft*/ - this.viewerContainer.offsetLeft - this.viewer.offsetLeft - page.offsetLeft;
        this.y3 = Math.min(this.y1, this.y2)/* - page.offsetTop*/ - this.viewerContainer.offsetTop + this.viewer.scrollTop - page.offsetTop;
        this.y4 = Math.max(this.y1, this.y2)/* - page.offsetTop*/ - this.viewerContainer.offsetTop + this.viewer.scrollTop - page.offsetTop;
        this.dx = this.x4 - this.x3;
        this.dy = this.y4 - this.y3;
        console.log("I'm probably here!!!");
        if (this.dx && this.dy) {
            if (this.markFlag) {
                var idx = Number(this.svg.parentElement.parentElement.getAttribute("data-page-number")) - 1;
                this.paint(idx, this.x3, this.y3, this.dx, this.dy);
            } else if (this.copyFlag) {
                var data = this.ctx.getImageData(this.x3, this.y3, this.dx, this.dy);

                var newCanvas = document.createElement("canvas");
                newCanvas.width = this.dx;
                newCanvas.height = this.dy;

                var canvas1 = document.getElementById("cms-side-canvas");
                var img = document.createElement("img");
                img.src = "images/cms-icons/icn_remove.png";

                var newCanvasContainer = document.createElement("div");
                canvas1.appendChild(newCanvasContainer);
                newCanvasContainer.appendChild(newCanvas);
                newCanvasContainer.appendChild(img);
                newCanvasContainer.classList.add("side-canvas-container");
                img.style.top = -img.clientHeight * 2 / 3 + "px"; // -15 = margin top
                console.log(img.clientWidth);
                img.style.left = newCanvas.clientWidth - img.clientWidth  / 3 + "px";
                var newCtx = newCanvas.getContext("2d");
                newCtx.putImageData(data, 0, 0);

                this.canvas1Container.classList.remove("cmsHiddenScreen");
                this.canvas1Container.parentElement.classList.remove("cmsHiddenScreen");
                this.allWas.classList.add("cmsHiddenScreen");
                document.getElementById("cms-split-canvas-area").classList.add("cmsHidden");
                document.getElementById("cms-compare-area").classList.add("cmsHidden");
                document.getElementById("cms-split-send-button-container").classList.add("cmsHiddenScreen");


                img.onclick = function (e) {
                    e.target.parentElement.remove();
                }
            }

        }
        this.brush.hidden = 1;
    }
}

MosCmsViewer.prototype.scrollToNextPage = function (e) {
    if (Number(document.getElementById("cms-page-index").innerHTML) >= Number(document.getElementById("cms-num-pages").innerHTML)) {
        return;
    }
    document.getElementById("cms-page-index").innerHTML = Number(document.getElementById("cms-page-index").innerHTML) + 1;
    if (Number(document.getElementById("cms-page-index").innerHTML) == this.pdfDoc.numPages) {
        this.nextPageButton.classList.add("cms-unselectable");
    } else {
        this.prevPageButton.classList.remove("cms-unselectable");
    }
    var idx = document.getElementById("cms-page-index").innerHTML;
    this.viewer.scrollTop = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + idx + "\"]").offsetTop;
    this.updateScrollCmsPosition(document.querySelector("#" + this.viewerContainer.id + " .scroll-cms"));
}

MosCmsViewer.prototype.scrollToPrevPage = function (e) {
    if (Number(document.getElementById("cms-page-index").innerHTML) <= 1) {
        return;
    }
    document.getElementById("cms-page-index").innerHTML = Number(document.getElementById("cms-page-index").innerHTML) - 1;
    if (Number(document.getElementById("cms-page-index").innerHTML) == 1) {
        this.prevPageButton.classList.add("cms-unselectable");
    } else {
        this.nextPageButton.classList.remove("cms-unselectable");
    }
    var idx = document.getElementById("cms-page-index").innerHTML;
    this.viewer.scrollTop = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + idx + "\"]").offsetTop;
    this.updateScrollCmsPosition(document.querySelector("#" + this.viewerContainer.id + " .scroll-cms"));
}

MosCmsViewer.prototype.loadNextDocument = function (e) {
    var newIdx = (this.urlArr.indexOf(this.url) + 1) % this.urlArr.length;
    document.getElementById("Files_display_Row" + (newIdx + 1)).click();
    //this.updateCms(this.urlArr[newIdx]);
}

MosCmsViewer.prototype.setNextFunction = function (callbackFunction) {
    if (this.nextDocFunc) {
        this.nextDocButton.removeEventListener("click", this.nextDocFunc);
    }
    this.nextDocFunc = callbackFunction;
    this.nextDocButton.addEventListener("click", callbackFunction);
}

MosCmsViewer.prototype.setPrevFunction = function (callbackFunction) {
    if (this.prevDocFunc) {
        this.prevDocButton.removeEventListener("click", this.prevDocFunc);
    }
    this.prevDocFunc = callbackFunction;
    this.prevDocButton.addEventListener("click", callbackFunction);
}

MosCmsViewer.prototype.loadPrevDocument = function (e) {
    var newIdx = (this.urlArr.length + this.urlArr.indexOf(this.url) - 1) % this.urlArr.length;
    document.getElementById("Files_display_Row" + (newIdx + 1)).click();
    //this.updateCms(this.urlArr[newIdx]);
}

MosCmsViewer.prototype.clearSideCanvas = function () {
    var cont = document.getElementById("cms-side-canvas");
    while (cont.children.length > 0) {


        cont.lastChild.remove();
        //var ctx = canvas.getContext("2d");
        //ctx.clearRect(0, 0, canvas.width, canvas.height);
        //this.canvas1.height = 16; // padding between copied elements
        //this.markerImg = this.canvas1.height;
    }
}

MosCmsViewer.prototype.addBarEvents = function () {
    var _this = this;
    this.copyButton.addEventListener("click", function (e) {
        _this.flagCopy();
    });
    this.markButton.addEventListener("click", function (e) {
        _this.flagMark();
    });
    document.getElementById("cms-split-file-button").addEventListener("click", function () {
        //_this.splitPages(Number(document.getElementById("cms-page-index").innerHTML));
        _this.splitPagesButtonClick();
    });

    document.getElementById("cms-compare-button-container").addEventListener("click", function () {
        _this.compareButtonClick();
    });

    document.getElementById("cms-x").addEventListener("click", function () {
        _this.clearSideCanvas();
    })

    document.getElementById("cms-rotate90").addEventListener("click", function (e) { _this.rotate90(); });

    document.getElementById("cms-plus").addEventListener("click", function (e) {
        _this.changeSize(0.1);
    });

    document.getElementById("cms-minus").addEventListener("click", function (e) {
        _this.changeSize(-0.1);
    });
    //document.getElementById("cms-print").addEventListener("click", function (e) { _this.print(); /*window.print();*/ });
    //_this.loadScrollCms(_this.viewerContainer);
    window.addEventListener("mouseup", function (e) {
        _this.markup(e);
    });

    var button = document.getElementById("cms-split-send-button-container");
    button.onclick = function (ev) {
        var splitBorders = document.querySelectorAll(".split-border");
        var arr = []
        for (var i = 0; i < splitBorders.length; i++) {
            arr.push(splitBorders[i].id.replace("split-canvas-", ""));
        }
        alert(arr)
    }

    this.nextPageButton.addEventListener("click", function (e) { _this.scrollToNextPage(e); });
    this.prevPageButton.addEventListener("click", function (e) { _this.scrollToPrevPage(e); });
    //this.nextDocButton.addEventListener("click", function (e) { _this.loadNextDocument(e); });
    //this.prevDocButton.addEventListener("click", function (e) { _this.loadPrevDocument(e); });
    this.setNextFunction(this.nextDocFunc);
    this.setPrevFunction(this.prevDocFunc);
    document.getElementById("cms-x").addEventListener("click", function (e) {
        _this.canvas1Container.classList.add("cmsHiddenScreen");
        if (_this.copyButton.classList.contains("cms-enabled")) {
            _this.flagCopy();
        }
        //_this.splitFile(2);
    });

}

MosCmsViewer.prototype.addPdfEvents = function () {
    // Button Events
    var _this = this;
    //document.getElementById("prev-page").addEventListener("click", function (e) {
    //    _this.showPrevPage(e);
    //});
    //document.getElementById("next-page").addEventListener("click", function (e) {
    //    _this.showNextPage(e);
    //});

    var svgs = document.querySelectorAll(".cms-svg");
    for (var i = 0; i < svgs.length; i++) {
        //var _canvas = document.querySelector("[data-page-number=\"" + (i + 1) + "\"] .pdf-render");
        //var _svg = document.querySelector("[data-page-number=\"" + (i + 1) + "\"] .svg");
        svgs[i].addEventListener("mousedown", function (e) {
            _this.setMarkup(e, e.target.parentElement.children[0], e.target);
        });

        svgs[i].addEventListener("mousemove", function (e) {
            _this.updateMarkup(e);
        });

    }



    //this.viewerContainer.addEventListener("scroll", function (e) {
    //    _this.upOrDown();
    //});

    this.brush.addEventListener("mousemove", function (e) {
        _this.updateMarkup(e);
    });



    //_this.updateScrollCmsPosition(_this.viewerContainer.getElementsByClassName("scroll-cms")[0]);


    //document.getElementById("rotate-90").addEventListener("click", function (e) { _this.rotateM90(); });
    //document.getElementById("rotate180").addEventListener("click", function (e) { _this.rotate180(); });

    //this.merge.addEventListener("click", function (e) {
    //    _this.mergeToCanvas(e);
    //});
}

MosCmsViewer.prototype.changeSize = function (size) {
    var _this = this;
    if (!_this.isPending()) {
        _this.resizeCoor(size);
        _this.renderAll(_this.viewer);
    } else {
        setTimeout(function () { _this.changeSize(size); }, 300);
    }
}

MosCmsViewer.prototype.resizeCoor = function (a) {
    if (a === 0 || this.scale + a <= 0) {
        return;
    }
    for (var i = 0; i < this.pdfDoc.numPages; i++) {
        for (var j = 0; j < this.coor[i].length; j++) {
            for (var k = 0; k < 4; k++) {
                this.coor[i][j][k] += this.coor[i][j][k] * a / this.scale;
            }
        }
    }
    this.scale += a;
    this.allCoors[this.getPdfName(this.url)].scale = this.scale;
}

MosCmsViewer.prototype.upOrDown = function (diff) {
    var pdfName = this.getPdfName(this.url);
    this.pdfDoc = this.allCoors[pdfName].pdfDoc;
    if (diff > 0) {
        this.scrollDown();
    } else {
        this.scrollUp();
    }
    this.allCoors[pdfName].scrollCoors = this.viewer.scrollTop;
    this.allCoors[pdfName].pageCoors = Number(document.getElementById("cms-page-index").innerHTML);
    //this.scrollBar = this.viewerContainer.scrollTop;
}

MosCmsViewer.prototype.scrollDown = function () {
    var pageNum = document.getElementById("cms-page-index");
    if (Number(pageNum.innerHTML) < this.pdfDoc.numPages) {
        var viewerId = "#" + this.viewer.id;
        var nextPage = document.querySelector(viewerId + " [data-page-number=\"" + (Number(pageNum.innerHTML) + 1) + "\"]");
        var nextScroll = nextPage.offsetTop;
        if (this.viewer.scrollTop >= nextScroll - nextPage.clientHeight / 2) {
            pageNum.innerHTML = Number(pageNum.innerHTML) + 1;
            if (Number(pageNum.innerHTML) == this.pdfDoc.numPages) {
                this.nextPageButton.classList.add("cms-unselectable");
            } else {
                this.prevPageButton.classList.remove("cms-unselectable");
            }
        }
    }
}

MosCmsViewer.prototype.scrollUp = function () {
    var pageNum = document.getElementById("cms-page-index");
    if (Number(pageNum.innerHTML) > 1) {
        var viewerId = "#" + this.viewer.id;
        var prevPage = document.querySelector(viewerId + " [data-page-number=\"" + (Number(pageNum.innerHTML) - 1) + "\"]");
        var prevScroll = prevPage.offsetTop;
        if (this.viewer.scrollTop <= prevScroll + prevPage.clientHeight / 2) {
            pageNum.innerHTML = Number(pageNum.innerHTML) - 1;
            if (Number(pageNum.innerHTML) == 1) {
                this.prevPageButton.classList.add("cms-unselectable");
            } else {
                this.nextPageButton.classList.remove("cms-unselectable");
            }
        }
    }
}

MosCmsViewer.prototype.rotate = function (deg) {
    this.pagesRotation = (this.pagesRotation + 360 + deg) % 360;
    this.allCoors[this.getPdfName(this.url)].rotation = this.pagesRotation;
    this.renderAll(this.viewer);
    this.readyForPrint = false;
    //    this.renderAll(document.getElementById("cms-print-viewer"));
    //    this.enablePrint();
    //this.repaint();
}

MosCmsViewer.prototype.rotate90 = function () {
    var _this = this;
    if (!this.isPending()) {
        var viewerId = "#" + this.viewer.id;
        for (var i = 1; i <= this.pdfDoc.numPages; i++) {
            this.rotateCanvas(document.querySelector(viewerId + " [data-page-number=\"" + i + "\"]"));
        }
        this.rotate(90);
    } else {
        setTimeout(function () { _this.rotate90; }, 300);
    }
}

MosCmsViewer.prototype.repaint = function (pageIdx, viewer) {
    if (!viewer) {
        viewer = this.viewer;
    }
    var viewerIdName = "#" + viewer.id;
    this.appendCanvas(document.querySelector(viewerIdName + " [data-page-number=\"" + (pageIdx + 1) + "\"] .cms-pdf-render"));
    this.appendSvg(document.querySelector(viewerIdName + " [data-page-number=\"" + (pageIdx + 1) + "\"] .cms-svg"));
    var viewerIndex = Number(viewerIdName.replace("#viewer_", ""));
    switch (this.pagesRotation) {
        case 90:
            this.repaint90(pageIdx, viewerIndex);
            break;
        case 180:
            this.repaint180(pageIdx, viewerIndex);
            break;
        case 270:
            this.repaint270(pageIdx, viewerIndex);
            break;
        default:
            this.repaint0(pageIdx, viewerIndex);
            break;
    }
}

MosCmsViewer.prototype.repaint0 = function (i, viewerIndex) {
    this.coor = this.allCoors[this.getPdfName(this.urlArr[viewerIndex])].markerCoors;
    for (var j = 0; j < this.coor[i].length; j++) {
        // [0] = x, [1] = y, [2] = width, [3] = height
        var rect = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[0];
        rect.setAttribute("x", this.coor[i][j][0]);
        rect.setAttribute("y", this.coor[i][j][1]);
        rect.setAttribute("width", this.coor[i][j][2]);
        rect.setAttribute("height", this.coor[i][j][3]);
        var image = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[1];
        image.setAttribute("x", this.coor[i][j][0] + this.coor[i][j][2] - 10.5);
        image.setAttribute("y", this.coor[i][j][1] - 10.5);
        //this.svgCtx.fillStyle = "hsla(60, 100%, 50%, 0.5)";
        //this.svgCtx.fillRect(this.coor[i][j][0], this.coor[i][j][1], this.coor[i][j][2], this.coor[i][j][3]);
    }
}

MosCmsViewer.prototype.repaint90 = function (i, viewerIndex) {
    this.coor = this.allCoors[this.getPdfName(this.urlArr[viewerIndex])].markerCoors;
    for (var j = 0; j < this.coor[i].length; j++) {
        // [0] = x, [1] = y, [2] = width, [3] = height
        var rect = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[0];
        rect.setAttribute("x", this.svg.width.animVal.value - this.coor[i][j][1] - this.coor[i][j][3]);
        rect.setAttribute("y", this.coor[i][j][0]);
        rect.setAttribute("width", this.coor[i][j][3]);
        rect.setAttribute("height", this.coor[i][j][2]);
        var image = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[1];
        image.setAttribute("x", this.svg.width.animVal.value - this.coor[i][j][1] - 10.5);
        image.setAttribute("y", this.coor[i][j][0] - 10.5);
        //this.svgCtx.fillStyle = "hsla(60, 100%, 50%, 0.5)";
        //this.svgCtx.fillRect(this.svg.width - this.coor[i][j][1] - this.coor[i][j][3], this.coor[i][j][0], this.coor[i][j][3], this.coor[i][j][2]);
    }
}

MosCmsViewer.prototype.repaint180 = function (i, viewerIndex) {
    this.coor = this.allCoors[this.getPdfName(this.urlArr[viewerIndex])].markerCoors;
    for (var j = 0; j < this.coor[i].length; j++) {
        // [0] = x, [1] = y, [2] = width, [3] = height
        var rect = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[0];
        rect.setAttribute("x", this.svg.width.animVal.value - this.coor[i][j][0] - this.coor[i][j][2]);
        rect.setAttribute("y", this.svg.height.animVal.value - this.coor[i][j][1] - this.coor[i][j][3]);
        rect.setAttribute("width", this.coor[i][j][2]);
        rect.setAttribute("height", this.coor[i][j][3]);
        var image = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[1];
        image.setAttribute("x", this.svg.width.animVal.value - this.coor[i][j][0] - 10.5);
        image.setAttribute("y", this.svg.height.animVal.value - this.coor[i][j][1] - this.coor[i][j][3] - 10.5);
        //this.svgCtx.fillStyle = "hsla(60, 100%, 50%, 0.5)";
        //this.svgCtx.fillRect(this.svg.width - this.coor[i][j][0] - this.coor[i][j][2], this.svg.height - this.coor[i][j][1] - this.coor[i][j][3], this.coor[i][j][2], this.coor[i][j][3]);
    }
}

MosCmsViewer.prototype.repaint270 = function (i, viewerIndex) {
    this.coor = this.allCoors[this.getPdfName(this.urlArr[viewerIndex])].markerCoors;
    for (var j = 0; j < this.coor[i].length; j++) {
        // [0] = x, [1] = y, [2] = width, [3] = height
        var rect = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[0];
        rect.setAttribute("x", this.coor[i][j][1]);
        rect.setAttribute("y", this.svg.height.animVal.value - this.coor[i][j][0] - this.coor[i][j][2]);
        rect.setAttribute("width", this.coor[i][j][3]);
        rect.setAttribute("height", this.coor[i][j][2]);
        var image = document.querySelector("#" + this.viewer.id + " [data-page-number=\"" + (i + 1) + "\"] .cms-svg").children[j].children[1];
        image.setAttribute("x", this.coor[i][j][1] + this.coor[i][j][3] - 10.5);
        image.setAttribute("y", this.svg.height.animVal.value - this.coor[i][j][0] - this.coor[i][j][2] - 10.5);
        //this.svgCtx.fillStyle = "hsla(60, 100%, 50%, 0.5)";
        //this.svgCtx.fillRect(this.coor[i][j][1], this.svg.height - this.coor[i][j][0] - this.coor[i][j][2], this.coor[i][j][3], this.coor[i][j][2]);
    }
}

MosCmsViewer.prototype.paint = function (idx, x, y, width, height) {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    this.svg.appendChild(g);
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    g.appendChild(rect);
    g.setAttributeNS(null, "x", x);
    g.setAttributeNS(null, "y", y);
    g.setAttributeNS(null, "width", width);
    g.setAttributeNS(null, "height", height);
    rect.setAttributeNS(null, "x", x);
    rect.setAttributeNS(null, "y", y);
    rect.setAttributeNS(null, "width", width);
    rect.setAttributeNS(null, "height", height);
    rect.setAttributeNS(null, "fill", "hsl(60, 100%, 50%)");
    rect.setAttributeNS(null, "fill-opacity", "0.5");
    rect.setAttributeNS(null, "pointer-events", "none");
    var image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttributeNS(null, "href", "images/cms-icons/icn_remove.png");
    image.setAttributeNS(null, "x", x + width - 10.5);
    image.setAttributeNS(null, "y", y - 10.5);
    image.setAttributeNS(null, "width", "21px");
    image.setAttributeNS(null, "height", "21px");
    g.appendChild(image);
    var _this = this;
    image.onclick = function (e) {
        var parent = e.target.parentElement.parentElement
        var index = Array.prototype.indexOf.call(parent.children, e.target);
        for (var i = index; i < parent.children.length - 1; i++) {
            _this.coor[idx][i] = _this.coor[idx][i + 1];
        }
        _this.coor[idx].pop();
        e.target.parentElement.remove();
    }
    switch (this.pagesRotation) {
        case 90:
            this.updateCoor90(idx, x, y, width, height);
            break;
        case 180:
            this.updateCoor180(idx, x, y, width, height);
            break;
        case 270:
            this.updateCoor270(idx, x, y, width, height);
            break;
        default:
            this.updateCoor0(idx, x, y, width, height);
            break;
    }
}

MosCmsViewer.prototype.updateCoor0 = function (idx, x, y, width, height) {
    this.coor[idx].push([x, y, width, height]);
}

MosCmsViewer.prototype.updateCoor90 = function (idx, x, y, width, height) {
    this.coor[idx].push([y, this.svg.width.animVal.value - x - width, height, width]);
}

MosCmsViewer.prototype.updateCoor180 = function (idx, x, y, width, height) {
    this.coor[idx].push([this.svg.width.animVal.value - x - width, this.svg.height.animVal.value - y - height, width, height]);
}

MosCmsViewer.prototype.updateCoor270 = function (idx, x, y, width, height) {
    this.coor[idx].push([this.svg.height.animVal.value - y - height, x, height, width]);
}

MosCmsViewer.prototype.createSubHTML = function (firstPage, lastPage) {
    var html = "<!DOCTYPE html><html><head></head><body>";
    const currPdfId = "#" + this.viewer.id;
    for (var i = firstPage; i <= lastPage; i++) {
        var canvas = document.querySelector(currPdfId + " [data-page-number=\"" + i + "\"] canvas");
        var img = document.createElement("img");
        img.src = canvas.toDataURL();
        var page = document.createElement("page");
        page.appendChild(img);
        html += page.outerHTML;
    }
    html += "</body></html>"
    return html;
}

MosCmsViewer.prototype.splitPages = function (pageToSplit) {
    if (pageToSplit >= this.pdfDoc.numPages) {
        return;
    }
    var firstHTML = this.createSubHTML(1, pageToSplit);
    var secondHTML = this.createSubHTML(pageToSplit + 1, this.pdfDoc.numPages);
    var objToServer = {
        "originalFileHTML": firstHTML,
        "newFileHTML": secondHTML,
        "splitInPageNumber": pageToSplit,
        "fileUrlOrBase64": this.url
    };
    console.log(firstHTML)
    console.log(secondHTML)
    alert("sending to server, split " + this.url + " in page: " + pageToSplit);
}

MosCmsViewer.prototype.splitPagesButtonClick = function (ev) {
    const _this = this;
    this.toggleSplitCanvasArea();
    const viewerId = "#" + this.viewer.id;
    const numPages = this.pdfDoc.numPages;
    const splitCanvasArea = document.getElementById("cms-split-canvas-area");
    splitCanvasArea.innerHTML = "";
    var container = document.createElement("div");
    container.classList.add("split-canvas-container");
    container.classList.add("cms-container");
    splitCanvasArea.appendChild(container);
    var scrollContainer = document.createElement("div");
    scrollContainer.classList.add("scroll-cms-container");
    splitCanvasArea.appendChild(scrollContainer);
    var scroll = document.createElement("div");
    scroll.classList.add("scroll-cms");
    scrollContainer.appendChild(scroll);
    for (var i = 1; i <= numPages; i++) {
        var div = document.createElement("div");
        var img = document.createElement("img");
        var span = document.createElement("span");
        var canvas = document.querySelector(viewerId + " [data-page-number=\"" + i + "\"] canvas");
        container.appendChild(div);
        div.appendChild(img);
        div.appendChild(span);
        img.src = canvas.toDataURL();
        img.style.maxWidth = "100%";
        img.style.height = "auto";
        span.innerHTML = i;
        span.style.display = "block";
        span.style.margin = "auto";
        span.style.width = "fit-content";
        span.style.paddingBottom = "5px";
        div.id = "split-canvas-" + i;
        div.style.height = "fit-content";
        div.onclick = function (ev) {
            if (ev.currentTarget.classList.contains("split-border")) {
                ev.currentTarget.classList.remove("split-border");
            } else {
                ev.currentTarget.classList.add("split-border");
            }
            //_this.updateSplitAreaScheme(ev);

        }
    }
    this.loadScrollCms(splitCanvasArea);
}

MosCmsViewer.prototype.updateSplitAreaScheme = function (ev) {
    var lineBreak = 1;

    if (!document.querySelector(".split-border")) {
        var divs = document.querySelectorAll("#cms-split-canvas-area > div");
        while (lineBreak <= divs.length) {
            document.getElementById("split-canvas-" + lineBreak).style.border = "none";
            lineBreak++;
        }
        return;
    }
    const scheme = ["#1b9e77", "#d95f02", "#7570b3", "#e7298a", "#66a61e", "#e6ab02", "#a6761d", "#666666"];
    var splitBorders = document.querySelectorAll(".split-border");
    for (var i = 0; i < splitBorders.length; i++) {
        const limit = Number(splitBorders[i].id.replace("split-canvas-", ""));
        while (lineBreak <= limit) {
            document.getElementById("split-canvas-" + lineBreak).style.border = "10px solid " + scheme[i % scheme.length];
            lineBreak++;
        }
    }
    var divs = document.querySelectorAll("#cms-split-canvas-area > div");
    while (lineBreak <= divs.length) {
        document.getElementById("split-canvas-" + lineBreak).style.border = "none";
        lineBreak++;
    }
}

MosCmsViewer.prototype.toggleSplitCanvasArea = function () {
    this.canvas1Container.classList.add("cmsHiddenScreen");
    this.canvas1Container.parentElement.classList.add("cmsHiddenScreen");
    document.getElementById("cms-compare-area").classList.add("cmsHidden");
    this.allWas.classList.add("cmsHiddenScreen");
    var splitCanvasArea = document.getElementById("cms-split-canvas-area");
    if (splitCanvasArea.classList.contains("cmsHidden")) {
        splitCanvasArea.classList.remove("cmsHidden");
        document.getElementById("cms-split-send-button-container").classList.remove("cmsHiddenScreen");
    } else {
        splitCanvasArea.classList.add("cmsHidden");
        document.getElementById("cms-split-send-button-container").classList.add("cmsHiddenScreen");
    }
}

MosCmsViewer.prototype.compareButtonClick = function (ev) {
    this.toggleCompareArea();
    if (document.getElementById("cms-compare-area").innerHTML == "") {
        this.createCompare();
    }
}

MosCmsViewer.prototype.createCompare = function () {
    const _this = this;
    const viewerId = "#" + this.viewer.id;
    const numPages = this.pdfDoc.numPages;
    const compareArea = document.getElementById("cms-compare-area");
    compareArea.innerHTML = "";
    var container = document.createElement("div");
    container.classList.add("compare-canvas-container");
    container.classList.add("cms-container");
    compareArea.appendChild(container);
    var compareBrush = document.createElement("div");
    compareBrush.id = "cms-compare-brush";
    compareBrush.style.position = "absolute";
    this.compareBrush = compareBrush;
    this.compareBrush.hidden = 1;
    container.appendChild(compareBrush);
    var scrollContainer = document.createElement("div");
    scrollContainer.classList.add("scroll-cms-container");
    compareArea.appendChild(scrollContainer);
    var scroll = document.createElement("div");
    scroll.classList.add("scroll-cms");
    scrollContainer.appendChild(scroll);
    this.compareCoor = [];
    for (var i = 1; i <= numPages; i++) {
        var div = document.createElement("div");
        var img = document.createElement("img");
        var canvas = document.querySelector(viewerId + " [data-page-number=\"" + i + "\"] canvas");
        div.style.width = canvas.clientWidth + "px";
        div.style.height = canvas.clientHeight + "px";
        img.src = canvas.toDataURL();
        img.style.maxWidth = "100%";
        div.appendChild(img);
        div.id = "compare-canvas-" + i;
        div.classList.add("compare-canvas");
        container.appendChild(div);
        var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.classList.add("cms-svg");
        svg.addEventListener("mousedown", function (e) {
            _this.setCompareMarkup(e, e.target.parentElement.children[0], e.target);
        });

        svg.addEventListener("mousemove", function (e) {
            _this.updateCompareMarkup(e);
        });
        svg.addEventListener("mouseup", function (e) {
            _this.compareMarkup(e);
        });
        div.appendChild(svg);
    }
    this.loadScrollCms(compareArea);
}


MosCmsViewer.prototype.setCompareMarkup = function (e) {
    if (!this.markFlag) {
        return;
    }
    this.compareBrush.hidden = 0;
    var container = document.querySelector(".compare-canvas-container");
    var area = document.getElementById("cms-compare-area");
    this.cx1 = e.clientX - area.offsetLeft;
    this.cy1 = e.clientY - area.offsetTop + container.scrollTop;
    this.cx2 = e.clientX - area.offsetLeft;
    this.cy2 = e.clientY - area.offsetTop + container.scrollTop;
    this.compareRecalc();
}

MosCmsViewer.prototype.updateCompareMarkup = function (e) {
    if (!this.markFlag) {
        return;
    }
    var area = document.getElementById("cms-compare-area");
    var container = document.querySelector(".compare-canvas-container");
    this.cx2 = e.clientX - area.offsetLeft;
    this.cy2 = e.clientY - area.offsetTop + container.scrollTop;
    this.compareRecalc();
}

MosCmsViewer.prototype.compareMarkup = function (e) {
    if (!this.markFlag) {
        return;
    }
    if (this.compareBrush.hidden == 0) {
        var page = e.target.parentElement;
        this.cx3 = Math.min(this.cx1, this.cx2) - page.offsetLeft;
        this.cx4 = Math.max(this.cx1, this.cx2) - page.offsetLeft;
        this.cy3 = Math.min(this.cy1, this.cy2) + document.getElementById("cms-compare-area").scrollTop - page.offsetTop;
        this.cy4 = Math.max(this.cy1, this.cy2) + document.getElementById("cms-compare-area").scrollTop - page.offsetTop;
        this.cdx = this.cx4 - this.cx3;
        this.cdy = this.cy4 - this.cy3;
        if (this.cdx && this.cdy) {
            var idx = Number(page.id.replace("compare-canvas-", "")) - 1;
            this.comparePaint(idx, this.cx3, this.cy3, this.cdx, this.cdy);
        }
        this.compareBrush.hidden = 1;
    }
}

MosCmsViewer.prototype.comparePaint = function (idx, x, y, width, height) {
    var g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    document.querySelector("#compare-canvas-" + (idx + 1) + " svg").appendChild(g);
    var rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    g.appendChild(rect);
    g.setAttributeNS(null, "x", x);
    g.setAttributeNS(null, "y", y);
    g.setAttributeNS(null, "width", width);
    g.setAttributeNS(null, "height", height);
    rect.setAttributeNS(null, "x", x);
    rect.setAttributeNS(null, "y", y);
    rect.setAttributeNS(null, "width", width);
    rect.setAttributeNS(null, "height", height);
    rect.setAttributeNS(null, "fill", "hsl(60, 100%, 50%)");
    rect.setAttributeNS(null, "fill-opacity", "0.5");
    rect.setAttributeNS(null, "pointer-events", "none");
    var image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.setAttributeNS(null, "href", "images/cms-icons/icn_remove.png");
    image.setAttributeNS(null, "x", x + width - 10.5);
    image.setAttributeNS(null, "y", y - 10.5);
    image.setAttributeNS(null, "width", "21px");
    image.setAttributeNS(null, "height", "21px");
    g.appendChild(image);
    var _this = this;
    image.onclick = function (e) {
        var parent = e.target.parentElement.parentElement
        var index = Array.prototype.indexOf.call(parent.children, e.target);
        for (var i = index; i < parent.children.length - 1; i++) {
            _this.compareCoor[i] = _this.compareCoor[i + 1];
        }
        _this.compareCoor.pop();
        e.target.parentElement.remove();
    }
    this.compareCoor.push([x, y, width, height]);
}

MosCmsViewer.prototype.compareRecalc = function () {
    this.cx3 = Math.min(this.cx1, this.cx2);
    this.cx4 = Math.max(this.cx1, this.cx2);
    this.cy3 = Math.min(this.cy1, this.cy2);
    this.cy4 = Math.max(this.cy1, this.cy2);
    this.compareBrush.style.left = this.cx3 + "px";
    this.compareBrush.style.top = this.cy3 + "px";
    this.compareBrush.style.width = this.cx4 - this.cx3 + "px";
    this.compareBrush.style.height = this.cy4 - this.cy3 + "px";
}

MosCmsViewer.prototype.toggleCompareArea = function () {
    this.canvas1Container.classList.add("cmsHiddenScreen");
    this.canvas1Container.parentElement.classList.add("cmsHiddenScreen");
    this.allWas.classList.add("cmsHiddenScreen");
    document.getElementById("cms-split-canvas-area").classList.add("cmsHidden");
    document.getElementById("cms-split-send-button-container").classList.add("cmsHiddenScreen");
    var compareArea = document.getElementById("cms-compare-area");
    if (compareArea.classList.contains("cmsHidden")) {
        compareArea.classList.remove("cmsHidden");
        if (this.copyFlag) {
            this.flagCopy();
        }
    } else {
        compareArea.classList.add("cmsHidden");
    }
}

MosCmsViewer.prototype.isLoaded = function (viewer) {
    var viewerId = "#" + viewer.id;
    for (var i = 1; i <= this.pdfDoc.numPages; i++) {
        var curPage = document.querySelector(viewerId + " [data-page-number=\"" + i + "\"]");
        if (!curPage.getAttribute("data-loaded")) {
            return false;
        }
    }
    return true;
}

MosCmsViewer.prototype.enablePrint = function () {
    var _this = this;
    var printViewer = document.getElementById("cms-print-viewer");
    if (_this.isLoaded(printViewer)) {
        _this.readyForPrint = true;
    } else {
        setTimeout(function () {
            _this.enablePrint();
        }, 300);
    }

}

MosCmsViewer.prototype.print = function () {
    var _this = this;
    if (_this.readyForPrint) {
        var printViewer = document.getElementById("cms-print-viewer");
        var scaleDiff = 1.0 - _this.scale;
        _this.resizeCoor(scaleDiff);
        for (var i = 0; i < this.pdfDoc.numPages; i++) {
            _this.repaint(i, printViewer);
        }
        _this.resizeCoor(-scaleDiff);
        window.print();
    } else {
        setTimeout(function () {
            _this.print();
        }, 300);
    }
    //var win = window.open();
    //win.document.write('<link href="css/pdf_viewer_print.css" media="print" rel="stylesheet" type="text/css" />');
    //win.document.write(this.viewerContainer.innerHTML);
    //var scaleDiff = 1.0 - _this.scale;
    //_this.resizeCoor(scaleDiff);
    //_this.renderAll()
    //    .then(_this.resizeCoor(scaleDiff));

}

MosCmsViewer.prototype.isPending = function () {
    return this.pagesPending > 0;
}

MosCmsViewer.prototype.getScrollCms = function (cms) {
    while (!cms.className.match(/^cmsDiv/)) {
        cms = cms.parentElement;
    }
    return cms;
}

MosCmsViewer.prototype.loadScrollCms = function (cmsParent) {
    var _this = this;
    var scroll = cmsParent.getElementsByClassName("scroll-cms")[0];

    var cmsContainer = cmsParent.getElementsByClassName("cms-container")[0];
    /*scroll.parentElement.style.height = cmsContainer.clientHeight + "px";*/
    scroll.style.height = (Math.pow(cmsContainer.clientHeight, 2) / cmsContainer.scrollHeight) + "px";
    if (cmsContainer.clientHeight == cmsContainer.scrollHeight) {
        scroll.parentElement.style.display = "none";
    } else {
        scroll.parentElement.style.display = "unset";
    }

    cmsParent.addEventListener("wheel", function (ev) {
        //if (cmsParent.classList.value.indexOf("cms-current-document") > -1) {
            _this.scrollCms(ev);
        //}
    });
    cmsParent.getElementsByClassName("scroll-cms")[0].addEventListener("wheel", function (ev) {
        if (cmsParent.classList.value.indexOf("cms-current-document") > -1) {
            _this.scrollCms(ev);
        }
    });
    /*loadMarkers();*/
    _this.updateScrollCmsPosition(scroll);
    _this.setScrollCmsEvents(cmsParent);
}

MosCmsViewer.prototype.scrollCms = function (ev) {
    var _this = this;
    ev.stopPropagation();
    var diff = ev.deltaY;
    var cms = _this.getScrollCms(ev.currentTarget);
    var scroll = cms.getElementsByClassName("scroll-cms")[0];
    _this.scrollCmsBy(diff, scroll);
    //_this.upOrDown(diff);
}

MosCmsViewer.prototype.scrollCmsFromScrollBy = function (diff, scroll) {
    var _this = this;
    var cms = _this.getScrollCms(scroll);
    var cmsContainer = cms.getElementsByClassName("cms-container")[0];
    var newDiff = (diff / cms.clientHeight) * cmsContainer.scrollHeight;
    _this.scrollCmsBy(newDiff, scroll);
}

MosCmsViewer.prototype.scrollCmsBy = function (diff, scroll) {
    var _this = this;
    var cms = _this.getScrollCms(scroll);
    var cmsContainer = cms.getElementsByClassName("cms-container")[0];
    var prevTop = Number(scroll.style.top.replace("px", ""));
    scroll.style.top = (prevTop + (diff / cmsContainer.scrollHeight) * scroll.parentElement.clientHeight) + "px";
    if (Number(scroll.style.top.replace("px", "")) < 0) {
        scroll.style.top = "0px";
    }
    if (Number(scroll.style.top.replace("px", "")) > (scroll.parentElement.clientHeight - scroll.clientHeight)) {
        scroll.style.top = (scroll.parentElement.clientHeight - scroll.clientHeight) + "px";
    }
    cmsContainer.scrollTop += diff;
    _this.upOrDown(diff);
}

MosCmsViewer.prototype.scrollCmsTo = function (target, scroll) {
    var _this = this;
    var cms = _this.getScrollCms(scroll);
    var cmsContainer = cms.getElementsByClassName("cms-container")[0];
    var top = target.offsetTop - target.parentElement.offsetTop;
    scroll.style.top = (top / cmsContainer.scrollHeight) * scroll.parentElement.clientHeight + "px";
    if (Number(scroll.style.top.replace("px", "")) < 0) {
        scroll.style.top = "0px";
    }
    if (Number(scroll.style.top.replace("px", "")) > (scroll.parentElement.clientHeight - scroll.clientHeight)) {
        scroll.style.top = (scroll.parentElement.clientHeight - scroll.clientHeight) + "px";
    }
    _this.cmsContainer.scrollTop = top;
}

MosCmsViewer.prototype.updateScrollCmsPosition = function (scroll) {
    var _this = this;
    var cms = _this.getScrollCms(scroll);
    var cmsContainer = cms.getElementsByClassName("cms-container")[0];
    scroll.style.height = (Math.pow(cmsContainer.clientHeight, 2) / cmsContainer.scrollHeight) + "px";
    if (cmsContainer.clientHeight == cmsContainer.scrollHeight) {
        scroll.parentElement.style.display = "none";
    } else {
        scroll.parentElement.style.display = "unset";
    }
    scroll.style.top = ((cmsContainer.scrollTop / cmsContainer.scrollHeight) * scroll.parentElement.clientHeight) + "px";
    if (Number(scroll.style.top.replace("px", "")) < 0) {
        scroll.style.top = "0px";
    }
    if (Number(scroll.style.top.replace("px", "")) > (scroll.parentElement.clientHeight - scroll.clientHeight)) {
        scroll.style.top = (scroll.parentElement.clientHeight - scroll.clientHeight) + "px";
    }
}

MosCmsViewer.prototype.setScrollCmsEvents = function (cms) {
    var _this = this;
    var scroll = cms.getElementsByClassName("scroll-cms")[0];
    scroll.addEventListener("mousedown", function (ev) {
        if (this.parentElement.parentElement.classList.value.indexOf("cms-current-document") == -1) {
            return;
        }
        ev.stopPropagation();
        var scroll = ev.currentTarget;
        scroll.setAttribute("data-is-down", true);
        scroll.classList.add("active");
        scroll.setAttribute("data-prev-y", ev.screenY);

    });
    cms.addEventListener("mouseup", function (ev) {
        if (this.classList.value.indexOf("cms-current-document") == -1) {
            return;
        }
        var cms = ev.currentTarget;
        var p = cms.parentElement.children[0];
        p.focus({ preventScroll: true });
        p.selectionStart = p.selectionEnd = p.children.length;
        var scroll = cms.getElementsByClassName("scroll-cms")[0];
        scroll.setAttribute("data-is-down", false);
        scroll.classList.remove("active");
    });

    cms.addEventListener("mousemove", function (ev) {
        if (this.classList.value.indexOf("cms-current-document") == -1) {
            return;
        }
        var cms = ev.currentTarget;
        var scroll = cms.getElementsByClassName("scroll-cms")[0];
        var isDown = (scroll.getAttribute("data-is-down") == "true");
        if (!isDown) { return };
        ev.preventDefault();
        var diff = ev.movementY;
        if (typeof (ev.movementY) === "undefined") {
            var prevY = scroll.getAttribute("data-prev-y");
            diff = ev.screenY - prevY;
            scroll.setAttribute("data-prev-y", ev.screenY);
        }
        _this.scrollCmsFromScrollBy(diff, scroll);

    });
}




//function cmsMain() {
//    var cms = new MosCmsViewer("/mosaics-lib/temp/form2.pdf");
//    //cms.getDocument();

//}

//cmsMain();

/* without iframe
 *
 *
 *
 *
 *
 * */




//// Show Prev Page
//MosCmsViewer.prototype.showPrevPage = function () {
//    if (this.pageNum <= 1) {
//        return;
//    }
//    this.pageNum--;
//    this.queueRenderPage(this.pageNum);
//    this.svgCtx.clearRect(0, 0, this.svg.clientWidth, this.svg.clientHeight);
//    this.coor = [];
//}

//// Show Next Page
//MosCmsViewer.prototype.showNextPage = function () {
//    if (this.pageNum >= this.pdfDoc.numPages) {
//        return;
//    }
//    this.pageNum++;
//    this.queueRenderPage(this.pageNum);
//    this.svgCtx.clearRect(0, 0, this.svg.clientWidth, this.svg.clientHeight);
//    this.coor = [];
//}

//MosCmsViewer.prototype.mergeToCanvas = function (e) {
//    this.ctx.fillStyle = "hsla(60, 100%, 50%, 0.5)";
//    this.svgCtx.clearRect(0, 0, this.svg.clientWidth, this.svg.clientHeight);
//    for (var c = 0; c < this.coor.length; c++) {
//        this.ctx.fillRect(this.coor[c][0], this.coor[c][1], this.coor[c][2], this.coor[c][3]);
//    }
//    this.coor = [];
//}

//MosCmsViewer.prototype.rotateM90 = function () {
//    for (var i = 1; i <= this.pdfDoc.numPages; i++) {
//        this.rotateCanvas(document.querySelector("[data-page-number=\"" + i + "\"]"));
//    }
//    this.rotate(-90);
//}
//MosCmsViewer.prototype.rotate180 = function () {
//    this.rotate(180);
//}

/*****
//this.upOrDown();
*****/


/* UNCOMMENT WHEN RENDERED */
//this.getDocument().then(_pdfDoc => {
    //    this.pdfDoc = _pdfDoc;
    //    //this.createPages();
    //    //document.getElementById("page-count").textContent = this.pdfDoc.numPages;
    //    //this.renderPage(this.pageNum);
    //    //this.renderAll();
    //    //document.getElementById("cms-page-index").textContent = 1; // Will Change Into A Function
    //    document.getElementById("cms-num-pages").textContent = this.pdfDoc.numPages;
    //    this.createPages(this.viewer);
    //    var printViewer = document.getElementById("cms-print-viewer");
    //    this.createPages(printViewer);
    //    this.appendCanvas(document.querySelector(".cms-pdf-render"));
    //    this.appendSvg(document.querySelector(".cms-svg"));
    //    this.width = this.canvas.width;
    //    this.height = this.canvas.height;

    //    this.renderAll(this.viewer);
    //    this.renderAll(printViewer, 1);
    //    this.matchCoors();
    //    this.addPdfEvents();
    //    if (this.coor.length == 0) {
    //        for (var i = 0; i < this.pdfDoc.numPages; i++) {
    //            this.coor.push([]);
    //        }
    //    }
    //    this.enablePrint();
    //});