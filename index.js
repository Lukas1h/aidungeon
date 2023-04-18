import net from "net"
import puppeteer from "puppeteer";
// Define the port number that the server will listen on

const games = [
  {
    id: "3115a690-adc0-11ea-81fd-69ab84d66a7a",
    name: "Zork",
  },
  {
    id: "757929c1-6349-11ec-b65a-a9045c21f45d",
    name: "Post Apocoliptic",
  },
  {
    id: "b2c2cd71-e098-4f3d-9dd4-1d9759bc5fae",
    name: "Highschool Life",
  },
];

function searchGameByName(games, query) {
  const pattern = new RegExp(query, "i"); // Create a regex pattern with the "i" flag for case-insensitivity
  return games.find((game) => pattern.test(game.name));
}


const PORT = 5005;

// Create a new TCP server
const server = net.createServer();
const browser = await puppeteer.launch({ headless: true });

// When a client connects to the server
server.on("connection", async (client) => {
    console.log(
        `Client connected from ${client.remoteAddress}:${client.remotePort}`
    );

    // Send a welcome message to the client
    client.write(`\r\n\r\n            \u001b[7mWelcome To AIDungeon\u001b[0m\r\n`);
    client.write(`
Type \u001b[1mplay <game name>\u001b[0m to play a game.
Type \u001b[1mlist\u001b[0m to list games.\r\n`);
    client.write("\r\n\u001b[1m>");



    let text = ""
    let lastTime = Date.now();
    let isGen = false
    let waitForNext = false;
    let isPlaying = false;
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36')
    async function play(name){
        const game = searchGameByName(games, name);
        
        console.log(game)
        if(game){
            console.log("playing "+game.name)
            console.log("id " + game.id);
            isPlaying = true;
            client.write("\r\n\u001b[1mLoading...");
            await page.goto(
              "https://play.aidungeon.io/main/scenarioPlay?publicId=" +
                game.id,
              { waitUntil: "networkidle0" }
            );

            if (game.id == "b2c2cd71-e098-4f3d-9dd4-1d9759bc5fae") {
                console.log("highschool life")
                await page.focus("textarea");
                await page.keyboard.type("Lukas");
                page.keyboard.press("Enter");
                await page.focus("textarea");
                await page.keyboard.type("Auburn");
                page.keyboard.press("Enter");
                await page.focus("textarea");
                await page.keyboard.type("math");
                page.keyboard.press("Enter");
            }
            if (game.id == "757929c1-6349-11ec-b65a-a9045c21f45d") {
                console.log("post apo life")
                await page.focus("textarea");
                await page.keyboard.type("Lukas");
                page.keyboard.press("Enter");
            }


            setInterval(async () => {
            const innerTexts = await page.evaluate(() => {
                const elements = document.querySelectorAll(
                ".css-901oao.css-16my406.r-1xnzce8"
                );
                return Array.from(elements)
                .map((element) => element.innerText)
                .join();
            });
            if (text == innerTexts) {
                //console.log("Same")
                if (Date.now() - lastTime > 400 && isGen) {
                isGen = false;
                console.log("done generating");
                doneText();
                waitForNext = false;
                }
            } else {
                //console.log("diffret")
                if (true) {
                if (isGen == false) {
                    if (innerTexts.replaceAll(text, "").startsWith(",")) {
                    console.log("STARTS WITH!");
                    console.log(innerTexts.replaceAll(text, ""));
                    }
                    client.write("\u001b[0m\u001b[31m");
                }
                isGen = true;
                if (!waitForNext) {
                    newText(innerTexts.replaceAll(text, ""));
                }
                text = innerTexts;
                lastTime = Date.now();
                }
            }
            }, 20);
        }else{
            client.write("No games matched that name.");
        }



        

    }

    function newText(textNew){
        client.write(textNew);
    }
    function doneText(){
        if (!waitForNext) {
            client.write("\u001b[0m\u001b[1m\r\n> ");
        }
    }

  client.on("data", async (data) => {
    if(isPlaying){
        waitForNext = true;
        await page.focus("textarea");
        await page.keyboard.type(data.toString());
        page.keyboard.press("Enter");
        console.log(data.toString().includes("/say"));
        console.log(data.toString());
        if (data.toString().includes("/say")) {
        console.log("include say");
        waitForNext = false;
        } else {
        console.log("doesnt include say");
        waitForNext = true;
        }
        console.log(waitForNext);
    }else{
        const command = data.toString().trim();
        client.write("\u001b[0m");
        if(command.startsWith("play")){
            play(command.substring( command.indexOf(" ") + 1, command.length ))
        }else if(command.startsWith("list")){
            client.write("Games:\r\n");
            games.forEach((game)=>{
                client.write("\u001b[31m-" + game.name + "\u001b[0m\r\n");
            })
            
        }
        if(!isPlaying){
            client.write("\r\n\u001b[1m>");
        }
    }
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
