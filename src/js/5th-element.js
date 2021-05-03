/**
 * 5th Element :)
 *
 * Adjustable parameters
 * - people
 * - gridLengthInMinutes
 *
 */

const columnInput = document.getElementById('columns');
const rowInput = document.getElementById('rows');

const columnConter = document.getElementById('columnConter');
const rowConter = document.getElementById('rowConter');

const gridWidth = 600;
const gridHeight = 800;

let seconds = 5;
let people = 3;
let gridLengthInMinutes = 15;

const startTime = Math.floor(new Date().getTime() / 1000);

const groups = [];
const conversations = [];

let grid = d3
  .select('#grid')
  .append('svg')
  .attr('width', gridWidth)
  .attr('height', gridHeight)
  .attr('xmlns', 'http://www.w3.org/2000/svg');

columnConter.innerText = people;
rowCounter.innerText = gridLengthInMinutes;

// Handlers
function handleColumnChange(event) {
  people = event.target.value;
  columnConter.innerText = people;
  handleRedraw();
}

function handleRowChange(event) {
  gridLengthInMinutes = event.target.value;
  rowCounter.innerText = gridLengthInMinutes;
  handleRedraw();
}

function handleRedraw() {
  grid.remove();

  grid = d3
    .select('#grid')
    .append('svg')
    .attr('width', gridWidth)
    .attr('height', gridHeight)
    .attr('xmlns', 'http://www.w3.org/2000/svg');

  // conversations.forEach((conversation) => draw(conversation));

  drawCircles();
}

// Listeners
columnInput.addEventListener('input', handleColumnChange);
rowInput.addEventListener('input', handleRowChange);

drawCircles();

function drawCircles() {
  const circleGroup = grid.append('g').attr('class', 'circles');

  for (let i = 0; i <= gridLengthInMinutes; i++) {
    for (let j = 0; j <= people; j++) {
      circleGroup
        .append('circle')
        .attr('stroke', 'none')
        .attr('fill', '#efefef')
        .attr('cx', (gridWidth / people) * j + 5)
        .attr('cy', (gridHeight / gridLengthInMinutes) * i + 5)
        .attr('r', 4);
    }
  }
}

function transitionGrid() {
  d3.selectAll('g.drawGroup').each(function () {
    d3.select(this)
      .transition()
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

function draw(conversation) {
  const group = grid
    .append('g')
    .attr('class', 'drawGroup')
    .attr('stroke', 'black')
    .attr('stroke-width', Math.floor(Math.random() * 2) == 0 ? 2 : 8)
    .attr('transform', 'translate(0, 0)')
    .attr('fill', 'none');

  conversation.interactions.forEach((interaction) => {
    const receiverIndex = interaction.time
      ? Math.floor((conversation.time - interaction.time) / 2)
      : 0;

    const path = group
      .append('path')
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

function createIntercation(from, to, receiverIndex = 0) {
  return [
    [(gridWidth / people) * from + 5, 5],
    [
      (gridWidth / people) * to + 5,
      (gridHeight / gridLengthInMinutes) * receiverIndex + 5,
    ],
  ];
}

//
// Controllers
//
const stopButton = document.getElementById('stopButton');

//
// Websocket
//
const socket = new WebSocket(
  `ws://io.kodeworks.no/api/ws?rowseconds=${seconds}`
);

socket.addEventListener('open', function (event) {
  console.log('Connected to server');
});

socket.addEventListener('message', function (event) {
  socket.send('{"type":"ack"}');

  const conversation = JSON.parse(event.data);
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
});

socket.addEventListener('close', function (event) {
  console.log('lol u got kickd from server', event);
});

const drawInterval = setInterval(() => {
  transitionGrid();
}, seconds * 1000);

stopButton.addEventListener('click', function () {
  socket.close();
  clearInterval(drawInterval);
});

function downloadPng(fileName) {
  const svg = document.querySelector('svg');
  svg.style.background = '#ffffff';

  const copy = svg.cloneNode(true);

  const canvas = document.createElement('canvas');

  const bbox = svg.getBBox();

  canvas.width = gridWidth;
  canvas.height = gridHeight;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, bbox.width, bbox.height);

  const data = new XMLSerializer().serializeToString(copy);

  const img = new Image();
  const svgBlob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = function () {
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    const imgURI = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream');
    triggerDownload(imgURI, fileName);
  };

  img.src = url;
}

function triggerDownload(imgURI, fileName) {
  const event = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true,
  });

  const anchor = document.createElement('a');
  anchor.setAttribute('download', fileName);
  anchor.setAttribute('href', imgURI);
  anchor.setAttribute('target', '_blank');
  anchor.dispatchEvent(event);
}

const downloadButton = document.getElementById('downloadButton');
downloadButton.addEventListener('click', () => downloadPng('fil.png'));

// const lol = [
//   {
//     time: 1618474794,
//     interactions: [
//       {
//         sender: 11,
//         receiver: 0,
//         time: 1618474744,
//       },
//     ],
//   },
//   {
//     time: 1618474774,
//     interactions: [
//       {
//         sender: 10,
//         receiver: 9,
//         time: 1618474754,
//       },
//     ],
//   },
//   {
//     time: 1618474772,
//     interactions: [
//       {
//         sender: 7,
//         receiver: 7,
//         time: 1618474764,
//       },
//     ],
//   },
//   {
//     time: 1618474764,
//     interactions: [
//       {
//         sender: 7,
//         receiver: 7,
//         time: 1618474756,
//       },
//     ],
//   },
//   {
//     time: 1618474754,
//     interactions: [
//       {
//         sender: 10,
//         receiver: 9,
//         time: 1618474746,
//       },
//       {
//         sender: 9,
//         receiver: 10,
//       },
//     ],
//   },
//   {
//     time: 1618474746,
//     interactions: [
//       {
//         sender: 10,
//         receiver: 10,
//         time: 1618474742,
//       },
//     ],
//   },
// ];

// const interval = setInterval(() => {
//   const conv = lol.pop();
//   conversations.push(conv);
//   draw(conv);
// }, seconds * 1000);
