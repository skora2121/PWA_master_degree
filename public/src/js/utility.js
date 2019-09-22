var dbPromise = idb.open('feed-store', 1, function(db) {
    if(!db.objectStoreNames.contains('feed')) {
        db.createObjectStore('feed', {keyPath: 'id'});
    }
    if(!db.objectStoreNames.contains('sync-post')) {
        db.createObjectStore('sync-post', {keyPath: 'id'});
    }
});

function writeData(st, data) {
    return dbPromise
        .then(function(db) {
        var tx = db.transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.put(data);
        return tx.complete;
    });
}

function readData(st) {
    return dbPromise
    .then(function(db) {
        var tx = db.transaction(st, 'readonly');
        var store = tx.objectStore(st);
        return store.getAll();
    });
}

function clearData(st){
    return dbPromise
    .then(function(db){
        var tx = db.transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.clear();
        return tx.complete;
    });
}

function deleteItem(st, id) {
    dbPromise
    .then(function(db) {
        var tx = db.transaction(st, 'readwrite');
        var store = tx.objectStore(st);
        store.delete(id);
        return tx.complete;
    })
    .then(function(){
        console.log('Item deleted!');
    })
}

