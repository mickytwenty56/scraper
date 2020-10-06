const Nightmare = require("nightmare");
const cheerio = require("cheerio");
const fs = require("fs");

const board = "auto";

const url = (board) => {
  return "https://boards.4channel.org/fit/thread/57745622";       // Archived
  //return "https://boards.4channel.org/fit/thread/17018018";         // Sticky / Closed
  //return "https://boards.4channel.org/fit/thread/57767764"        // Open
  //return "http://boards.4chan.org/" + board + "/catalog";
};

const crawlCatalogue = async () => {
  console.log("Starting crawl process for /" + board + "/");
  const nightmare = new Nightmare({ show: false });
  try {
    let threadArray = [];
    let threads = await nightmare
      .goto(url(board))
      .evaluate(() => {
        //let res_no = parseInt(document.post.elements['resto'].value);
        let res_no = parseInt(document.getElementsByClassName("thread")[0].id.slice(1));
        let ts_stats = document.getElementsByClassName("thread-stats")[0].innerHTML;
        let ts_replies = parseInt(document.getElementsByClassName("ts-replies")[0].innerHTML);
        let ts_images = parseInt(document.getElementsByClassName("ts-images")[0].innerHTML);
        let ts_ips = undefined;
        if (!ts_stats.includes("Archived"))
          ts_ips = parseInt(document.getElementsByClassName("ts-ips")[0].innerHTML);
        let elements = Array.from(document.getElementsByClassName("postContainer"));

        return {
          resno: res_no, 
          ts_stats: ts_stats, 
          ts_replies: ts_replies,
          ts_images: ts_images, 
          ts_ips: ts_ips, 
          replies: elements.map((elem) => {
          return {
            content: elem.innerHTML,
          };
        })};
      })
      .end()
      .then((threads) => {
        console.log(
          "Found " + threads.replies.length + " threads. Mapping to objects..."
        );
        let formatted = {
          post: 
          threads.replies.map((item) => {
            let $ = cheerio.load(item.content);
            let isOP = $(".sideArrows").length == 0;
            let isSticky = threads.ts_stats.includes("Sticky") ? 1 : undefined;
            let isClosed = threads.ts_stats.includes("Closed") ? 1 : undefined;
            let isArchived = threads.ts_stats.includes("Archived") ? 1: undefined;
            let uniqueIps = threads.ts_ips;

            let resto = 0;
            let filename = $(".file .fileText a").attr("href");
            let fext = "";
            let fsize = 0;
            if ( filename != undefined ) {
              fext = "." + filename.split('.').pop();
            }

            data = {
              no: parseInt($("input[value=delete]").attr("name")),
              resno: isOP ? 0 : threads.resno,
              sticky: isOP ? isSticky : undefined,
              closed: isOP ? isClosed : undefined,
              now: $("span[class='dateTime']").text(),
              time: $("span[class='dateTime']").attr("data-utc"),
              name: $(".desktop span[class='name']").text(),
              trip: $(".desktop span[class='postertrip']").text(),
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
              tn_w: $(".fileThumb > img").attr("style"),
              tn_h: $(".fileThumb > img").attr("style"),
              filedeleted: "",        // ?
              spoiler: "",            // ?
              custom_spoiler: "",     // ?
              replies: isOP ? threads.ts_replies : undefined,
              images: isOP ? threads.ts_images : undefined,
              bumplimit: isOP ? "" : undefined,          // ?
              imagelimit: isOP ? "" : undefined,         // ?
              tag: isOP ? "" : undefined,                // ?
              semantic_url: isOP ? "" : undefined,       // ?
              since4pass: "",         // ?
              unique_ips: (isOP && !isArchived) ? uniqueIps : undefined,
              m_img: isOP ? "" : undefined,              // ?
              archived: isOP ? isArchived : undefined,
              archived_on: isOP ? "" : undefined,        // ?
            };
            return data;
          })
        };
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
