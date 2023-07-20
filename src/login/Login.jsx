import { useState } from "react";
import "./Login.css";
import axios from "axios";
import { useCookies } from "react-cookie";
import { useNavigate } from "react-router-dom";

function Login(setImage) {
    
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [cookies, setCookie, removeCookie] = useCookies(["username"]);
    const navigate = useNavigate();

    const signIn=()=>{
        const data={
            username:username,
            password:password
        }
        const url=process.env.REACT_APP_BACKEND_URL+"/signin/"
        axios.post(url,data,{
            headers: {
            'Content-Type' : 'application/x-www-form-urlencoded; charset=UTF-8'
            },
            withCredentials: true
        })
        .then(res=>{
            if (res.status===200) {
                setCookie("username",res.data.data.username,{path:"/"});
                navigate("/visor");
            }
        })
        .catch(error => {
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              setErrorMessage(error.response.data.message);
              console.log(error.response.data);
              console.log(error.response.status);
              console.log(error.response.headers);
            } else if (error.request) {
              // The request was made but no response was received
              // `error.request` is an instance of XMLHttpRequest in the browser 
              // and an instance of http.ClientRequest in node.js
              console.log(error.request);
            } else {
              // Something happened in setting up the request that triggered an Error
              console.log('Error', error.message);
            }
           
        });
        
    }

    return(
        <div id="Login">
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
            <div className="loginBody">
                <div className="loginForm">
                    <div className="formInput">
                        <label className="labelInput">Usuario:</label>
                        <input className="labelTextInput" value={username} onChange={(e)=>{
                            setUsername(e.target.value)
                        }}></input>
                    </div>
                    <div className="formInput">
                        <label className="labelInput">Contraseña:</label>
                        <input className="labelTextInput" value={password} onChange={(e)=>{
                            setPassword(e.target.value)
                        }}/>
                    </div>
                    <p className="errorMessage" hidden={errorMessage===""? true: false}>{errorMessage}</p>
                    <button className="btn" onClick={(e)=>{signIn()}}>Iniciar Sesión</button>
                </div>
            </div>
        </div>
    )
}

export default Login;