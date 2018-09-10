var WelcomeMsg = "<audio src='https://s3.amazonaws.com/ask-soundlibrary/foley/amzn_sfx_glasses_clink_01.mp3'/> Welcome to the Distillery Quiz. You get 3 points for an easy question, 5 for a hard one and lose one for an incorrect or pass. Would you like and easy, or hard question?";
var whatQuestionType = "Which distillery do you think this is?"

var getRandomIncorrect = (answerGiven) => {
    var questions = [`Nope! ${answerGiven} wasn't right, try again or say pass`, 
    `${answerGiven} is not the answer I have here, why don't you guess again?`, 
    `${answerGiven} is wrong, think harder and guess again or say pass`, 
    "This isn't your finest hour is it? " + `${answerGiven} was incorrect. Try again or say pass`];
    var random = getRandom(0, questions.length-1);
    return "<break time='.5s'/>" + questions[random]; 
};

var getRandomIncorrectTwice = (answerGiven) => {
    var questions = [`${answerGiven} is still wrong, last try! You can say pass if you're not sure.`, 
    `Are you enjoying your whisky too much? ${answerGiven} is incorrect, try again. You can say pass if you don't know the answer`, 
    `This is just getting embarrassing, try one last time`, 
    `${answerGiven}? That wasn't right either. I really thought you'd know this. One last guess`, 
    `${answerGiven} isn't right either. One last try, or maybe you should just pass`, 
    `${answerGiven}? Incorrect. I'll give you one last guess`,
    `Come on, you know this! ${answerGiven} wasn't right. Try one last time or say pass`];
    var random = getRandom(0, questions.length-1);
    return "<break time='.5s'/>" + questions[random]; 
};

var getRandomShallWeBeginfirst = () => {
    var questions = ["Do you want an easy or a hard question?", 
    "Would you like an easy or a hard question?", 
    "Sit back, relax. Shall we go for an easy or a hard question?",
    "I'm ready to go. Would you prefer an Easy or a hard question?",  
    "It's time for a question. Easy or Hard?"];
    var random = getRandom(0, questions.length-1);
    return "<break time='.5s'/>" + questions[random]; 
};

var getRandomShallWeBeginSecond = () => {
    var questions = ["Okay, choose your next question. easy or hard?", 
    "Would you like an easy or hard one next?", 
    "I've got two questions ready. Shall we go easy or hard?", 
    "It's time for a question. Easy or Hard?"];
    var random = getRandom(0, questions.length-1);
    return "<break time='.5s'/>" + questions[random]; 
};

var getRandomRightAnswer = (answer) => {
    var questions = [`You're right, ${answer} is the correct answer.`, 
    `${answer} is right. Well Done!`, 
    `${answer} was the right answer. You've obviously researched whisky a lot!`,
    `${answer} was correct. You're getting good at this!`, 
    `Go you! ${answer} is what I was looking for!`, 
    `${answer} is right! You really know your whisky. I think that's a compliment right?`,
    `Correct! ${answer} is the right answer.`];
    var random = getRandom(0, questions.length-1);
    return "<break time='.5s'/>" + questions[random]; 
};

var getClose = (userScore, numberTotal) => {
    if (numberTotal === 1) {
        questions = "question";
    } else {
        questions = "questions";
    }
    //ignore numberRight. Send in userScore. As my 'expected value of -1,3,5 is 7 or 3 results,
    //then 7/3 (2.3) is average. Multiply by how many questions they answered (in total). 
    //so totalquestions * 2.3 compared to 
    //on average, people who answer x number of questions scored 2.3*totalquestions. You did better/worst than this.
    
    averageScore = Math.floor(numberTotal * 2.3);
    if (userScore > averageScore) {
        howDidTheyDo = `Wow! You did well, the average score from ${numberTotal} ${questions} is ${averageScore} points and you scored ${userScore}`
    } else if (userScore === averageScore) {
        howDidTheyDo = `You did okay, the average score from ${numberTotal} ${questions} is ${averageScore} points and you scored ${userScore}`
    } else if (userScore < averageScore) {
        howDidTheyDo = `You didn't do that well, the average score from ${numberTotal} ${questions} is ${averageScore} points and you only scored ${userScore}`
    }
    return howDidTheyDo;

};

function getRandom(min, max)
{
    return Math.floor(Math.random() * (max-min+1)+min);
};

module.exports = {
    WelcomeMsg,
    whatQuestionType,
    getRandomIncorrect,
    getRandomIncorrectTwice,
    getRandomRightAnswer,
    getRandomShallWeBeginfirst,
    getRandomShallWeBeginSecond,
    getClose
};