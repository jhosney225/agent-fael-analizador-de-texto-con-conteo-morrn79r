
```javascript
import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";

const client = new Anthropic();

interface TextStatistics {
  totalWords: number;
  uniqueWords: number;
  averageWordLength: number;
  sentenceCount: number;
  paragraphCount: number;
  mostCommonWords: Array<{ word: string; count: number }>;
  longestWord: string;
  shortestWord: string;
}

function analyzeText(text: string): TextStatistics {
  // Count paragraphs
  const paragraphs = text.split("\n\n").filter((p) => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // Count sentences
  const sentences = text.match(/[.!?]+/g) || [];
  const sentenceCount = sentences.length;

  // Split into words and clean
  const words = text
    .toLowerCase()
    .replace(/[^\w\s'-]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);

  const totalWords = words.length;

  // Count unique words
  const uniqueWordsSet = new Set(words);
  const uniqueWords = uniqueWordsSet.size;

  // Calculate average word length
  const totalChars = words.reduce((sum, word) => sum + word.length, 0);
  const averageWordLength = totalWords > 0 ? totalChars / totalWords : 0;

  // Find longest and shortest words
  let longestWord = "";
  let shortestWord = words[0] || "";

  for (const word of words) {
    if (word.length > longestWord.length) {
      longestWord = word;
    }
    if (word.length < shortestWord.length) {
      shortestWord = word;
    }
  }

  // Count word frequencies
  const wordFrequency: Record<string, number> = {};
  for (const word of words) {
    wordFrequency[word] = (wordFrequency[word] || 0) + 1;
  }

  // Get top 10 most common words
  const mostCommonWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word, count]) => ({ word, count }));

  return {
    totalWords,
    uniqueWords,
    averageWordLength: parseFloat(averageWordLength.toFixed(2)),
    sentenceCount,
    paragraphCount,
    mostCommonWords,
    longestWord,
    shortestWord,
  };
}

function formatStatistics(stats: TextStatistics): string {
  let output = "\n📊 TEXT STATISTICS REPORT\n";
  output += "=".repeat(50) + "\n";
  output += `Total Words: ${stats.totalWords}\n`;
  output += `Unique Words: ${stats.uniqueWords}\n`;
  output += `Average Word Length: ${stats.averageWordLength} characters\n`;
  output += `Sentences: ${stats.sentenceCount}\n`;
  output += `Paragraphs: ${stats.paragraphCount}\n`;
  output += `Longest Word: ${stats.longestWord} (${stats.longestWord.length} chars)\n`;
  output += `Shortest Word: ${stats.shortestWord} (${stats.shortestWord.length} chars)\n`;

  if (stats.totalWords > 0) {
    const readingTime = Math.ceil(stats.totalWords / 200);
    output += `Estimated Reading Time: ${readingTime} minute(s)\n`;
  }

  output += "\nTop 10 Most Common Words:\n";
  output += "-".repeat(50) + "\n";
  for (let i = 0; i < stats.mostCommonWords.length; i++) {
    const { word, count } = stats.mostCommonWords[i];
    const percentage = ((count / stats.totalWords) * 100).toFixed(1);
    output += `${i + 1}. "${word}": ${count} times (${percentage}%)\n`;
  }

  output += "=".repeat(50) + "\n";
  return output;
}

async function getAIInsights(text: string, stats: TextStatistics): Promise<string> {
  const prompt = `Analyze the following text statistics and provide 2-3 brief insights:

Text Statistics:
- Total Words: ${stats.totalWords}
- Unique Words: ${stats.uniqueWords}
- Average Word Length: ${stats.averageWordLength}
- Sentences: ${stats.sentenceCount}
- Paragraphs: ${stats.paragraphCount}
- Most Common Words: ${stats.mostCommonWords.map((w) => w.word).join(", ")}

Text Preview: "${text.substring(0, 500)}${text.length > 500 ? "..." : ""}"

Provide concise insights about the text's complexity, style, and characteristics.`;

  const message = await client.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const responseText =
    message.content[0].type === "text" ? message.content[0].text : "";
  return `\n🤖 AI INSIGHTS:\n${responseText}`;
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n🔍 TEXT ANALYZER WITH AI INSIGHTS");
  console.log("================================\n");

  const question = (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        resolve(answer);
      