import React, { useState, useEffect,useRef } from "react";

import { Container, AppBar, IconButton, Toolbar, Button } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import MenuIcon from "@mui/icons-material/Menu";

import { Decoder, Encoder, tools, Reader } from "ts-ebml";
import { Buffer } from "buffer";

// const ffmpeg = require('fluent-ffmpeg');



export default function App3() {
  // to user buffer class/instance in browser
  window.Buffer = Buffer;

  const [stream, setStream] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(true);
  const [length, setLength] = useState();
  const [framerate, setFramerate] = useState();
  const [creationTime, setCreationTime] = useState();
  const [date, setDate] = useState();
  const [blob1, setBlob1] = useState(null);
  const [file, setFile] = useState(null);

  const [recordingStartingTime, setRecordingStartingTime] = useState()
  const [recordingEndingTime, setRecordingEndingTime] = useState()
  const [videoDuration, setVideoDuration] = useState()


  const fileInputRef = useRef(null);

  const handleFileSelect = () => {
    const files = fileInputRef.current.files;
    setFile(files)

    console.log(files);
    // do something with the files
  };

  const readAsArrayBuffer = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsArrayBuffer(blob);
      reader.onloadend = () => {
        resolve(reader.result);
      };
      reader.onerror = (ev) => {
        reject(ev.error);
      };
    });
  };

  const injectMetadata = (blob) => {
    const decoder = new Decoder();
    const reader = new Reader();
    reader.logging = false;
    reader.drop_default_duration = false;

    readAsArrayBuffer(blob).then((buffer) => {
      const elms = decoder.decode(buffer);
      elms.forEach((elm) => {
        reader.read(elm);
      });
      reader.stop();

      console.log("reader.duration", reader.duration);
      console.log("reader.duration", reader.timecodeScale);
      let refinedMetadataBuf = tools.makeMetadataSeekable(
        reader.metadatas,
        reader.duration,
        reader.cues
      );
      let body = buffer.slice(reader.metadataSize);
      let result = new Blob([refinedMetadataBuf, body], { type: blob.type });

      const url = URL.createObjectURL(result);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "test.mp4";
      document.body.appendChild(a);

      a.click();
    });
  };

  useEffect(() => {
    // Get access to the user's camera and microphone
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        let video = document.querySelector("#video");
        video.srcObject = stream;
      })
      .catch(console.error);
  }, []);

  // start recording
  useEffect(() => {
    if (!stream) {
      console.log("no stream to record");
      return;
    }

    // let mimeType = "video/webm; codecs=vp8";
    let mimeType = "video/webm; codecs=vp8,opus";
    // if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
    //     mimeType = 'video/webm; codecs=vp9,opus';
    // } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
    //     mimeType = 'video/webm; codecs=vp9';
    // } else if (MediaRecorder.isTypeSupported('video/webm')) {
    //     mimeType = 'video/webm';
    // }else {
    //     mimeType = 'video/webm; codecs=vp8 ';
    // }
    console.log("mimetype", mimeType);

    let options = {
      type: "video",
      video: {
        width: 1280,
        height: 720,
        frameRate: { ideal: 30, max: 30 }
      },
      mimeType: mimeType,
    };

    // Create a new MediaRecorder
    const newRecorder = new MediaRecorder(stream, options);

    // const newRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9,opus"});
    // newRecorder.videoBitsPerSecond = 2 * 1024 * 1024; // 2Mbps
    // newRecorder.videoBitsPerSecond = 2 * 1024 * 720; // 2Mbps
    // newRecorder.frameRate = 30;
    // newRecorder.audioBitsPerSecond = 128000,
    // newRecorder.videoBitsPerSecond = 2500000,
    setRecorder(newRecorder);
    setRecordingStartingTime(new Date().getTime())
    
  }, [stream]);

  function startRecoding() {
    setRecordedChunks([]);
    recorder.start();
    // recorder.startRecording();
    setIsRecording(true);
    if (btnDisabled == false) {
      setBtnDisabled(true);
    }

    try {
      // When data is available, push it to the recordedChunks array
      
      recorder.ondataavailable = (e) => {
        console.log("e.data", e.data);
        
        setRecordedChunks((prevChunks) => [...prevChunks, e.data]);
        
      const testBlob = new Blob(recordedChunks, { type: 'video/webm'});

      let testFile = new File([testBlob], "testfile.webm")

      let formData = new FormData();
      formData.append("mediaFeed", e.data);

      const videoDuration = (Math.round((recordingEndingTime - recordingStartingTime)/1000));
      formData.append("videoDuration", videoDuration); 

      
      fetch("http://localhost:3031/sendMediaFeed", {
        method: "POST",
        body: formData,
        contentType: "multipart/form-data",
      })
        .then((response) => {
        })
        .catch((error) => {
          console.error(error);
        });
        
      };
    } catch (e) {
      console.error("Exception while creating MediaRecorder: " + e);
      return;
    }
  }

  function stopRecording() {
    console.log("recordedChunks in stopRecording", recordedChunks);
    try {
      recorder.stop();
      setIsRecording(false);
      setBtnDisabled(false);
      
      setRecordingEndingTime(new Date().getTime())


      // retrieve the current date and time
      // let date = new Date();
      // let creationTime = date.toISOString();

      // setDate(date);
      // setCreationTime(creationTime);

      // retrieve the length of the recorded video
      // let video = document.querySelector("video");
      // setLength(video.duration);

      // retrieve the framerate of the recorded video
      // setFramerate(video.frameRate);

      // set the metadata (length, framerate, and creation date) for the video file
      // let metadata = {
      //   length: length,
      //   framerate: framerate,
      //   creationTime: creationTime,
      // };
    } catch (e) {
      console.log(e);
    }
  }

  function download() {
    if (MediaRecorder.state == "recording") {
      recorder.stop();
      setIsRecording(false);
    }

    const blob = new Blob(recordedChunks, { type: "video/webm" });

    console.log("recordedChunks in download", recordedChunks);

    // Create a new video element
    const video = document.getElementById("prevideo");
    // injectMetadata(blob);

    // Assign the blob as the video source
    video.src = URL.createObjectURL(blob);

    video.onloadedmetadata = () => {
      console.log("Duration: ", video.duration);
    };

  }

  function testConnection () {
    fetch(`https://video-recoder-backend.onrender.com/testConnection`, {
    // fetch("http://localhost:3031/testConnection", {
    method: "post"
    })
    .then((response) => {
      console.log("res =>", response);
    })
   
}

  function testingDownload (){

      fetch("http://localhost:3031/download", {
        method: "get"
      })
        .then((response) => {
          if(response.ok){
            return response.blob()
          }
          // console.log(response.body);
        }).then(data => {
            console.log("data",data);
            const url = URL.createObjectURL(data);
            console.log("url",url);
            const a = document.createElement("a");
            a.style.display = "none";
            a.href = url;
            a.download = "test00.mp4";
            a.click()
            setTimeout(function () {
              URL.revokeObjectURL(url);
            }, 100);
          
        })
        .catch((error) => {
          console.error(error);
        });
  }

  function turnOffCamera() {
    let video = document.querySelector("#video");
    video.srcObject.getTracks().forEach((track) => track.stop());
  }

  function turnOnCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setStream(stream);
        let video = document.querySelector("#video");
        video.srcObject = stream;
      })
      .catch(console.error);
  }

  return (
    <>
      <CssBaseline />
      <AppBar position="relative">
        <Toolbar variant="dense">
          <IconButton edge="start" color="inherit" aria-label="menu" sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Container maxWidth="sm">
        <div id="container" style={{ marginTop: "10px" }}>
          <div>
            {/* <video id="prevideo" autoPlay width={320} muted controls /> */}
            <video muted={true} id="video" playsInline={true} autoPlay={true} />
            <br />

            {/* <audio autoPlay={true} muted={false} /> */}
          </div>
          <div>
            {isRecording ? (
              <Button
                variant="contained"
                disableElevation
                onClick={stopRecording}
                style={{marginRight: "10px", marginTop:"10px" }}
              >
                Stop Recording
              </Button>
            ) : (
              <Button
                variant="contained"
                disableElevation
                onClick={startRecoding}
                style={{marginRight: "10px", marginTop:"10px" }}
              >
                Start Recording
              </Button>
            )}
            <Button
              disabled={btnDisabled}
              variant="contained"
              disableElevation
              onClick={testingDownload}
              style={{marginRight: "10px", marginTop:"10px" }}
            >
              Download Recording
            </Button>
            <Button
              variant="contained"
              onClick={testConnection}
              style={{marginRight: "10px", marginTop:"10px" }}
            >
              testing
            </Button>
            {/* <Button
              variant="contained"
              disableElevation
              onClick={turnOffCamera}
              style={{marginRight: "10px", marginTop:"10px" }}
            >
              Turn Off feed
            </Button> */}
            {/* <input type="file" ref={fileInputRef} onChange={handleFileSelect} /> */}
            {/* <Button
              variant="contained"
              disableElevation
              onClick={testingDownload}
              style={{ marginRight: "10px", marginTop:"10px" }}
            >
              Testing Download
            </Button> */}
            {/* <Button variant="contained" disableElevation onClick={turnOnCamera style={{ marginRight: "10px" }}}>on feed Recording</Button> */}
          </div>
        </div>
      </Container>
    </>
  );
}
