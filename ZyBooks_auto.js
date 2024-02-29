// ==UserScript==
// @name         ZyBooks auto
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Automatically do ZyBooks
// @author       adorejc
// @match        https://*.zybooks.com/*
// @grant        none
// @supportURL   https://github.com/AdoreJc/ZyBooks_auto/issues
// @license      MIT
// @downloadURL
// @updateURL
// ==/UserScript==

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(elementString, timeout){
    const startTime = Date.now();
    let element = document.querySelector(elementString);
    while (element === null) {
        await sleep(100);
        element = document.querySelector(elementString);
        if (element !== null) return true;
        if (Date.now() - startTime >= timeout) {
            return false;
        }
    }
    return true;
}

async function goToNext(){
    let next = document.querySelector(".nav-text.next");
    await next.click();
    await sleep(1000);
    await waitForElement(".nav-text.next", 5000);
    console.log("Ass");

}

async function main(){
    await solvePage();
    await solveMultipleChoice();
    while(true){
        await sleep(1000);
        await solveMultipleChoice();
        await solveDrapAndDrop();
        if(await isCompleteExceptChallenge()){
            await goToNext();
            await sleep(1000);
            await solveMultipleChoice();

        }
    }
}

async function isComplete(){
    let chevrons = Array.from(document.getElementsByClassName("zb-chevron"));
    let complete = true;
    await chevrons.forEach((i)=>{
        if(!i.classList.contains("filled")){
            complete = false;
        }
    });
    return complete;

}

async function isCompleteExceptChallenge(){
    let participation = Array.from(document.querySelectorAll(".interactive-activity-container.participation"));
    let chevrons = [];
    participation.forEach((i)=>{
        let chevs = Array.from(i.getElementsByClassName("zb-chevron"));
        chevs.forEach((j)=>{
            chevrons.push(j);
        })

    })
    let complete = true;
    await chevrons.forEach((i)=>{
        if(!i.classList.contains("filled")){
            complete = false;
        }
    });
    return complete;
}

//Check if the question is completed
function isQuestionCompleted(questionElement) {
    const completedIndicator = questionElement.querySelector('div[aria-label="Question completed"]');
    return completedIndicator !== null;
}


async function solveDrapAndDrop(){
    let activities = document.querySelectorAll(".interactive-activity-container.participation.custom-content-resource");
    for(let i=0;i<activities.length;i++){
        let draggables = Array.from(activities[i].querySelectorAll(".draggable-object"));
        let targets = activities[i].querySelectorAll(".draggable-object-target.definition-drag-container");
        for(let j=0;j<draggables.length;j++){
            for(let k=0;k<targets.length;k++){
                if(targets[k].querySelector(".term-bucket").classList.contains("populated")) continue;
                await simulateDragAndDrop(draggables[j], targets[k]);
                await sleep(100);
                draggables[j] = targets[k].querySelector(".draggable-object");
                // console.log(targets[k].querySelector(".draggable-object"));
                // console.log(draggables[j]);
                let correcto = targets[k].parentElement.querySelector(".correct");
                if(correcto){
                    break;
                }
            }
        }
    }
}


async function simulateDragAndDrop(sourceNode, destinationNode) {
    const EVENT_TYPES = {
        DRAG_END: 'dragend',
        DRAG_START: 'dragstart',
        DROP: 'drop'
    }
    const dataTransfer = new MyDataTransfer();

    function createCustomEvent(type) {
        const event = new CustomEvent(type, { bubbles: true, cancelable: true });
        event.dataTransfer = dataTransfer;
        return event;
    }

    let events = [];

    // let myDataTransfer = new MyDataTransfer();
    events.push(createCustomEvent(EVENT_TYPES.DRAG_START));

    events.push(createCustomEvent(EVENT_TYPES.DROP));

    // Dispatch dragstart and dragend events on the sourceNode
    events.forEach((event) => sourceNode.dispatchEvent(event));

    const dropEvent = createCustomEvent(EVENT_TYPES.DROP);
    destinationNode.dispatchEvent(dropEvent);
}


class MyDataTransfer {
    constructor() {
        this.dropEffect = "all";
        this.effectAllowed = "all";
        this.files = [];
        this.items = new DataTransferItemList();
        this.types = [];
    }
    setData(format, data) {
        this.data[format] = data;
    }
    getData(format) {
        return this.data[format];
    }
    clearData(format = null) {
        if (format) {
            delete this.data[format];
        } else {
            this.data = {};
        }
    }
    clearData(type) {
        if (type) {
            const index = this.types.indexOf(type);
            if (index !== -1) {
                this.types.splice(index, 1);
            }
        } else {
            this.types = [];
        }
    }

