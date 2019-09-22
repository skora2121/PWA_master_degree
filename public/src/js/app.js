var notificationsButtons = document.querySelectorAll('.enable-notifications');

if(!window.Promise) {
    window.Promise = Promise;
}

// Provjera podrzava li broswer sw
if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/public/sw.js').then(function() {
        console.log('Service worker is registered.');
    }).catch(function(err) {
        console.log(err);
    });
}

function displayNotification() {
    if('serviceWorker' in navigator) {
        var options = {
            body: 'You subscribed for notifications',
            icon: '/public/src/images/icons/app-icon-96x96.png',
            image: '/public/src/images/sf-boat.jpg',
            dir: 'ltr',
            lang: 'en-US',
            vibrate: [100, 50, 100],
            badge: '/public/src/images/icons/app-icon-96x96.png',
            tag: 'confirm-notification',
            renotify: true,
            actions: [
                {action: 'confirm', title: 'OK', icon: '/public/src/images/icons/app-icon-96x96.png' },
                {action: 'cancel', title: 'Cancel', icon: '/public/src/images/icons/app-icon-96x96.png' }
            ]
        };

        navigator.serviceWorker.ready
        .then(function(swregistration){
            swregistration.showNotification('Subscribed!', options);
        });
    }  
}

function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');
  
    var rawData = window.atob(base64);
    var outputArray = new Uint8Array(rawData.length);
  
    for (var i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

function configurePushSubscription() {
    if(!('serviceWorker' in navigator)) {
        return;
    }

    var reg;
    navigator.serviceWorker.ready
    .then(function(swreg) {
        reg = swreg;
        return swreg.pushManager.getSubscription();
    })
    .then(function(sub) {
        if(sub === null) {
            //Stvara se nova preplata
            var vapidPublicKey = 'BBKzUQJl3oW8Jp7T1zK8ch1pxfeM47szrJ2hq9sABnpeIiaNR5rPqWmuigx8EinVCe5EWVwVp9gqmzPmkicqoOM';
            var convertedVapidPublicKey = urlBase64ToUint8Array(vapidPublicKey);
            return reg.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: convertedVapidPublicKey
            });
        }
        else {
            //Pretplata već postoji
        }
    })
    .then(function(newSub) {
        return fetch('https://diplomskipwa-6bf3c.firebaseio.com/subscriptions.json', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(newSub)
        })
    })
    .then(function(res){
        if(res.ok) {
            displayNotification();
        }
    })
    .catch(function(err) {
        console.log(err);
    });
}

function askNotifPermission() {
    Notification.requestPermission(function(result) {
        console.log('User Choice', result);
        if(result !== 'granted') {
            console.log('No permission granted for notifications');
        }
        else {
            configurePushSubscription();
            //displayNotification();  
        }
    }); 
}

if('Notification' in window && 'serviceWorker' in navigator) {
    for(var i = 0; i< notificationsButtons.length; i++) {
        notificationsButtons[i].getElementsByClassName.display = 'inline-block';
        notificationsButtons[i].addEventListener('click', askNotifPermission);
    }
}    