import React, { useState, useEffect } from "react";
import { fabric } from "fabric";
import axios from "axios";
import { useCookies } from "react-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUpDownLeftRight,
  faEraser,
  faPlus,
  faMagnifyingGlassPlus,
  faMagnifyingGlassMinus,
  faArrowRotateLeft,
} from "@fortawesome/free-solid-svg-icons";
import { ThreeDots } from 'react-loader-spinner'
import StopWatch from "../stopwatch/stopwatch";
import SegList from "../segList/SegList";
import "./Visor.css";

function Visor() {

  const [cookies, setCookie, removeCookie] = useCookies(["username"]);
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [file, setFile] = useState(null);
  const [oldFile, setOldFile] = useState(null);
  const [canvas, setCanvas] = useState(null);
  const [isDragging, _setIsDragging] = useState(false);
  const [isAdding, _setIsAdding] = useState(false);
  const [isDraggingBtn, _setIsDraggingBtn] = useState(false);
  const [lastPosX, _setLastPosX] = useState(null);
  const [lastPosY, _setLastPosY] = useState(null);
  const [segId, setSegId] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isStarted, _setIsStarted] = useState(false);
  const [isOldFileLoaded, setIsOldFileLoaded] = useState(false);
  const [time, setTime] = useState(0);

  const isDraggingRef = React.useRef(isDragging);
  const setIsDragging = (data) => {
    isDraggingRef.current = data;
    _setIsDragging(data);
  };

  const isAddingRef = React.useRef(isAdding);
  const setIsAdding = (data) => {
    isAddingRef.current = data;
    _setIsAdding(data);
  };

  const isDraggingBtnRef = React.useRef(isDraggingBtn);
  const setIsDraggingBtn = (data) => {
    isDraggingBtnRef.current = data;
    _setIsDraggingBtn(data);
  };

  const lastPosXRef = React.useRef(lastPosX);
  const setLastPosX = (data) => {
    lastPosXRef.current = data;
    _setLastPosX(data);
  };

  const lastPosYRef = React.useRef(lastPosY);
  const setLastPosY = (data) => {
    lastPosYRef.current = data;
    _setLastPosY(data);
  };

  const isStartedRef = React.useRef(isStarted);
  const setIsStarted = (data) => {
    isStartedRef.current = data;
    _setIsStarted(data);
  }

  //Función para obtener todos los círculos del canvas y subir el csv al ckan
  const getObjects = () => {
    setIsUploading(true);
    const circles = canvas.getObjects();
    const res = [];
    circles.forEach((circle) => {
      let dicc = {
        Radius: circle["radius"],
        X: circle["left"],
        Y: circle["top"],
      };
      res.push(dicc);
    });
    uploadCSV(res,segId);
  };

  //Función para borrar el canvas con los contenidos relacionados
  const removeCanvas = () => {
    if (canvas) {
      canvas.dispose();
      setFile(null);
      setImage(null);
      setImageUrl(null);
      setCanvas(null);
    }
    
  };

  const uploadCSV = (data, id) => {
    let csv="X,Y,Radius\n"
    data.forEach((dic)=>{
      if (dic["Radius"]){
        const line=dic["X"]+","+dic["Y"]+","+dic["Radius"]+"\n";
        csv=csv+line;
      }
    })
    const url = process.env.REACT_APP_BACKEND_URL+"/api/segmentar/revision/"
    data={
      dataset:"segmentacion_"+cookies.username,
      csv: csv,
      id: id
    }
    axios.put(url,data)
    .then((res)=>{
      const timeUrl=process.env.REACT_APP_BACKEND_URL+"/api/segmentar/revision/tiempo/"
      data={
        id:id,
        tiempo_revision:time
      }
      if (isOldFileLoaded) {
        axios.post(timeUrl,data)
        .then((res)=>{
          setIsUploading(false);
        })
        .catch((err)=>{
          console.log(err);
        })
      } else {
        axios.put(timeUrl,data)
        .then((res)=>{
          setIsUploading(false);
        })
        .catch((err)=>{
          console.log(err);
        })
      }
    })
    .catch((err)=>{
      console.log(err);
    }) 
  }

  //useEffect que sirve para asociar la tecla suprimir para borrar círculos activos
  useEffect(() => {
    const removeObjects = (e) => {
      if (e.repeat) {
        return;
      }
      if (e.keyCode === 46) {
        if (canvas) {
          canvas.getActiveObjects().forEach((obj) => {
            canvas.remove(obj);
          });
          canvas.discardActiveObject().renderAll();
        }
      }
    };

    var canvasWrapper = document.getElementById("canvasWrap");
    canvasWrapper.tabIndex = 1000;
    canvasWrapper.addEventListener("keyup", (e) => {
      removeObjects(e);
    });
    return () => {
      canvasWrapper.removeEventListener("keyup", (e) => {
        removeObjects(e);
      });
    };
  }, [canvas]);

  //useEffect que sirve para generar un URL de la imagen subida.
  useEffect(() => {
    if (image) {
      setImageUrl(URL.createObjectURL(image));
    }
  }, [image]);

  //Función para dibujar los círculos en el canvas una vez subidos tanto la imagen como el archivo JSON/CSV
  useEffect(() => {
    if (canvas && file) {
      for (let i = 0; i < file.length; i++) {
        const x = file[i]["X"];
        const y = file[i]["Y"];
        const r = file[i]["Radius"];
        let circle = new fabric.Circle({
          radius: parseInt(r),
          originX: "center",
          originY: "center",
          fill: "",
          stroke: "red",
          strokeWidth: 3,
          strokeUniform: true,
          selectable: false
        });
        circle.setControlsVisibility({ mtr: false });
        circle.top = parseFloat(y);
        circle.left = parseFloat(x);
        canvas.add(circle);
      }
    }
  }, [canvas, file]);

  //Función para generar el canvas una vez subido una imagen
  useEffect(() => {
    const initCanvas = (image) => {
      const height = image.height;
      const width = image.width;
      //image.scaleToWidth(width);
      //image.scaleToHeight(height);
      const canvas = new fabric.Canvas("canvas", {
        height: height,
        width: width,
        backgroundImage: image,
        fireRightClick: true, // <-- enable firing of right click events
        fireMiddleClick: true, // <-- enable firing of middle click events
        stopContextMenu: true, // <--  prevent context menu from showing
        selectionKey: "ctrlKey",
        interactive: true,
      });

      //Evento para detectar un click y hacer cosas dependiendo del click y otros parámetros
      canvas.on("mouse:down", (e) => {
        if (isStartedRef.current) {
          var pointer = canvas.getPointer(e.e);
          if (e.button === 3) {
            let circle = new fabric.Circle({
              radius: 20,
              originX: "center",
              originY: "center",
              fill: "",
              stroke: "red",
              strokeWidth: 3,
              top: pointer.y,
              left: pointer.x,
              strokeUniform: true,
            });
            circle.setControlsVisibility({ mtr: false });
            canvas.add(circle);
          } else if (e.button === 1) {
            if (isAddingRef.current === true) {
              let circle = new fabric.Circle({
                radius: 20,
                originX: "center",
                originY: "center",
                fill: "",
                stroke: "red",
                strokeWidth: 3,
                top: pointer.y,
                left: pointer.x,
                strokeUniform: true,
              });
              circle.setControlsVisibility({ mtr: false });
              canvas.add(circle);
            } else {
              if (e.e.altKey === true || isDraggingBtnRef.current) {
                setIsDragging(true);
                setLastPosX(e.e.clientX);
                setLastPosY(e.e.clientY);
              }
            }
          }
        }
        
      });

      //Evento para detectar la ruedita del ratón y hacer zoom
      canvas.on("mouse:wheel", (opt) => {
        if (isStartedRef.current) {
          var delta = opt.e.deltaY;
          var zoom = canvas.getZoom();
          zoom *= 0.999 ** delta;
          if (zoom > 20) zoom = 20;
          if (zoom < 1) zoom = 1;
          canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
          opt.e.preventDefault();
          opt.e.stopPropagation();
  
          var vpt = canvas.viewportTransform;
          if (zoom < 400 / 1000) {
            vpt[4] = 200 - (width * zoom) / 2;
            vpt[5] = 200 - (height * zoom) / 2;
          } else {
            if (vpt[4] >= 0) {
              vpt[4] = 0;
            } else if (vpt[4] < canvas.getWidth() - width * zoom) {
              vpt[4] = canvas.getWidth() - width * zoom;
            }
            if (vpt[5] >= 0) {
              vpt[5] = 0;
            } else if (vpt[5] < canvas.getHeight() - height * zoom) {
              vpt[5] = canvas.getHeight() - height * zoom;
            }
          } 
        }
      });

      //Evento para detectar cuando el mouse se mueve dentro del canvas
      canvas.on("mouse:move", function (opt) {
        if (isDraggingRef.current) {
          var zoom = canvas.getZoom();
          var e = opt.e;
          var vpt = canvas.viewportTransform;
          vpt[4] += e.clientX - lastPosXRef.current;
          vpt[5] += e.clientY - lastPosYRef.current;
          if (vpt[4] >= 0) {
            vpt[4] = 0;
          } else if (vpt[4] < canvas.getWidth() - width * zoom) {
            vpt[4] = canvas.getWidth() - width * zoom;
          }
          if (vpt[5] >= 0) {
            vpt[5] = 0;
          } else if (vpt[5] < canvas.getHeight() - height * zoom) {
            vpt[5] = canvas.getHeight() - height * zoom;
          }
          canvas.requestRenderAll();
          setLastPosX(e.clientX);
          setLastPosY(e.clientY);
        }
      });

      //Evento para cuando se suelta el click
      canvas.on("mouse:up", function (opt) {
        // on mouse up we want to recalculate new interaction
        // for all objects, so we call setViewportTransform
        canvas.setViewportTransform(canvas.viewportTransform);
        setIsDragging(false);
      });

      return canvas;
    };
    if (imageUrl) {
      fabric.Image.fromURL(imageUrl, (img) => {
        setCanvas(initCanvas(img));
      });
    }
  }, [imageUrl]);

  //Función para hacer zoom un nivel
  const addZoom = () => {
    var zoom = canvas.getZoom();
    zoom = zoom + 0.25;
    if (zoom > 20) {
      zoom = 20;
    }
    canvas.zoomToPoint(
      new fabric.Point(canvas.width / 2, canvas.height / 2),
      zoom
    );
    var vpt = canvas.viewportTransform;
    if (zoom < 400 / 1000) {
      vpt[4] = 200 - (canvas.width * zoom) / 2;
      vpt[5] = 200 - (canvas.height * zoom) / 2;
    } else {
      if (vpt[4] >= 0) {
        vpt[4] = 0;
      } else if (vpt[4] < canvas.getWidth() - canvas.width * zoom) {
        vpt[4] = canvas.getWidth() - canvas.width * zoom;
      }
      if (vpt[5] >= 0) {
        vpt[5] = 0;
      } else if (vpt[5] < canvas.getHeight() - canvas.height * zoom) {
        vpt[5] = canvas.getHeight() - canvas.height * zoom;
      }
    }
  };

  //Función para quitar zoom un nivel
  const substractZoom = () => {
    var zoom = canvas.getZoom();
    zoom = zoom - 0.25;
    if (zoom < 1) {
      zoom = 1;
    }
    canvas.zoomToPoint(
      new fabric.Point(canvas.width / 2, canvas.height / 2),
      zoom
    );
    var vpt = canvas.viewportTransform;
    if (zoom < 400 / 1000) {
      vpt[4] = 200 - (canvas.width * zoom) / 2;
      vpt[5] = 200 - (canvas.height * zoom) / 2;
    } else {
      if (vpt[4] >= 0) {
        vpt[4] = 0;
      } else if (vpt[4] < canvas.getWidth() - canvas.width * zoom) {
        vpt[4] = canvas.getWidth() - canvas.width * zoom;
      }
      if (vpt[5] >= 0) {
        vpt[5] = 0;
      } else if (vpt[5] < canvas.getHeight() - canvas.height * zoom) {
        vpt[5] = canvas.getHeight() - canvas.height * zoom;
      }
    }
  };

  //Función para borrar círculos seleccionados
  const removeObjects = () => {
    canvas.getActiveObjects().forEach((obj) => {
      canvas.remove(obj);
    });
    canvas.discardActiveObject().renderAll();
  };

  const classNameToolBarBtns = (isActive) => {
    if (isStarted) {
      if (isActive) {
        return "toolBarBtnSelected"
      } else {
        return "toolBarBtn"
      }
    } else {
      return "toolBarBtnDisabled"
    }
  }

  const startInteractivity = (flag) => {
    setIsStarted(flag);
    canvas.getObjects().forEach((obj)=>{
      obj.selectable=flag;
    })
  }

  const loadOldFile = () => {
    canvas.remove(...canvas.getObjects());
    for (let i = 0; i < oldFile.length; i++) {
      const x = oldFile[i]["X"];
      const y = oldFile[i]["Y"];
      const r = oldFile[i]["Radius"];
      let circle = new fabric.Circle({
        radius: parseInt(r),
        originX: "center",
        originY: "center",
        fill: "",
        stroke: "red",
        strokeWidth: 3,
        strokeUniform: true,
        selectable: false
      });
      circle.setControlsVisibility({ mtr: false });
      circle.top = parseFloat(y);
      circle.left = parseFloat(x);
      canvas.add(circle);
    }
    setTime(0);
    setIsOldFileLoaded(true);
  }

  return (
    <div className="Visor">
      <header className="header">
        <nav className="bg-white border-gray-200 px-2 sm:px-4 py-2.5 bg-gray-100">
          <div className="container flex flex-wrap items-center justify-between mx-auto">
            <a href="https://flowbite.com/" className="flex items-center">
              <span className="self-center text-xl font-semibold whitespace-nowrap">
                CelularMI
              </span>
            </a>
          </div>
        </nav>
      </header>
      <div className="body">
        <div className="visorBody">
          <h1 id="h1-header">Visor de resultados</h1>
          {
            (imageUrl && file) && (
              <div className="btns">
                {isUploading ? (
                  <ThreeDots 
                  height="40" 
                  width="100" 
                  radius="4"
                  color="#4fa94d" 
                  ariaLabel="three-dots-loading"
                  wrapperStyle={{}}
                  wrapperClassName=""
                  visible={true}
                   />
                ):(
                  <button className={isStarted ? "btnDisabled":"btn"} disabled={isStarted ? true:""} onClick={() => getObjects()}>
                    Subir información
                  </button>
                )}
                <StopWatch setIsStarted={startInteractivity} time={time} setTime={setTime}/>
                <button className="btn" onClick={() => removeCanvas()}>
                  Escoger una nueva muestra
                </button>
              </div>
            )
          }
          {!canvas && (
            <SegList setImageUrl={setImageUrl} setCsv={setFile} removeCanvas={removeCanvas} setOldCsv={setOldFile} setSegId={setSegId}/>
          )}
          <div id="canvasBody">
            {canvas && (
              <div className={isStarted ? "toolBar" : "toolBarDisabled"}>
                <button
                  title="Habilita el dezlaplazamiento con el click izquierdo"
                  disabled={isStarted ? "":true}
                  className={classNameToolBarBtns(isDraggingBtn)}
                  onClick={() => {
                    setIsDraggingBtn(!isDraggingBtn);
                  }}
                >
                  <FontAwesomeIcon icon={faUpDownLeftRight} />
                </button>
                <button 
                  title="Borra círculos seleccionados"
                  disabled={isStarted ? "":true} 
                  className={isStarted ? "toolBarBtn":"toolBarBtnDisabled"}
                >
                  <FontAwesomeIcon
                    icon={faEraser}
                    onClick={() => {
                      removeObjects();
                    }}
                  />
                </button>
                <button
                  title="Habilita añadir círculos nuevos con click izquierdo"
                  disabled={isStarted ? "":true}
                  className={classNameToolBarBtns(isAdding)}
                  onClick={() => {
                    setIsAdding(!isAdding);
                  }}
                >
                  <FontAwesomeIcon icon={faPlus} />
                </button>
                <button
                  title="Incrementar zoom"
                  disabled={isStarted ? "":true}
                  className={isStarted ? "toolBarBtn":"toolBarBtnDisabled"}
                  onClick={() => {
                    addZoom();
                  }}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                </button>
                <button
                  title="Disminuir zoom"
                  disabled={isStarted ? "":true}
                  className={isStarted ? "toolBarBtn":"toolBarBtnDisabled"}
                  onClick={() => {
                    substractZoom();
                  }}
                >
                  <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                </button>
                <button
                  title="Cargar conteo original"
                  className={"toolBarBtnImportant"}
                  onClick={() => {
                    loadOldFile();
                  }}
                >
                  <FontAwesomeIcon icon={faArrowRotateLeft} />
                </button>
              </div>
            )}
            <div id="canvasWrap">
              <canvas id="canvas" />
            </div>
          </div>
        </div>
        
      </div>
    </div>
  );
}

export default Visor;
