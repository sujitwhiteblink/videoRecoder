import React, { useState, useEffect } from "react";

import { Container,AppBar,IconButton,Toolbar,Button} from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import MenuIcon from '@mui/icons-material/Menu';

import {Decoder, Encoder, tools, Reader} from 'ts-ebml';
import { Buffer } from 'buffer';

export default function App3() {
  // to user buffer class/instance in browser
  window.Buffer = Buffer;
  
  const [stream, setStream] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [btnDisabled, setBtnDisabled] = useState(true)
  const [length, setLength] = useState()
  const [framerate, setFramerate] = useState()
  const [creationTime, setCreationTime] = useState()
  const [date, setDate] = useState()
  const [blob1, setBlob1] = useState(null);


  const readAsArrayBuffer = (blob) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsArrayBuffer(blob);
        reader.onloadend = () => { resolve(reader.result); };
        reader.onerror = (ev) => { reject(ev.error); };
    });
  
  }

  const injectMetadata = (blob) => {
    const decoder = new Decoder();
    const reader = new Reader();
    reader.logging = false;
    reader.drop_default_duration = false;

    readAsArrayBuffer(blob).then((buffer) => {
        const elms = decoder.decode(buffer);
        elms.forEach((elm) => { reader.read(elm); });
        reader.stop();

        let refinedMetadataBuf = tools.makeMetadataSeekable(
            reader.metadatas, reader.duration, reader.cues);
        let body = buffer.slice(reader.metadataSize);
        let result = new Blob([refinedMetadataBuf, body],
            {type: blob.type});

        const url = URL.createObjectURL(result);
        const a = document.createElement("a");
        a.style.display = "none";
        a.href = url;
        a.download = "test.mp4";
        document.body.appendChild(a);

        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 100);

        a.click();
    });
}

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

    let mimeType;
    if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9,opus')) {
        mimeType = 'video/webm; codecs=vp9,opus';
    } else if (MediaRecorder.isTypeSupported('video/webm; codecs=vp9')) {
        mimeType = 'video/webm; codecs=vp9';
    } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
    }else {
        mimeType = 'video/webm; codecs=vp8 ';
    }
    console.log("mimetype", mimeType)


    
    let options = {
      type: "video",
      video: {
          width: 1280,
          height: 720
      },
      frameInterval: 1,
      frameRate:30,
      mimeType: mimeType
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
    
  }, [stream]);

  function startRecoding() {
    setRecordedChunks([]);
    recorder.start();
    // recorder.startRecording();
    setIsRecording(true);
    if(btnDisabled == false){
      setBtnDisabled(true)
    }

    try {
      // When data is available, push it to the recordedChunks array
      recorder.ondataavailable = (e) => {
        setRecordedChunks((prevChunks) => [...prevChunks, e.data]);
      };
    } catch (e) {
      console.error("Exception while creating MediaRecorder: " + e);
      return;
    }
  }

  function stopRecording() {
    
    console.log("recordedChunks", recordedChunks);
    try {
      recorder.stop();
      setIsRecording(false);
      setBtnDisabled(false);

      // retrieve the current date and time
    let date = new Date();
    let creationTime = date.toISOString();

    setDate(date);
    setCreationTime(creationTime);

    
    // retrieve the length of the recorded video
    let video = document.querySelector("video");
    setLength(video.duration);

    // retrieve the framerate of the recorded video
    setFramerate(video.frameRate);

    // set the metadata (length, framerate, and creation date) for the video file
    let metadata = {
        length: length,
        framerate: framerate,
        creationTime: creationTime
    };

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
    injectMetadata(blob)
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement("a");
    // a.style.display = "none";
    // a.href = blob1;
    // a.download = "test.mp4";
    // document.body.appendChild(a);

    // a.click();
    // // setTimeout() here is needed for Firefox.
    // setTimeout(function () {
    //   URL.revokeObjectURL(url);
    // }, 100);


    // a.remove();
  }

  function turnOffCamera() {
    let video = document.querySelector("#video");
    video.srcObject.getTracks().forEach(track => track.stop());
  };

  function turnOnCamera() {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
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
      <div id="container" style={{marginTop:'10px'}}>
      <div>
        {/* <video id="video" autoPlay width={320} /> */}
        <video
          muted={true}
          id="video"
          playsInline={true}
          autoPlay={true}
          
        />
        <br />

        <audio autoPlay={true} muted={false} />
      </div>
      <div>
        {isRecording ? (
          <Button variant="contained" disableElevation onClick={stopRecording} style={{ marginRight: "10px" }}>
            Stop Recording
          </Button>
        ) : (
          <Button variant="contained" disableElevation onClick={startRecoding} style={{ marginRight: "10px" }}>
            Start Recording
          </Button>
        )}
        <Button disabled={btnDisabled} variant="contained" disableElevation onClick={download} style={{ marginRight: "10px" }}>Download Recording</Button>
        {/* <Button variant="contained" disableElevation onClick={turnOffCamera} style={{ marginRight: "10px" }}>off feed</Button> */}
        {/* <Button variant="contained" disableElevation onClick={turnOnCamera style={{ marginRight: "10px" }}}>on feed Recording</Button> */}
      </div>
    </div>
      </Container>
    
    </>
  );
}
