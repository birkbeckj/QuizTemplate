const Alexa = require('ask-sdk');
const https = require('https');
const extMsg = require('./messages.js');
const request = require('request');

BASE_ID = `appahbUfwrO59Y77d`;
TABLE_NAME = `tbltbpNoBBiYe8DiY`;
API_KEY = ``;

var bigListofQuestions = {};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    // get attributes
    const attributes = await attributesManager.getPersistentAttributes() || {};
    // get the number of questions and update, minus 1 for array at zero
    bigListofQuestions = await getAirtable();
    attributes.totalQuestions = (Number(bigListofQuestions.records.length) - 1);
    console.log(`Total Number of Questions found was ${attributes.totalQuestions}`);
    if (attributes.userScore === undefined) {
      // setup new user if first time here
      attributes.questionAsked = false;
      attributes.currentAnswer = "";
      attributes.userScore = 0;
      attributes.timesAnswered = 0;
      attributes.listQuestionsAsked = [];
      attributes.questionsRight = 0;
      attributes.questionsWrong = 0;
      speechText = extMsg.WelcomeMsg;
      repromptText = extMsg.WelcomeMsg;
    } else {
      // else welcome back the user
      speechText = `<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_glasses_clink_01.mp3'/> Welcome back. You currently have ${attributes.userScore} points. You can say start a new game to reset your score. <break time='.3s'/> ${extMsg.getRandomShallWeBeginfirst()}`;
      repromptText = `Welcome back. ${extMsg.getRandomShallWeBeginfirst()}`;
      //reset in case we hard exited
      attributes.questionAsked = false;
      attributes.timesAnswered = 0;
      attributes.listQuestionsAsked = [];
    }
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const GameHandler = {
  async canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    return attributes.questionAsked === false && handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'EasyQuestionIntent';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const responseBuilder = handlerInput.responseBuilder;
    // get attributes
    const attributes = await attributesManager.getPersistentAttributes();
    const total = attributes.totalQuestions;

    // send off questions ask to the question manager
    let listQuestionNumbers = await questionManager(attributes.listQuestionsAsked, total);
    // strip off the last number back as that's the random number
    let randomNumber = listQuestionNumbers[listQuestionNumbers.length - 1];
    // lookup a question
    question = await lookupQuestion(randomNumber);
    attributes.currentAnswer = (question.answer.toLowerCase());
    speechText = `Okay, here is your question for 3 points. <break time='.3s'/> ${question.questionEasy}`;
    // set a flag that question asked, how much the point is worth, question/answer and save
    attributes.questionAsked = true;
    attributes.pointsWorth = 3;
    attributes.currentQuestion = question.questionEasy;
    attributes.timesAnswered = 0;
    attributes.listQuestionsAsked = listQuestionNumbers;
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();
    return responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

const HardQuestionHandler = {
  async canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    return attributes.questionAsked === false && handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'HardQuestionIntent';
  },
  async handle(handlerInput) {

    const attributesManager = handlerInput.attributesManager;
    const responseBuilder = handlerInput.responseBuilder;
    // get attributes
    const attributes = await attributesManager.getPersistentAttributes();
    const total = attributes.totalQuestions;

    // send off questions ask to the question manager
    let listQuestionNumbers = await questionManager(attributes.listQuestionsAsked, total);
    // strip off the last number back as that's the random number
    let randomNumber = listQuestionNumbers[listQuestionNumbers.length - 1];
    // lookup a question
    question = await lookupQuestion(randomNumber);
    attributes.currentAnswer = (question.answer.toLowerCase());
    speechText = `Okay, here is your question for 5 points. <break time='.3s'/> ${question.questionHard}`;
    // set a flag that question asked
    attributes.questionAsked = true;
    attributes.pointsWorth = 5;
    attributes.currentQuestion = question.questionHard;
    attributes.timesAnswered = 0;
    attributes.listQuestionsAsked = listQuestionNumbers;
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();
    return responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

function getAirtable() {
  return new Promise((resolve, reject) => {
    request({
      url: `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/?api_key=${API_KEY}`,
      json: true
    }, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        resolve(body);
      } else
        reject("Cannot Reach Questions");
    });
  });
};

