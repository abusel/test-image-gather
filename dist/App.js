var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import express from "express";
import puppeteer from "puppeteer";
class App {
    constructor() {
        this.express = express();
        this.mountRoutes();
    }
    mountRoutes() {
        const router = express.Router();
        router.get("/", (req, res) => __awaiter(this, void 0, void 0, function* () {
            const url = req.query.url;
            const browser = yield puppeteer.launch({
                headless: true,
                args: ["--no-sandbox", "--disable-setuid-sandbox"],
            });
            const page = yield browser.newPage();
            yield page.goto(url, { waitUntil: "networkidle2" });
            const minWidth = req.query.minWidth
                ? parseInt(req.query.minWidth)
                : 500;
            const useClickThrough = true;
            let [imageSrcs, links] = yield page.evaluate((minWidth) => {
                const selector = "img";
                const images = Array.from(document.querySelectorAll(selector));
                let links = Array.from(document.querySelectorAll("a"))
                    .map((a) => a.href)
                    .filter((href) => href);
                let imageSrcs = images
                    .filter((image) => image.naturalWidth > minWidth ||
                    image.getBoundingClientRect().width > minWidth)
                    .map((img) => img.src)
                    .filter((src) => src);
                return [imageSrcs, links];
            }, minWidth);
            if (useClickThrough) {
                for (const link of links) {
                    yield page.goto(link, { waitUntil: "domcontentloaded" });
                    let newImageSrcs = yield page.evaluate((minWidth) => {
                        const selector = "img";
                        const images = Array.from(document.querySelectorAll(selector));
                        let imageSrcs = images
                            .filter((image) => image.naturalWidth > minWidth ||
                            image.getBoundingClientRect().width > minWidth)
                            .map((img) => img.src)
                            .filter((src) => src);
                        return imageSrcs;
                    }, minWidth);
                    imageSrcs = imageSrcs.concat(newImageSrcs);
                }
            }
            yield browser.close();
            res.send(imageSrcs);
        }));
        this.express.use("/", router);
    }
}
export default new App().express;
