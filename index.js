import net from "net";
import puppeteer from "puppeteer";

import * as dotenv from "dotenv"; // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
dotenv.config();
// Define the port number that the server will listen on
const PORT = 5000;

// Create a new TCP server
const server = net.createServer();

// When a client connects to the server
server.on("connection", async (client) => {
  console.log(
    `Client connected from ${client.remoteAddress}:${client.remotePort}`
  );

  // Send a welcome message to the client
  client.write(
    "Welcome to AIDungeon. Use the `search` command to search for a game.\r\n\r\n"
  );
	client.write( ">");

  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

	async function search(query){
		console.log("searching ",query)
		await page.goto(
      "https://play.aidungeon.io/main/search?searchTerm="+encodeURIComponent(query),
      { waitUntil: "networkidle0" }
    );
		const elements = await page.$$eval(
      ".css-1dbjc4n.r-18u37iz>.css-901oao.css-nfaoni",
      (elements) => {
        return Array.from(elements, (element) => element.innerText);
      }
    );
		
		console.log(elements)
		return elements
	}

	async function play(query){
		console.log("searching ",query)
		await page.goto(
      "https://play.aidungeon.io/main/search?searchTerm="+encodeURIComponent(query),
      { waitUntil: "networkidle0" }
    );
		var links = await page.$$(
      ".css-1dbjc4n.r-1awozwy.r-18u37iz.r-16y2uox.r-u8s1d.r-zchlnj > *:last-child"
    );
		console.log(links)
    await links[0].click();
		
	}

  
  // When the client sends data to the server
  client.on("data", async (data) => {
    const command = data.toString().trim();

    // Handle different commands here
    if (command.startsWith("help")) {
      client.write("Available commands: help, quit\r\n");
    } else if (command.startsWith("search")) {
      let results = await search(command.split(" ")[1]);
			results.forEach((title)=>{
				client.write(title+"\r\n");
			})
    } else if (command.startsWith("play")) {
      await play(command.split(" ")[1]);
    } else if (command.startsWith("quit")) {
      client.write("Goodbye!\r\n");
      client.end();
    } else {
      client.write(`Unknown command: ${command}\r\n`);
    }
		client.write("\r\n >");
  });

  // When the client disconnects from the server
  client.on("end", () => {
    console.log(
      `Client disconnected from ${client.remoteAddress}:${client.remotePort}`
    );
  });
});

// Start listening for connections on the defined port
server.listen(PORT, () => {
  console.log(`Telnet server listening on port ${PORT}`);
});
