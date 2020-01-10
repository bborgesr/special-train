import {
  Observable,
  of,
  from,
  fromEvent,
  concat,
  interval,
  throwError
} from "rxjs";
import { ajax } from "rxjs/ajax";
import { filter, tap, catchError, take, takeUntil } from "rxjs/operators";

import { allBooks, allReaders } from "./data";

//#region Creating Observables
// creating observable from scratch
console.log("---------------- Observable from scratch -------------------");
let allBooksObservable$ = new Observable(subscriber => {
  if (document.title !== "RxJS Demo") {
    subscriber.error("Incorrect page title");
  }
  for (let book of allBooks) {
    subscriber.next(book);
  }
  setTimeout(() => {
    subscriber.complete();
  }, 2000);

  return () => console.log("Executing teardown code.");
});

allBooksObservable$.subscribe(book => console.log(book.title));

// using `of`
console.log("------------------- Observable from of ---------------------");
let source1$ = of("hello", 10, true, allReaders[0].name);
source1$.subscribe(value => console.log(value));

// using `from`
console.log("------------------ Observable from from --------------------");
let source2$ = from(allBooks);
source2$.subscribe(book => console.log(book.title));

// combining observers
console.log("------------------- Combining observers --------------------");
concat(source1$, source2$).subscribe(value => console.log(value));

// using DOM events
console.log("--------------------- Using DOM events ---------------------");
let button = document.getElementById("readersButton");
fromEvent(button, "click").subscribe(event => {
  console.log(event);
  let readersDiv = document.getElementById("readers");
  for (let reader of allReaders) {
    readersDiv.innerHTML += reader.name + "<br/>";
  }
});

// using ajax/http
console.log("-------------------- Using Ajax events ---------------------");
fromEvent(button, "click").subscribe(event => {
  ajax("/api/readers").subscribe(ajaxResponse => {
    console.log(ajaxResponse);
    let readers = ajaxResponse.response;

    let readersDiv = document.getElementById("readers");
    for (let reader of readers) {
      readersDiv.innerHTML += reader.name + "<br/>";
    }
  });
});

//#endregion

//#region Subscribing to Observables with Observers
// observers
console.log("---------------- Using explicit observer 1 -----------------");
let myObserver = {
  next: value => console.log(`Value produced: ${value}`),
  error: err => console.log(`ERROR: ${err}`),
  complete: () => console.log(`All done producing values`)
};

let sourceObservable$ = of(1, 3, 5);
sourceObservable$.subscribe(myObserver);

// alternatively:
sourceObservable$.subscribe(
  value => console.log(`Value produced: ${value}`),
  err => console.log(`ERROR: ${err}`),
  () => console.log(`All done producing values`)
);

console.log("---------------- Using explicit observer 2 -----------------");
let books$ = from(allBooks);
let booksObserver = {
  next: book => console.log(`Title: ${book.title}`),
  error: err => console.log(`ERROR: ${err}`),
  complete: () => console.log(`All done`)
};
books$.subscribe(booksObserver);

// alternatively:
books$.subscribe(
  book => console.log(`Title: ${book.title}`),
  err => console.log(`ERROR: ${err}`),
  () => console.log(`All done`)
);

console.log("----------------- Optional observer args -------------------");
books$.subscribe(null, null, () => console.log(`All done`));

console.log("---------- Multiple observers for an observable ------------");
let currentTime$ = new Observable(subscriber => {
  const timeString = new Date();
  const time = timeString.getMilliseconds();
  subscriber.next(time);
  subscriber.complete();
});

currentTime$.subscribe(currentTime =>
  console.log(`Observer 1: ${currentTime}`)
);

setTimeout(() => {
  currentTime$.subscribe(currentTime =>
    console.log(`Observer 2: ${currentTime}`)
  );
}, 2000);

setTimeout(() => {
  currentTime$.subscribe(currentTime =>
    console.log(`Observer 3: ${currentTime}`)
  );
}, 4000);

console.log("------------ Unsubscribing from an observable --------------");
let timesDiv = document.getElementById("times");
let timerButton = document.getElementById("timerButton");

// let timer$ = interval(1000);

let timer$ = new Observable(subscriber => {
  let i = 0;
  let intervalID = setInterval(() => {
    subscriber.next(i++);
  }, 1000);

  return () => {
    console.log("Executing teardown code"); // executed
    clearInterval(intervalID);
  };
});

/*
let timerSubscription = timer$.subscribe(
  value =>
    (timesDiv.innerHTML += `${new Date().getMilliseconds()} (${value}) <br />`),
  null,
  () => console.log("All done!") // not executed
);

let timerConsoleSubscription = timer$.subscribe(value =>
  console.log(`${new Date().getMilliseconds()} (${value})`)
);

timerSubscription.add(timerConsoleSubscription);
// timerSubscription.remove(timerConsoleSubscription);

fromEvent(timerButton, "click").subscribe(event =>
  timerSubscription.unsubscribe()
);
*/

//#endregion

//#region Using operators
console.log("-------------------- Using Operators -----------------------");
allBooksObservable$
  .pipe(
    filter(book => book.publicationYear < 1950),
    tap(oldBook => console.log(`Title: ${oldBook.title}`))
  )
  .subscribe(book => console.log(book));

console.log("-------------------- Handling Errors -----------------------");
allBooksObservable$
  .pipe(
    filter(book => book.publicationYear < 1950),
    tap(oldBook => console.log(`Title: ${oldBook.title}`)),
    catchError(
      // swallow the error
      // err => of({ title: "Corduroy", author: "Don Freeman" })

      // re-try the same code again
      // (err, obervableThatCaughtTheError) => obervableThatCaughtTheError

      // throw error
      // err => throw `Something bad happened - ${err.message}`

      // returns an observable that immediately produces an error
      err => throwError(err.message)
    )
  )
  .subscribe(
    finalValue => console.log(`VALUE: ${finalValue.title}`),
    error => console.log(`ERROR: ${error}`)
  );

console.log("--------------- Controlling number of values -----------------");
// timer$.pipe(take(3)).subscribe(
//   value =>
//     (timesDiv.innerHTML += `${new Date().getMilliseconds()} (${value}) <br />`),
//   null,
//   () => console.log("All done!") // executed
// );

let cancelTimer$ = fromEvent(timerButton, "click");
timer$.pipe(takeUntil(cancelTimer$)).subscribe(
  value =>
    (timesDiv.innerHTML += `${new Date().getMilliseconds()} (${value}) <br />`),
  null,
  () => console.log("All done!") // executed!
);

//#endregion

//#region Sandbox
// from https://medium.com/codingthesmartway-com-blog/getting-started-with-rxjs-part-1-setting-up-the-development-environment-creating-observables-db76ce053725
/*
var observable = Observable.create((observer: any) => {
  observer.next("Hello World!");
  observer.next("Hello Again!");
  observer.complete();
  observer.next("Bye");
});
observable.subscribe(
  (x: any) => logItem(x),
  (error: any) => logItem("Error: " + error),
  () => logItem("Completed")
);
function logItem(val: any) {
  var node = document.createElement("li");
  var textnode = document.createTextNode(val);
  node.appendChild(textnode);
  document.getElementById("list").appendChild(node);
}
*/

// function return values
/*
function GetBookById(id: number) {
  const book = allBooks.find(b => b.bookID === id);
  return book.title;
}
let book = GetBookById(5);
console.log(book);
*/
//#endregion
