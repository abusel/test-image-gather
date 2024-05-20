import express from "express";
import puppeteer from "puppeteer";

class App {
  public express;

  constructor() {
    this.express = express();
    this.mountRoutes();
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", async (req, res) => {
      const url = req.query.url as string;

      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      await page.goto(url, { waitUntil: "networkidle2" });
      const minWidth = req.query.minWidth
        ? parseInt(req.query.minWidth as string)
        : 500;
      const useClickThrough = true;
      let [imageSrcs, links] = await page.evaluate(
        (minWidth: number): [string[], string[]] => {
          const selector = "img";
          const images = Array.from(document.querySelectorAll(selector));
          let links = Array.from(document.querySelectorAll("a"))
            .map((a) => a.href)
            .filter((href) => href);

          let imageSrcs = images
            .filter(
              (image) =>
                image.naturalWidth > minWidth ||
                image.getBoundingClientRect().width > minWidth
            )
            .map((img) => img.src)
            .filter((src) => src);

          return [imageSrcs, links];
        },
        minWidth
      );

      if (useClickThrough) {
        for (const link of links) {
          await page.goto(link, { waitUntil: "domcontentloaded" });

          let newImageSrcs = await page.evaluate(
            (minWidth: number): string[] => {
              const selector = "img";
              const images = Array.from(document.querySelectorAll(selector));
              let imageSrcs = images
                .filter(
                  (image) =>
                    image.naturalWidth > minWidth ||
                    image.getBoundingClientRect().width > minWidth
                )
                .map((img) => img.src)
                .filter((src) => src);

              return imageSrcs;
            },
            minWidth
          );
          imageSrcs = imageSrcs.concat(newImageSrcs);
        }
      }

      await browser.close();
      res.send(imageSrcs);
    });
    this.express.use("/", router);
  }
}

export default new App().express;