// keep a list of questions and randomise again if already asked
// we do this by being sent the list of question that are already asked, finding a new one,
// then extracting the last one in the array as the new random number (above).
function questionManager(list, total) {
  // iterate over a loop to make sure it's not in there
  do {
    var seenQuestionBefore = false;
    var randomNumber = getRandom(0, total);
    for (var i = 0; i < list.length; i++) {
      if (randomNumber === list[i]) {
        seenQuestionBefore = true;
        // Log these so we can see it in action
        console.log(`Question asked ${randomNumber}, has seen before is ${seenQuestionBefore} so selecting another`);
      }
    }
  }
  while (seenQuestionBefore === true);
  // once outside save add the number to the list
  list.push(randomNumber);
  // lose a number if we're reaching the end of ones asked. Stops us grinding to a halt if we use all the questions
  if (list.length > (total - 3)) { list.shift() };
  // finish the list and save it

  return list;
}



const ResetGameHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'StartNewGameIntent';
  },
  async handle(handlerInput) {

    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes() || {};
    // reset score and everything else
    attributes.userScore = 0;
    attributes.questionAsked = false;
    attributes.timesAnswered = 0;
    attributes.listQuestionsAsked = [];
    attributes.questionsRight = 0;
    attributes.questionsWrong = 0;
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();

    speechText = "Okay, I've reset your score. <break time='.5s'/>" + extMsg.WelcomeMsg;
    repromptText = `Okay, I've reset your score. <break time='.5s'/> ${extMsg.getRandomShallWeBeginfirst()}`;

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const PassHandler = {
  async canHandle(handlerInput) {
    // Only respond to pass if a question has been asked
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    return attributes.questionAsked === true && handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'PassIntent';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    const currentAnswer = attributes.currentAnswer;

    speechText = `Okay, you passed that one. The answer was ${currentAnswer}, and you've lost a point! ${extMsg.getRandomShallWeBeginfirst()}`;
    repromptText = `The answer was ${currentAnswer}. ${extMsg.getRandomShallWeBeginfirst()}`;

    attributes.questionAsked = false;
    // lose a point
    attributes.userScore -= 1
    attributes.timesAnswered = 0;
    attributes.questionsWrong += 1;
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

const RepeatQuestionHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.RepeatIntent';
  },
  async handle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    if (attributes.questionAsked === true) {
      speechText = `The current question is <break time='.3s'/> ${attributes.currentQuestion} <break time='.5s'/> ${extMsg.whatQuestionType}`;
      repromptText = `The question is <break time='.3s'/> ${attributes.currentQuestion}`;
    } else if (attributes.questionAsked === false) {
      speechText = `${extMsg.getRandomShallWeBeginfirst()}`;
      repromptText = `${extMsg.getRandomShallWeBeginfirst()}`;
    }
    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};


const AnswerHandler = {
  async canHandle(handlerInput) {
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    return attributes.questionAsked === true && handlerInput.requestEnvelope.request.type === "IntentRequest" &&
      handlerInput.requestEnvelope.request.intent.name === "AnswerIntent";
  },
  async handle(handlerInput, error) {


    // Get the Details of the Question and Answer and Compare
    console.log("ANSWER HANDLER");
    var spokenValue = getSpokenValue(handlerInput.requestEnvelope, "distillery").toLowerCase();
    var resolvedValues = getResolvedValues(handlerInput.requestEnvelope, "distillery");
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    // Log this so we can check what was said in the logs, good for testing synonyms
    console.log(`What was said ${spokenValue}, The correct answer , ${attributes.currentAnswer}, and what it translated too ${resolvedValues[0].value.name.toLowerCase()}`);

    // If right
    if (resolvedValues[0].value.name.toLowerCase() === attributes.currentAnswer) {
      attributes.userScore += attributes.pointsWorth;
      speechText = `${extMsg.getRandomRightAnswer(attributes.currentAnswer)}. Your score is now ${attributes.userScore} points. <break time='.5s'/> ${extMsg.getRandomShallWeBeginSecond()}`;
      repromptText = "You got the answer right" + extMsg.getRandomShallWeBeginSecond();
      attributes.questionAsked = false;
      attributes.questionsRight += 1;

      // reset times answered
      attributes.timesAnswered = 0;
    } else {
      // If Wrong
      if (attributes.timesAnswered === 0) {
        speechText = extMsg.getRandomIncorrect(spokenValue);
        repromptText = extMsg.getRandomIncorrect(spokenValue);
        attributes.timesAnswered += 1;
      } else if (attributes.timesAnswered === 1) {
        speechText = extMsg.getRandomIncorrectTwice(spokenValue);
        repromptText = extMsg.getRandomIncorrectTwice(spokenValue);
        attributes.timesAnswered += 1;
      } else if (attributes.timesAnswered > 1) {
        attributes.userScore -= 1;
        speechText = `The correct answer was ${attributes.currentAnswer}. <break time='.3s'/> You've lost a point. ${extMsg.getRandomShallWeBeginSecond()}`;
        repromptText = "Your score is now " + attributes.userScore + "." + extMsg.getRandomShallWeBeginSecond();
        // reset timesanswered
        attributes.timesAnswered = 0;
        attributes.questionAsked = false;
        attributes.questionsWrong += 1;
      }
    }
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speechText = 'You can ask for an easy or a hard question, or to start over, say start new game';

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(speechText)
      .getResponse();
  },
};

// For 'no' cancel or stop intent, do this:
const NoCancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'IntentRequest'
      && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
        || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent' || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.NoIntent');
  },
  async handle(handlerInput) {
    // save the score
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();
    attributes.questionAsked = false;
    attributesManager.setPersistentAttributes(attributes);
    await attributesManager.savePersistentAttributes();
    // get the message depending on how well they've done
    scoreMessage = extMsg.getClose(attributes.userScore, (attributes.questionsRight + attributes.questionsWrong));
    const speechText = `Okay, I've saved your progress. ${scoreMessage}. see you again. Goodbye!`;
    return handlerInput.responseBuilder
      .speak(speechText)
      .getResponse();
  },
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    console.log(`Session ended with reason: ${handlerInput.requestEnvelope.request.reason}`);

    return handlerInput.responseBuilder.getResponse();
  },
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  async handle(handlerInput, error) {
    console.log(`Error handled: ${error.message}`);
    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes();

    // Answer differently if we're in a question or not
    if (attributes.questionAsked === true) {
      speechText = `Sorry I didn't quite get that. ${extMsg.whatQuestionType} <break time='.3s'/> ${attributes.currentQuestion}`;
      repromptText = `${extMsg.whatQuestionType} <break time='.3s'/> ${attributes.currentQuestion}}`;
    } else if (attributes.questionAsked === false) {
      speechText = "I'm sorry I didn't understand that." + extMsg.getRandomShallWeBeginfirst();
      repromptText = "I didn't quite get that" + extMsg.getRandomShallWeBeginfirst();
    }

    return handlerInput.responseBuilder
      .speak(speechText)
      .reprompt(repromptText)
      .getResponse();
  },
};

