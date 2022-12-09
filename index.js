//
//  https://www.koby.dev
//  twitter: @builtbymax
//  instagram: @koby.dev
//

function pageReady(callback) {
  if (document.readyState !== "loading") {
    callback();
  } else document.addEventListener("DOMContentLoaded", callback);
}

const Call = {
  init: () => {
    Call.Ui();
  },

  Ui: () => {
    const buttonList = document.querySelectorAll(
      ".ui-container .navigation-controls-container button"
    );
    if (buttonList.length) {
      buttonList.forEach((button) => {
        button.onclick = () => {
          button.classList.toggle("active");
          if (button.classList.contains("switch")) {
            button.querySelector(".icon").classList.toggle("active");
          }
          if (button.classList.contains("button-cam-element")) {
            const camElement = document.querySelector(".cam-container");
            Call.playPause(camElement.querySelector("video"));
            camElement.classList.toggle("disabled");
          }
        };
      });
    }
  },

  playPause: (video) => {
    if (video.paused) video.play();
    else video.pause();
  },
};

pageReady(() => {
  Call.init();
});

const Config = {
  hasClass: (element, property) => element.classList.contains(property),
  findElement: (element, parentClass) => {
    const parent = element.parentElement;
    if (!Config.hasClass(parent, parentClass)) {
      return Config.findElement(parent, parentClass);
    }
    return parent;
  },
};

// Video Functionality

const APP_ID = "af7069668baf42cdb17bc57dcbbc433b";
const TOKEN =
  "007eJxTYJBWnP+LfXN461Sl2cWzijjV5XNSs2+8P72TX9pJzE+gkFGBITHN3MDM0szMIikxzcQoOSXJ0Dwp2dQ8JTkpKdnE2DhJZP/k5IZARob9s7czMTJAIIjPy5CYU5CRqJuckZiXl5rDwAAAl30gvg==";
const CHANNEL = "alpha-channel";

const client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

let localTracks = [];
let remoteUsers = {};

let joinAndDisplayLocalStream = async () => {
  client.on("user-published", handleUserJoined);

  client.on("user-left", handleUserLeft);

  let UID = await client.join(APP_ID, CHANNEL, TOKEN, null);

  localTracks = await AgoraRTC.createMicrophoneAndCameraTracks();

  let player = `<div class="video-container" id="user-container-${UID}">
                        <div class="video-player" id="user-${UID}"></div>
                  </div>`;
  document
    .getElementById("video-streams")
    .insertAdjacentHTML("beforeend", player);

  localTracks[1].play(`user-${UID}`);

  await client.publish([localTracks[0], localTracks[1]]);
};

let joinStream = async () => {
  await joinAndDisplayLocalStream();
  document.getElementById("join-btn").style.display = "none";
  document.getElementById("stream-controls").style.display = "flex";
};

let handleUserJoined = async (user, mediaType) => {
  remoteUsers[user.uid] = user;
  await client.subscribe(user, mediaType);

  if (mediaType === "video") {
    let player = document.getElementById(`user-container-${user.uid}`);
    if (player != null) {
      player.remove();
    }

    player = `<div class="video-container" id="user-container-${user.uid}">
                        <div class="video-player" id="user-${user.uid}"></div> 
                 </div>`;
    document
      .getElementById("video-streams")
      .insertAdjacentHTML("beforeend", player);

    user.videoTrack.play(`user-${user.uid}`);
  }

  if (mediaType === "audio") {
    user.audioTrack.play();
  }
};

let handleUserLeft = async (user) => {
  delete remoteUsers[user.uid];
  document.getElementById(`user-container-${user.uid}`).remove();
};

let leaveAndRemoveLocalStream = async () => {
  for (let i = 0; localTracks.length > i; i++) {
    localTracks[i].stop();
    localTracks[i].close();
  }

  await client.leave();
  document.getElementById("join-btn").style.display = "block";
  document.getElementById("stream-controls").style.display = "none";
  document.getElementById("video-streams").innerHTML = "";
};

let toggleMic = async (e) => {
  if (localTracks[0].muted) {
    await localTracks[0].setMuted(false);
    e.target.innerText = "Mic on";
    e.target.style.backgroundColor = "cadetblue";
  } else {
    await localTracks[0].setMuted(true);
    e.target.innerText = "Mic off";
    e.target.style.backgroundColor = "#EE4B2B";
  }
};

let toggleCamera = async (e) => {
  if (localTracks[1].muted) {
    await localTracks[1].setMuted(false);
    e.target.innerText = "Camera on";
    e.target.style.backgroundColor = "cadetblue";
  } else {
    await localTracks[1].setMuted(true);
    e.target.innerText = "Camera off";
    e.target.style.backgroundColor = "#EE4B2B";
  }
};

document.getElementById("join-btn").addEventListener("click", joinStream);
document
  .getElementById("leave-btn")
  .addEventListener("click", leaveAndRemoveLocalStream);
document.getElementById("mic-btn").addEventListener("click", toggleMic);
document.getElementById("camera-btn").addEventListener("click", toggleCamera);
