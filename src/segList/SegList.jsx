import React, { useState, useEffect } from "react";
import axios from "axios";
import { useCookies } from "react-cookie";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBan, faCheck } from "@fortawesome/free-solid-svg-icons";
import { ThreeCircles } from 'react-loader-spinner'
import "./SegList.css"

function SegList({setImageUrl, setCsv, setOldCsv, setSegId}) {
    const [cookies, setCookie, removeCookie] = useCookies(["username"]);
    const [segmentations, setSegmentations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadSegmentations = () => {
        const username=cookies.username
        if (username) {
            const url = process.env.REACT_APP_BACKEND_URL+"/api/segmentacion"
            axios.get(url, {params:{usuario:username}})
            .then((res)=>{
                setSegmentations(res.data);
                setIsLoading(false);
            })
            .catch((err)=>{
                console.log(err)
            })
        }
    }

    const processCsv = (file) => {
        const csv=file.split("\n");
        const header=csv[0].split(",");
        let res=[];
        for (let i = 1; i < csv.length; i++) {
            const line = csv[i].split(",");
            const lineJson={}
            for (let j = 0; j < line.length; j++) {
                const element = line[j];
                lineJson[header[j]]=element
            }
            res.push(lineJson)
        }
        return res;
    }

    const loadResources=(id)=>{
        setIsLoading(true);
        const fileName=id;
        const username = cookies.username;
        if (username) {
            const url = process.env.REACT_APP_BACKEND_URL+"/api/getSegmentacion"
            axios.get(url, {params:{usuario:username, nombre_recurso:fileName}})
            .then((res)=>{
                setImageUrl(res.data.data.jpg);
                const csv=processCsv(res.data.data.csv);
                const oldCsv=processCsv(res.data.data.old_csv);
                if (oldCsv) {
                    setOldCsv(oldCsv);
                }
                setCsv(csv);
                setSegId(id)
                setIsLoading(false);
            })
        }
        
    }

    const deleteSegmentation = (segId, index) => {
        const url = process.env.REACT_APP_BACKEND_URL+"/api/segmentacion/";
        axios.delete(url, {params: {id:segId}})
        .then((res)=>{
            if (res.data[0]===1) {
                segmentations.splice(index,1);
                setSegmentations([...segmentations]);
            }
        })
    }

    const getTime = (time, unit) => {
        if (unit === "m") {
          return Math.floor((time / 60000) % 60);
        } else if (unit === "s") {
          return Math.floor((time / 1000) % 60);
        } else {
          return Math.floor((time / 10) % 100);
        }
    };

    const getTimeLabel = (time) => {
        const m=("0" + getTime(time, "m")).slice(-2);
        const s=("0" + getTime(time, "s")).slice(-2);
        const ms=("0" + getTime(time, "ms")).slice(-2);
        return m+":"+s+":"+ms;
    }

    useEffect((e)=>{
        loadSegmentations();
    },[])

    return(
        <div>
            {isLoading ? 
                <ThreeCircles
                    height="100"
                    width="100"
                    color="rgb(15 118 110)"
                    wrapperStyle={{}}
                    wrapperClass="spinner"
                    visible={true}
                    ariaLabel="three-circles-rotating"
                    outerCircleColor=""
                    innerCircleColor=""
                    middleCircleColor=""
                />
            :
                <table className="table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Total Bacterias</th>
                            <th>Conteo Manual</th>
                            <th>Fecha de creación</th>
                            <th>Tiempo</th>
                            <th>Revisado</th>
                        </tr>
                    </thead>
                    <tbody>
                        {segmentations.map((seg, index)=>{
                            return(
                            <tr key={seg.id+"-row"} onClick={(e)=>{loadResources(seg.id)}}>
                                <td className="tableBodyCell">{seg.nombre_segmentaciones}</td>
                                <td className="tableBodyCell">{seg.total_bacterias}</td>
                                <td className="tableBodyCell">{seg.conteo_manual}</td>
                                <td className="tableBodyCell">{seg.fecha_creacion && seg.fecha_creacion.replace("Z","").replace("T"," ")}</td>
                                <td className="tableBodyCell">{getTimeLabel(seg.tiempo_revision)}</td>
                                <td className="tableBodyCell">{seg.revisado ? <FontAwesomeIcon icon={faCheck} />: <FontAwesomeIcon icon={faBan} />}</td>
                                <td>
                                    <button className="btn" onClick={(e)=>{
                                        e.stopPropagation();
                                        deleteSegmentation(seg.id,index);
                                    }}>
                                        X
                                    </button>
                                </td>
                            </tr>
                            )
                        })}
                    </tbody>
                </table>
            }
            
        </div>
    )
}

export default SegList;