async function lookupQuestion(randomNumber) {
  questionName = (bigListofQuestions.records[randomNumber].fields.Answer);
  questionEasy = (bigListofQuestions.records[randomNumber].fields.Easy);
  questionHard = (bigListofQuestions.records[randomNumber].fields.Hard);
  questionQuestion = { answer: questionName, questionEasy: questionEasy, questionHard: questionHard };
  console.log(questionQuestion);
  return questionQuestion;
};


function getRandom(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

function getSpokenValue(envelope, slotName) {
  if (envelope &&
    envelope.request &&
    envelope.request.intent &&
    envelope.request.intent.slots &&
    envelope.request.intent.slots[slotName] &&
    envelope.request.intent.slots[slotName].value) {
    return envelope.request.intent.slots[slotName].value;
  }
  else return undefined;
}

function getResolvedValues(envelope, slotName) {
  if (envelope &&
    envelope.request &&
    envelope.request.intent &&
    envelope.request.intent.slots &&
    envelope.request.intent.slots[slotName] &&
    envelope.request.intent.slots[slotName].resolutions &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0] &&
    envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values) {
    return envelope.request.intent.slots[slotName].resolutions.resolutionsPerAuthority[0].values;
  }
  else return undefined;
}

//  This section of code logs the errors in a more verbose way
const RequestLog = {
  process(handlerInput) {
    console.log("REQUEST ENVELOPE = " + JSON.stringify(handlerInput.requestEnvelope));
    return;
  }
};

const skillBuilder = Alexa.SkillBuilders.standard();

exports.handler = skillBuilder
  .addRequestHandlers(
    LaunchRequestHandler,
    GameHandler,
    HardQuestionHandler,
    AnswerHandler,
    RepeatQuestionHandler,
    PassHandler,
    ResetGameHandler,
    HelpIntentHandler,
    NoCancelAndStopIntentHandler,
    SessionEndedRequestHandler
  )
  .addErrorHandlers(ErrorHandler)
  .withTableName('Distillery-Quiz-Data')
  .withAutoCreateTable(true)
  .addRequestInterceptors(RequestLog)
  .lambda();