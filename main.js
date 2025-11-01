const cheerio = require('cheerio');
const fs = require('fs');
const http = require("node:http");

const main = async () => {
    const server = http.createServer(async(req, res) => {
        if (!apiTokenCheck(req.headers['x-api-token'] ?? '')) {
            res.writeHead(401, {'Content-Type': 'application/json'});
            return res.end(JSON.stringify({
                status: 'error',
                message: 'Unauthorized',
            }));
        }

        let html;

        const cachedFile = getCachedFile()

        if (cachedFile) {
            html = cachedFile
        } else {
            const fetchedData = await fetch('https://bigpara.hurriyet.com.tr/altin/')
            html = await fetchedData.text();
            saveAsCache(html)
        }

        const jsonGoldData = parseFile(html);

        res.writeHead(200, {"Content-Type": "application/json"});

        res.end(JSON.stringify(jsonGoldData.map((item) => {
            return {
                name: item["Adi"],
                symbol: item["Sembol"],
                buyingPrice: item["Alis"],
                sellingPrice: item["Satis"],
            }
        })));
    })

    server.listen(process.env.PORT ?? 3000, () => {
        console.log(`Server running at http://localhost:${process.env.PORT ?? 3000}/`);
    });
}

const saveAsCache = (data) => {
    if (!fs.existsSync('./cache/')){
        fs.mkdirSync('./cache/');
    }

    fs.writeFileSync(`./cache/${getFormattedTimestamp()}`, data)
}

const getCachedFile = () => {
    const fileTimestamp = getFormattedTimestamp();

    if (fs.existsSync(`./cache/${fileTimestamp}`)) {
        return fs.readFileSync(`./cache/${fileTimestamp}`).toString();
    }

    return false
}

const getFormattedTimestamp = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');

    return `${year}${month}${day}_${hour}`;
}

const parseFile = (html) => {
    const $ = cheerio.load(html)
    const regExp = /var\s+altinData\s*=\s*(\[[\s\S]*?]);/;

    const goldData = $('script').text().match(regExp)

    if (goldData) {
        const jsonArray = goldData[1];

        return JSON.parse(jsonArray)
    }
}

const apiTokenCheck = (token) => {
    return process.env.API_TOKEN === token;
}

main()
