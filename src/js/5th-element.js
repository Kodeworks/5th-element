/**
 * 5th Element :)
 *
 * Adjustable parameters
 * - people
 * - gridLengthInMinutes
 *
 */

const gridWidth = 600;
const gridHeight = 800;
const people = 22;
const gridLengthInMinutes = 15;

const startTime = Math.floor(new Date().getTime() / 1000);

const groups = [];
const conversations = [];

let groupCount = 0;
let conversationsCount = 0;

const grid = d3
  .select('#grid')
  .append('svg')
  .attr('width', gridWidth)
  .attr('height', gridHeight)
  .attr('xmlns', 'http://www.w3.org/2000/svg');

for (let i = 0; i <= people; i++) {
  for (let j = 0; j <= people; j++) {
    grid
      .append('circle')
      .attr('stroke', 'none')
      .attr('fill', 'none')
      .attr('cx', (gridWidth / people) * j + 5)
      .attr('cy', (gridHeight / gridLengthInMinutes) * i + 5)
      .attr('r', 4);
  }
}

function transitionGrid() {
  groups.forEach((_group, i) => {
    const index =
      groups.length - Math.floor((conversations[i].time - startTime) / 2);
    const translateY = (gridHeight / gridLengthInMinutes) * index;

    _group
      .transition()
      .duration(2000)
      .attr('transform', `translate(0, ${translateY})`);
  });
}

function draw(conversation) {
  const group = grid
    .append('g')
    .attr('stroke', 'black')
    .attr('stroke-width', 2)
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
      .duration(2000)
      .attr('stroke-dashoffset', 0);
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

function getUserCoordinate(user) {
  return parseInt(user.slice(4)) - 1;
}

//
// Controllers
//
const stopButton = document.getElementById('stopButton');

stopButton.addEventListener('click', function () {
  clearInterval(interval);
});

//
// Websocket
//
const socket = new WebSocket('ws://io.kodeworks.no/api/ws');

socket.addEventListener('open', function (event) {
  console.log('Connected to server');
});

socket.addEventListener('message', function (event) {
  const conversation = event.data;
  conversations.push(conversation);

  if (conversations.length >= gridLengthInMinutes) {
    conversations.shift();
  }

  draw(conversation);
});
