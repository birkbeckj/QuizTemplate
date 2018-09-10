const request = require('request');
BASE_ID = `appahbUfwrO59Y77d`;
TABLE_NAME = `tbltbpNoBBiYe8DiY`;
API_KEY = ``;

function getAirtable() {
    return new Promise((resolve, reject) => {
      request({
        url: `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/?api_key=${API_KEY}`,
        json: true
      }, (error, response, body) => {
        if (!error && response.statusCode === 200) {
          resolve(body);
        } else
          reject("Cannot Reach Questions");
      });
    });
  };

async function testAirTable() {
    record = await getAirtable()
    console.log(`The first Easy Question is : ${record.records[0].fields.Easy}`);
    console.log(`The first Hard Question is : ${record.records[0].fields.Hard}`);
    console.log(`The first Answer is : ${record.records[0].fields.Answer}`);
    console.log(`There are ${record.records.length} Questions`);
};

testAirTable()