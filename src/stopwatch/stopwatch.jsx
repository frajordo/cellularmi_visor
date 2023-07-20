import React, { useState, useEffect } from "react";
import "./stopwatch.css";

function StopWatch({setIsStarted, time, setTime}) {
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(true);

  useEffect(() => {
    let interval = null;

    if (isActive && isPaused === false) {
      interval = setInterval(() => {
        setTime((time) => time + 10);
      }, 10);
    } else {
      clearInterval(interval);
    }
    return () => {
      clearInterval(interval);
    };
  }, [isActive, isPaused]);

  const handleStart = () => {
    setIsStarted(true);
    setIsActive(true);
    setIsPaused(false);
  };

  const handlePauseResume = () => {
    setIsStarted(isPaused);
    setIsPaused(!isPaused);
  };

  const getTime = (time, unit) => {
    if (unit === "m") {
      return Math.floor((time / 60000) % 60);
    } else if (unit === "s") {
      return Math.floor((time / 1000) % 60);
    } else {
      return Math.floor((time / 10) % 100);
    }
  };

  const startBtn=(
    <div className="btn" onClick={()=>handleStart()}>
        Comenzar
    </div>
  );

  const activeBtns=(
    <div className="btns">
        <div className="btn" onClick={()=>handlePauseResume()}>
            {isPaused? "Resumir":"Pausar"}
        </div>
    </div>
  );


  return (
    <div id="stopwatch">
      <div id="timer" hidden={true}>
        <span className="digits">{("0" + getTime(time, "m")).slice(-2)}</span>
        <span className="digits">:</span>
        <span className="digits">{("0" + getTime(time, "s")).slice(-2)}</span>
        <span className="digits">:</span>
        <span className="digits">{("0" + getTime(time, "ms")).slice(-2)}</span>
      </div>
      <div id="stopwatchBtns">
        {isActive ? activeBtns:startBtn}
      </div>
    </div>
  );
}

export default StopWatch;