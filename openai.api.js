import { configDotenv } from "dotenv";
import OpenAI from "openai";

configDotenv();
const openai = new OpenAI();

function formatComments(comments) {
  let formated = "";
  for (let i = 0; i < comments.length; i++)
    formated += `${i}. ${comments[i]["content"]}\n`;
  return formated;
}

export async function generateAdvice(advert, comments) {
  const ai = await openai.chat.completions.create({
    model: "ft:gpt-3.5-turbo-0613:schoola-ltd::7ySsiGfU",
    messages: [
      {
        role: "system",
        content: "You a helpful advert adviser",
      },
      {
        role: "user",
        content: `Please generate an assessment of the following advertisement and provide advice for improvement. You can specify the HTML structure for the response, including headings, paragraphs and lists.
        Strengths: [Highlight the adverts/posts strengths]
        Weaknesses: [Highlight the adverts/posts weaknesses]
        Assessment: [Begin your assessment. You can start by evaluating the advertisement's strengths and weaknesses, target audience, messaging, design, and overall effectiveness]
        Advice: [Provide specific recommendations for improvement]
        Advert:\n${advert}\nComments:\n${formatComments(comments)}`,
      },
    ],
  });
  return ai.choices[0].message["content"];
}