    getData(type) {
        const index = this.types.indexOf(type);
        return index !== -1 ? this.items[index].data : '';
    }

    setData(type, data) {
        const index = this.types.indexOf(type);
        if (index !== -1) {
            this.items[index].data = data;
        } else {
            this.types.push(type);
            this.items.add(new DataTransferItem(type, data));
        }
    }

    setDragImage(imageElement, x, y) {
        // Implement the setDragImage functionality here
    }
}

class DataTransferItem {
    constructor(type, data) {
        this.type = type;
        this.data = data;
    }
}

class DataTransferItemList extends Array {
    add(item) {
        this.push(item);
    }
}

//Solve multiple choice questions
async function solveMultipleChoice(){
    var mulChoice;
    //answer multiple choice
    mulChoice = Array.from(document.querySelectorAll(".question-set-question.multiple-choice-question.ember-view"));
    for(const i of mulChoice){
        if (isQuestionCompleted(i)) {
            //console.log("Skip finished question");
            continue;
        }
        let choices = Array.from(i.querySelectorAll("input"));
        // await sleep(100);

        for(const choice of choices) {
            choice.click();
            await sleep(300);
            if(i.querySelector(".zb-explanation").classList.contains("correct")) break;
        }
    };
}

//Check Play button state
async function waitForButtonChange(btnDiv) {
    while (!btnDiv.classList.contains('rotate-180') && btnDiv.classList.contains('bounce')) {
        await sleep(500);
    }
}


async function solvePage(){
    let adone = false;
    let tdone = false;
    var e;
    var s;
    var c;
    var a;
    var f;
    var t;
    var mulChoice;

    //answer multiple choice
    mulChoice = Array.from(document.querySelectorAll(".question-set-question.multiple-choice-question.ember-view"));
    for(const i of mulChoice){
        let choices = Array.from(i.querySelectorAll("input"));
        // await sleep(100);

        for(const choice of choices) {
            let explanation = i.querySelector(".zb-explanation");
            if(!explanation?.classList) {
                // console.log("explanation",explanation);
                // console.log("i: ",i);
                break;
            };
            let click = !explanation.classList.contains("correct");
            if(click){
                console.log(click)
                choice.click();
                await sleep(100);
                explanation = i.querySelector(".zb-explanation");
            }
        }
    };



    async function zy(){

        function setKeywordText(text, element) {
            var el = element;
            el.value = text;
            var evt = document.createEvent("Events");
            evt.initEvent("change", true, true);
            el.dispatchEvent(evt);
        };

        function sleep(ms){ return new Promise(resolve => setTimeout(resolve, ms));}

        function decodeHtml(html) {
            var txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
        }



        // Slideshow play
        e = Array.from(document.getElementsByClassName("zb-button"));
        // start button
        s = Array.from(document.getElementsByClassName("title"));
        // 2x speed button
        c = Array.from(document.getElementsByClassName("speed-control"));
        //multiple choice answers


        // Show answer on text answer
        var temp = a;
        a = Array.from(document.getElementsByClassName("show-answer-button"));

        if (!a.every((val, index) => val === temp[index])){
            adone = false;
            tdone = false;
        }
        //forfeitted answers
        f = Array.from(document.getElementsByClassName("forfeit-answer"));
        // text answer box
        t = Array.from(document.getElementsByClassName("ember-text-area"));

        //Start slideshow
        s.forEach((i)=>{
            if (i.innerHTML == "Start"){
                i.click();
            }
        });

        // Click 2x speed
        c.forEach((i)=>{
            if (i.children[0].children[0].checked==false){
                i.children[0].children[0].click();
            }
        });

        // Start Slideshow
        for (const i of e){
            let btnDiv = i.querySelector('div');
            if (btnDiv && btnDiv.classList.contains('bounce')) {
                i.click();
                console.log('等待下一步或重新开始');
            }
        }



        // Double click show answer
        if (!adone && a.length > 0){
            a.forEach((i)=>{
                i.click();
                i.click();
            });
            adone = true;
        }

        // Enter answer and click
        if (adone && !tdone){
            if (f.length == t.length){
                let count = 0;
                t.forEach((i)=>{
                    i.value = decodeHtml(f[count].innerHTML);
                    setKeywordText(i.value, i);
                    count++;
                });
                s.forEach((i)=>{
                    if (i.innerHTML == "Check"){
                        i.click();
                    }
                });
                tdone = true;
            }
        }
    }

    setInterval(zy,100);
}

main();
