const columnInputValueDisplay = document.getElementById('columnConter');
const columnInput = document.getElementById('columns');
const fillrateInput = document.getElementById('fillrate');
const fillrateInputValueDisplay = document.getElementById(
  'fillrateValueDisplay'
);
const kwprobInput = document.getElementById('kwprob');
const kwprobInputValueDisplay = document.getElementById('kwprobValueDisplay');
const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');

const conversations = [];
const groups = [];
const gridHeight = 400;
const gridWidth = 600;

let fillrate = 0.0;
let kwprob = 0.5;

let seconds = 5;
let gridLengthInMinutes = 15;
let people = 14;

let drawInterval;
let socket;

let grid = d3
  .select('#grid')
  .append('svg')
  .attr('width', gridWidth)
  .attr('height', '100vh')
  .attr('xmlns', 'http://www.w3.org/2000/svg');

columnInputValueDisplay.innerText = people;
columnInput.value = people;

fillrateInputValueDisplay.innerText = fillrate;
fillrateInput.value = fillrate;

kwprobInputValueDisplay.innerText = kwprob;
kwprobInput.value = kwprob;

/* Listeners
-----------------------------------------------------------------------------*/
columnInput.addEventListener('change', handleRedraw);
columnInput.addEventListener('input', handleColumnChange);

fillrateInput.addEventListener('change', reconnect);
fillrateInput.addEventListener('input', handleFillrateChange);

kwprobInput.addEventListener('change', reconnect);
kwprobInput.addEventListener('input', handleKwProbChange);

startButton.addEventListener('click', connect);
stopButton.addEventListener('click', disconnect);

/* Initialize
-----------------------------------------------------------------------------*/
function initialize() {
  const urlParams = new URLSearchParams(window.location.search);

  setFillrate(urlParams.get('fillrate'));
  setKwprob(urlParams.get('kwprob'));

  connect();
  drawCircles();
}

initialize();

/* Helpers
-----------------------------------------------------------------------------*/
function isNumeric(str) {
  return typeof str == 'string' && !isNaN(str) && !isNaN(parseFloat(str));
}

function setColumn(value) {
  if (isNumeric(value)) {
    people = value;

    columnInput.value = value;
    columnInputValueDisplay.innerText = value;
  }
}

function setFillrate(value) {
  if (isNumeric(value)) {
    fillrate = value;

    fillrateInput.value = value;
    fillrateInputValueDisplay.innerText = value;
  }
}

function setKwprob(value) {
  if (isNumeric(value)) {
    kwprob = value;

    kwprobInput.value = value;
    kwprobInputValueDisplay.innerText = value;
  }
}

/* Handlers
-----------------------------------------------------------------------------*/
function handleColumnChange(event) {
  // people = event.target.value;
  // handleRedraw();
  setColumn(event.target.value);
}

function handleFillrateChange(event) {
  setFillrate(event.target.value);
}

function handleKwProbChange(event) {
  setKwprob(event.target.value);
}

function handleConversation(conversation) {
  conversations.push(conversation);

  if (conversations.length >= gridLengthInMinutes) {
    conversations.shift();
  }

  if (d3.selectAll('g.drawGroup').size() >= gridLengthInMinutes * 2) {
    d3.selectAll('g.drawGroup').each(function (group, index) {
      if (index == 0) {
        d3.select(this).remove();
        return false;
      }
    });
  }

  draw(conversation);
}

function handleRedraw() {
  grid.remove();

  grid = d3
    .select('#grid')
    .append('svg')
    .attr('width', gridWidth)
    .attr('height', '100vh')
    .attr('xmlns', 'http://www.w3.org/2000/svg');

  drawCircles();
}

function handleRowChange(event) {
  gridLengthInMinutes = event.target.value;
  handleRedraw();
}

/* Seismograph
-----------------------------------------------------------------------------*/
function createIntercation(from, to, receiverIndex = 0) {
  return [
    [(gridWidth / people) * from + 5, 5],
    [
      (gridWidth / people) * to + 5,
      (gridHeight / gridLengthInMinutes) * receiverIndex + 5,
    ],
  ];
}

function draw(conversation) {
  const group = grid
    .append('g')
    .attr('class', 'drawGroup')

    .attr('transform', 'translate(0, 0)')
    .attr('fill', 'none');

  function getStrokeWidth(interaction) {
    if (interaction.kw == true) {
      return interaction.fat == true ? 8 : 2;
    }

    return Math.floor(Math.random() * 6) < 5 ? 2 : 8;
  }

  conversation.interactions.forEach((interaction) => {
    const receiverIndex = interaction.time
      ? Math.floor((conversation.time - interaction.time) / seconds)
      : 0;

    const path = group
      .append('path')
      .attr('stroke-width', getStrokeWidth(interaction))
      .attr('stroke', interaction.kw == true ? 'rgb(200, 252, 160)' : 'black')
      .attr(
        'd',
        d3.line()(
          createIntercation(
            interaction.sender,
            interaction.receiver,
            receiverIndex
          )
        )
      );

    const length = path.node().getTotalLength();

    path
      .attr('stroke-dasharray', length + ' ' + length)
      .attr('stroke-dashoffset', length)
      .transition()
      .duration(seconds * 1000)
      .attr('stroke-dashoffset', length * 2);
  });

  groups.push(group);

  if (groups.length >= gridLengthInMinutes) {
    groups.shift();
  }
}

function drawCircles() {
  const circleGroup = grid.append('g').attr('class', 'circles');

  for (let i = 0; i <= gridLengthInMinutes; i++) {
    for (let j = 0; j <= people; j++) {
      circleGroup
        .append('circle')
        .attr('stroke', 'none')
        .attr('fill', 'transparent')
        .attr('cx', (gridWidth / people) * j + 5)
        .attr('cy', (gridHeight / gridLengthInMinutes) * i + 5)
        .attr('r', 4);
    }
  }
}

function startTransitionInterval() {
  drawInterval = setInterval(() => {
    transitionGrid();
  }, seconds * 1000);
}

function transitionGrid() {
  d3.selectAll('g.drawGroup').each(function () {
    d3.select(this)
      .transition()
      .ease(d3.easeLinear)
      .duration(seconds * 1000)
      .attr(
        'transform',
        `translate(0, ${
          gridHeight / gridLengthInMinutes +
          this.transform.baseVal.consolidate().matrix.f
        })`
      );
  });
}

/* Websocket
-----------------------------------------------------------------------------*/
function connect() {
  console.log('Ready state', socket);
  if (!socket || socket.readyState == 3) {
    socket = new WebSocket(
      `ws://io.kodeworks.no/api/ws?rowseconds=${seconds}&fillrate=${fillrate}&kwprob=${kwprob}`
    );

    socket.addEventListener('open', function (event) {
      console.log('Connected to server');
    });

    socket.addEventListener('message', function (event) {
      socket.send('{"type":"ack"}');
      handleConversation(JSON.parse(event.data));
    });

    socket.addEventListener('close', function (event) {
      console.log('lol u got kickd from server', event);
    });

    startTransitionInterval();
  }
}

function disconnect() {
  socket.close();
  clearInterval(drawInterval);
}

function reconnect() {
  disconnect();
  setTimeout(() => connect(), 500);
}
