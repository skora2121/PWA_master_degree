//import { create } from "domain";

var shareImageButton = document.querySelector('#share-image-button');
var createPostArea = document.querySelector('#create-post');
var closeCreatePostModalButton = document.querySelector('#close-create-post-modal-btn');
var sharedMomentsArea = document.querySelector('#shared-moments');
var form = document.querySelector('form');
var titleInput = document.querySelector('#title');
var locationInput = document.querySelector('#location');
var videoPlayer = document.querySelector('#player');
var canvasEl = document.querySelector('#canvas');
var captureButton = document.querySelector('#capture-button');
var imagePicker = document.querySelector('#image-picker');
var imagePickArea = document.querySelector('#image-pick');
var picture;

function initializeMedia(){
    if(!('mediaDevices' in navigator)) {
        navigator.mediaDevices = {};
    }

    if(!('getUserMedia' in navigator.mediaDevices)) {
        navigator.mediaDevices.getUserMedia = function(constraints) {
            var getUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

            if(!getUserMedia) {
                return Promise.reject(new Error('getUserMedia is not implemented'));
            }

            return new Promise(function(resolve, reject) {
                getUserMedia.call(navigator, constraints, resolve, reject);
            });
        }
    } 

    navigator.mediaDevices.getUserMedia({video: true})
    .then(function(stream) {
        videoPlayer.srcObject = stream;
        videoPlayer.style.display = 'block';
    })
    .catch(function(err) {
        imagePickArea.style.display = 'block';
    });
}

function dataURItoBlob(dataURI) {
    var byteString = atob(dataURI.split(',')[1]);
    var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0]
    var ab = new ArrayBuffer(byteString.length);
    var ia = new Uint8Array(ab);
    for (var i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    var blob = new Blob([ab], {type: mimeString});
    return blob;
  }

captureButton.addEventListener('click', function(event) {
    canvasEl.style.display = 'block';
    videoPlayer.style.display = 'none';
    captureButton.style.display = 'none';
    var context = canvasEl.getContext('2d');
    context.drawImage(videoPlayer, 0, 0, canvas.width, videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width));
    videoPlayer.srcObject.getVideoTracks().forEach(function(track) {
        track.stop();
    });
    picture = dataURItoBlob(canvasEl.toDataURL());
});

imagePickArea.addEventListener('change', function(event) {
    picture = event.target.files[0];
});

function openCreatePostModal() {
    createPostArea.style.display = 'block';
    setTimeout(function() {
        createPostArea.style.transform = 'translateY(0vh)';
        initializeMedia();
    }, 1)
}

function closeCreatePostModal() {
    createPostArea.style.transform = 'translateY(100vh)';
    imagePickArea.style.display = 'none';
    videoPlayer.style.display = 'none';
    canvasEl.style.display = 'none';
}

shareImageButton.addEventListener('click', openCreatePostModal);

closeCreatePostModalButton.addEventListener('click', closeCreatePostModal);

function clearCards() {
    while(sharedMomentsArea.hasChildNodes()) {
        sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
    }
}

function createCard(data) {
    var cardWrapper = document.createElement('div');
    cardWrapper.className = 'shared-moment-card mdl-card mdl-shadow--2dp';
    var cardTitle = document.createElement('div');
    cardTitle.className = 'mdl-card__title';
    cardTitle.style.backgroundImage = 'url('+ data.image +')';
    cardTitle.style.backgroundSize = 'cover';
    cardTitle.style.height = '400px';
    cardWrapper.appendChild(cardTitle);
    var cardTitleTextElement = document.createElement('h2');
    cardTitleTextElement.style.color = 'black';
    cardTitleTextElement.className = 'mdl-card__title-text';
    cardTitleTextElement.textContent = data.title;
    cardTitle.appendChild(cardTitleTextElement);
    var cardSupportingText = document.createElement('div');
    cardSupportingText.className = 'mdl-card__supporting-text';
    cardSupportingText.textContent = data.location;
    cardSupportingText.style.textAlign = 'center';
    cardWrapper.appendChild(cardSupportingText);
    componentHandler.upgradeElement(cardWrapper);
    sharedMomentsArea.appendChild(cardWrapper);
}

function updateUI(data) {
    clearCards();
    for(var i = 0; i < data.length; i++) {
        createCard(data[i]);
    }
}

var url = 'https://diplomskipwa-6bf3c.firebaseio.com/posts.json';
var networkDataReceived = false;

fetch(url)
    .then(function(res) {
        return res.json();
    })
    .then(function(data) {
        networkDataReceived = true;
        console.log('From web', data);
        var dataArray = [];
        for(var key in data) {
            dataArray.push(data[key]);
        }
        updateUI(dataArray);
    });

if ('indexedDB' in window) {
    readData('feed')
    .then(function(data) {
        if(!networkDataReceived){
            console.log('From cache', data);
            updateUI(data);
        }
    });
}

function sendData() {
    var id = new Date().toISOString();
    var postData = new FormData();
    postData.append('id', id);
    postData.append('title', titleInput.value);
    postData.append('location', locationInput.value);
    postData.append('file', picture, id + '.png');

    fetch('https://us-central1-diplomskipwa-6bf3c.cloudfunctions.net/storePostData', {
        method: 'POST',
        body: postData
    })
    .then(function(res) {
        console.log('Sent data', res);
        updateUI();
    })
}

form.addEventListener('submit', function(event) {
    event.preventDefault();
    if(titleInput.value.trim() === '' || locationInput.value.trim() === '') {
        alert('Enter valid data!');
        return;
    }

    closeCreatePostModal();

    if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready
        .then(function(sw) {
            var post = {
                id: new Date().toISOString(),
                title: titleInput.value,
                location: locationInput.value,
                picture: picture
            };
            writeData('sync-post', post)
            .then(function() {
                return sw.sync.register('sync-new-post');
            })
            .then(function() {
                var snackbarContainer = document.querySelector('#confirmation-toast');
                var data = {message: 'Post was saved for syncing'};
                snackbarContainer.MaterialSnackbar.showSnackbar(data);
            })
            .catch(function(err) {
                console.log(err);
            });
            
        });
    }
    else {
        sendData();
    }
});
