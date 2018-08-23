window.onload = function () {

  let preview = document.getElementById("preview");
  let recording = document.getElementById("recording");
  let startButton = document.getElementById("startButton");
  let stopButton = document.getElementById("stopButton");
  let downloadButton = document.getElementById("downloadButton");
  let logElement = document.getElementById("log");

  // video autoplay but with a x seconds of delay
  setTimeout(function () {
    document.getElementById("preview").play();
  }, 5000);


  // exibe countdown timer
  function startTimer(duration, display) {
    var timer = duration, minutes, seconds;
    setInterval(function () {
      minutes = parseInt(timer / 60, 10)
      seconds = parseInt(timer % 60, 10);

      minutes = minutes < 10 ? "0" + minutes : minutes;
      seconds = seconds < 10 ? "0" + seconds : seconds;

      display.textContent = seconds;

      if (--timer < 0) {
        timer = duration;
      }
    }, 1000);
  }

  window.onload = function () {
    var fiveMinutes = 30,
      display = document.getElementById('mensagem');
    startTimer(fiveMinutes, display);
  };


  let recordingTimeMS = 15000;
  function log(msg) {
    logElement.innerHTML += msg + "\n";
  }
  function wait(delayInMS) {
    return new Promise(resolve => setTimeout(resolve, delayInMS));
  }
  function startRecording(stream, lengthInMS) {
    let recorder = new MediaRecorder(stream);
    let data = [];

    recorder.ondataavailable = event => data.push(event.data);
    recorder.start();
    log(recorder.state + " for " + (lengthInMS / 1000) + " seconds...");

    let stopped = new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.name);
    });

    let recorded = wait(lengthInMS).then(
      () => recorder.state == "recording" && recorder.stop()
    );

    return Promise.all([
      stopped,
      recorded
    ])
      .then(() => data);
  }
  function stop(stream) {
    stream.getTracks().forEach(track => track.stop());
  }

  startButton.addEventListener("click", function () {
    navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    }).then(stream => {
      preview.srcObject = stream;
      downloadButton.href = stream;
      preview.captureStream = preview.captureStream || preview.mozCaptureStream;
      return new Promise(resolve => preview.onplaying = resolve);
    }).then(() => startRecording(preview.captureStream(), recordingTimeMS))
      .then(recordedChunks => {
        let recordedBlob = new Blob(recordedChunks, { type: "video/webm" });
        recording.src = URL.createObjectURL(recordedBlob);
        downloadButton.href = recording.src;
        downloadButton.download = "RecordedVideo.webm";

        log("Successfully recorded " + recordedBlob.size + " bytes of " +
          recordedBlob.type + " media.");
      })
      .catch(log);
  }, false);

  stopButton.addEventListener("click", function () {
    stop(preview.srcObject);
  }, false);
};
