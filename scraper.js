const Nightmare = require("nightmare");
const cheerio = require("cheerio");
const fs = require("fs");

const board = "auto";

const url = (board) => {
  //return "http://boards.4chan.org/" + board + "/catalog";
};

const crawlCatalogue = async () => {
  console.log("Starting crawl process for /" + board + "/");
  const nightmare = new Nightmare({ show: false });
  try {
    let threadArray = [];
    let threads = await nightmare
      .goto(url(board))
      .wait("#threads .thread")
      .evaluate(() => {
        let elements = Array.from(document.getElementsByClassName("postContainer"));
        return elements.map((elem) => {
          return {
            content: elem.innerHTML,
          };
        });
      })
      .end()
      .then((threads) => {
        console.log(
          "Found " + threads.length + " threads. Mapping to objects..."
        );
        //console.log(threads);
        //let resto 
        let formatted = threads.map((item) => {
          let $ = cheerio.load(item.content);
          //console.log(item.resto);
          let filename = $(".file .fileText a").attr("href");
          let fext = "";
          let fsize = 0;
          if ( filename != undefined ) {
            fext = "." + filename.split('.').pop();
          }

          data = {
            no: parseInt($("input[value=delete]").attr("name")),
            resno: 0,       //  ?
            sticky: 0,      //  ?
            closed: 0,      //  ?
            now: $("span[class='dateTime']").text(),
            time: $("span[class='dateTime']").attr("data-utc"),
            name: $(".desktop span[class='name']").text(),
            trip: $("span[class='postertrip']").text(),
            id: "",                                       //  ?
            capcode: "",                                  //  ?
            country: "XX",                                //  ?
            country_name: "XX",                           //  ?
            sub: $(".desktop span[class='subject']").text(),
            com: "",                                      //  ?
            tim: "",                                      //  ?
            filename: filename,      //  what meaning of poster's device????????? There are two divs with classname "fileText" and "fileThumb". which one?
            ext: fext,
            fsize: $(".fileThumb > img").attr("alt"),
            md5: $(".fileThumb > img").attr("data-md5"),
            w: $("div.fileText").text(),
            h: $("div.fileText").text(),
            tn_w: "",
            tn_h: "",
            filedeleted: "",        // ?
            spoiler: "",            // ?
            custom_spoiler: "",     // ?
            replies: "",            // ?
            images: "",             // ?
            bumplimit: "",          // ?
            imagelimit: "",         // ?
            tag: "",                // ?
            semantic_url: "",       // ?
            since4pass: "",         // ?
            unique_ips: "",         // ?
            m_img: "",              // ?
            archived: "",           // ?
            archived_on: "",        // ?
          };
          return data;
        });
        return formatted;
      });
    return threads;
  } catch (err) {
    console.log(err);
  }
};

crawlCatalogue()
  .then((response) => {
    console.log("Completed with no errors! Writing file.");
    var today = new Date();
    var time =
      today.getFullYear() +
      "_" +
      today.getMonth() +
      "_" +
      today.getDate() +
      "_" +
      today.getHours() +
      "_" +
      today.getMinutes() +
      "_" +
      today.getSeconds();
    let formattedResponse = JSON.stringify(response, null, 4);
    try {
      fs.writeFileSync(time + "_log.json", formattedResponse, "utf8");
      console.log("File output complete.");
    } catch (err) {
      if (err) throw err;
    }
  })
  .catch((e) => console.log(e));
