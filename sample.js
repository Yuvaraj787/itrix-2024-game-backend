import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyCu9moKfY6MQ9GMzEFicJVdrf_32VmIuV4");

async function run(gameData) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        var n = gameData.length;

        var len = Object.keys(gameData).length
        var users = Object.keys(gameData)
        var missing = {

        }

        console.log(users);

        for (let i = 0; i < len; i++) {
            missing[users[i]] = {
                batting_score: 0,
                bowling_score: 0,
                overall_score: 0,
                players: gameData[users[i]].players,
                justification: '-'
            }
        }

        console.log(missing);

        var missing_str = JSON.stringify(missing)
        console.log(missing_str)
        const prompt = missing_str + ". These data contains information of various users and their respective cricket team players. now fill the batting_score (0 - 10), bowling_score(0 - 10), overall_score(0 - 10), rank and justification based on their balance of the team (consider the batting, bowling, captain and wicket-keeper and provide fair points for each field and justification (reason for your points)).Strictly No other things required. just fill the required fields (instead of 0 and '-' fill with scores. dont leave it with 0 and '-') and just give the js stringified object (I parse your response with JSON.parse() so give response such that parse() doesnt throw any errors)"


        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text =  response.text().replace(/```json\s*|\s*```/g, "");
        console.log("Gemini provided results", text)
        var obj = JSON.parse(text)

        const resArr = []
        for (let i = 0; i < len; i++) {
            let us = users[i];
            resArr.push({
                ...obj[us],
                username: us,
                players: missing[us].players,
            })
        }
        resArr.sort((a, b) => b.overall_score - a.overall_score)
        resArr.forEach((e, i) => e.rank = i + 1)
        console.log(resArr)
        return resArr
    } catch (Err) {
        console.log("Errors occured : " + Err.message)
        return {}
    }
}

var sampleGameData = { "Yuvi": { "batting_score": 0, "bowling_score": 0, "overall_score": 0, "players": ["Rohit Sharma", "Ravindra Jadeja", "Aaron Finch", "D'Arcy Short", "Shehan Jayasuriya"], "justification": "-" }, "Yuvi-dev-test": { "batting_score": 0, "bowling_score": 0, "overall_score": 0, "players": ["Shaun Marsh", "Usman Khawaja", "Alex Hales", "Prithvi Shaw", "Mohammad Nawaz"], "justification": "-" } }

run(sampleGameData).then(data => console.log(data))
