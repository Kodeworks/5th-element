function generateConversations() {
  return {
    time: new Date().getTime() / 1000,
    interactions: [...Array(Math.floor(Math.random() * 2 + 1))].map(() =>
      generateInteraction()
    ),
  };
}

function generateInteraction() {
  const randomPerson = Math.floor(Math.random() * people) - 1;

  const interaction = {
    sender: randomPerson,
    receiver: getRandomMessageReceiver(randomPerson),
  };

  if (Math.floor(Math.random() * 2) == 1) {
    interaction.time =
      new Date().getTime() / 1000 -
      Math.floor(Math.random() * gridLengthInMinutes);
  }

  return interaction;
}

function getRandomMessageReceiver(from) {
  let messageReceiver = from;

  while (messageReceiver == from) {
    messageReceiver = Math.floor(Math.random() * people);
  }

  return messageReceiver;
}
