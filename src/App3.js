import React, { useState, useEffect } from "react";

export default function App3() {
  // const [mediaStream, setMediaStream] = useState(null);
  // const [theRecorder, setTheRecorder] = useState(null);
  // const [recorder, setRecorder] = useState(null);
  // const [recorder2, setRecorder2] = useState();
  // const [recordedChunks, setRecordedChunks] = useState([]);

  const [stream, setStream] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [isRecording, setIsRecording] = useState(false);

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
    // Create a new MediaRecorder
    const newRecorder = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9,opus" });
    setRecorder(newRecorder);
  }, [stream]);

  function startRecoding() {
    setRecordedChunks([]);
    recorder.start();
    setIsRecording(true);
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "test.mp4";
    document.body.appendChild(a);
    a.click();
    // setTimeout() here is needed for Firefox.
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 100);
    // a.remove();
  }

  return (
    <div id="container" style={{ margin: "auto", width: "50%" }}>
      <div>
        {/* <video id="video" autoPlay width={320} /> */}
        <video
          muted={true}
          id="video"
          playsInline={true}
          style={{ width: "80vw" }}
          autoPlay={true}
        />
        <br />

        <audio autoPlay={true} muted={false} />
      </div>
      <div>
        {isRecording ? (
          <button onClick={stopRecording} style={{ marginRight: "10px" }}>
            Stop Recording
          </button>
        ) : (
          <button onClick={startRecoding} style={{ marginRight: "10px" }}>
            Start Recording
          </button>
        )}
        <button onClick={download}>Download Recording</button>
      </div>
    </div>
  );
}
